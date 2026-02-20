const BaseService = require('./BaseService');
const YouTubeWatchHistory = require('../models/YouTubeWatchHistory');
const youtubeService = require('./YouTubeService');
const { classifyVideo } = require('../utils/videoClassifier');
const watchActivityEmitter = require('../utils/watchActivityEmitter');
const watchJourneyBridge = require('./WatchJourneyBridge');
const distractionAlertService = require('./DistractionAlertService');

/**
 * YouTubeHistoryService — Manages user's YouTube watch history tracking
 * Handles consent, playlist/video tracking, and progress updates
 */
class YouTubeHistoryService extends BaseService {
  constructor() {
    super('YouTubeHistoryService');
  }

  /**
   * Grant consent for YouTube history tracking
   */
  async grantConsent(userId) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);
    history.consentGranted = true;
    history.consentGrantedAt = new Date();
    history.consentRevokedAt = undefined;
    await history.save();
    return { success: true, consentGranted: true };
  }

  /**
   * Revoke consent and optionally clear all data
   */
  async revokeConsent(userId, clearData = false) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);
    history.consentGranted = false;
    history.consentRevokedAt = new Date();

    if (clearData) {
      history.trackedPlaylists = [];
      history.trackedVideos = [];
      history.stats = {
        totalPlaylists: 0,
        completedPlaylists: 0,
        totalVideos: 0,
        videosWatched: 0,
        totalWatchTimeMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveAt: null
      };
    }

    await history.save();
    return { success: true, consentGranted: false, dataCleared: clearData };
  }

  /**
   * Get consent status
   */
  async getConsentStatus(userId) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);
    return {
      consentGranted: history.consentGranted,
      consentGrantedAt: history.consentGrantedAt
    };
  }

  /**
   * Add a YouTube playlist for tracking
   */
  async addPlaylist(userId, playlistUrl) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);

    if (!history.consentGranted) {
      throw new Error('Consent not granted. Please grant consent before tracking.');
    }

    // Extract playlist ID
    const playlistId = youtubeService.extractPlaylistId(playlistUrl);
    if (!playlistId) {
      throw new Error('Invalid YouTube playlist URL');
    }

    // Check if already tracked
    const existing = history.trackedPlaylists.find(p => p.playlistId === playlistId);
    if (existing) {
      throw new Error('This playlist is already being tracked');
    }

    // Fetch playlist details from YouTube API
    const playlistDetails = await youtubeService.getPlaylistDetails(playlistId);
    if (!playlistDetails) {
      throw new Error('Could not fetch playlist details. Please check the URL.');
    }

    // Fetch playlist items (videos)
    const playlistItems = await youtubeService.getPlaylistItems(playlistId, 200);

    // Build video entries
    const videos = (playlistItems || []).map((item, index) => ({
      videoId: item.videoId || item.snippet?.resourceId?.videoId,
      title: item.title || item.snippet?.title || 'Untitled',
      channelTitle: item.channelTitle || item.snippet?.videoOwnerChannelTitle || '',
      thumbnailUrl: item.thumbnail || item.snippet?.thumbnails?.medium?.url || '',
      duration: item.duration || '',
      durationSeconds: item.durationSeconds || 0,
      position: index,
      watched: false,
      watchProgress: 0
    }));

    // Create the tracked playlist entry
    const trackedPlaylist = {
      playlistId,
      title: playlistDetails.title || 'Untitled Playlist',
      channelTitle: playlistDetails.channelTitle || '',
      thumbnailUrl: playlistDetails.thumbnailUrl || playlistDetails.thumbnail || '',
      description: (playlistDetails.description || '').substring(0, 1000),
      totalVideos: videos.length,
      videos,
      completionPercentage: 0,
      startedAt: new Date(),
      lastActivityAt: new Date()
    };

    history.trackedPlaylists.push(trackedPlaylist);
    history.recalculateStats();
    await history.save();

    return {
      success: true,
      playlist: trackedPlaylist
    };
  }

  /**
   * Add a standalone video for tracking
   */
  async addVideo(userId, videoUrl) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);

    if (!history.consentGranted) {
      throw new Error('Consent not granted. Please grant consent before tracking.');
    }

    // Extract video ID
    const videoId = youtubeService.extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube video URL');
    }

    // Check if already tracked (standalone or in a playlist)
    const existingStandalone = history.trackedVideos.find(v => v.videoId === videoId);
    if (existingStandalone) {
      throw new Error('This video is already being tracked');
    }

    // Fetch video details
    const videoDetails = await youtubeService.getVideoDetails(videoId);
    if (!videoDetails) {
      throw new Error('Could not fetch video details. Please check the URL.');
    }

    const trackedVideo = {
      videoId,
      title: videoDetails.title || 'Untitled',
      channelTitle: videoDetails.channelTitle || '',
      thumbnailUrl: videoDetails.thumbnail || '',
      duration: videoDetails.duration || '',
      durationSeconds: videoDetails.durationSeconds || 0,
      watched: false,
      watchProgress: 0,
      position: history.trackedVideos.length
    };

    history.trackedVideos.push(trackedVideo);
    history.recalculateStats();
    await history.save();

    return { success: true, video: trackedVideo };
  }

  /**
   * Mark a video as watched (in a playlist or standalone)
   */
  async markVideoWatched(userId, videoId, watchProgress = 100) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);

    if (!history.consentGranted) {
      throw new Error('Consent not granted.');
    }

    let found = false;

    // Check playlists
    for (const playlist of history.trackedPlaylists) {
      const video = playlist.videos.find(v => v.videoId === videoId);
      if (video) {
        video.watched = watchProgress >= 90; // 90%+ = watched
        video.watchProgress = watchProgress;
        video.watchedAt = watchProgress >= 90 ? new Date() : video.watchedAt;
        playlist.lastActivityAt = new Date();
        found = true;
        break;
      }
    }

    // Check standalone
    if (!found) {
      const video = history.trackedVideos.find(v => v.videoId === videoId);
      if (video) {
        video.watched = watchProgress >= 90;
        video.watchProgress = watchProgress;
        video.watchedAt = watchProgress >= 90 ? new Date() : video.watchedAt;
        found = true;
      }
    }

    if (!found) {
      throw new Error('Video not found in tracked history');
    }

    history.updateStreak();
    history.recalculateStats();
    await history.save();

    return { success: true, videoId, watchProgress };
  }

  /**
   * Mark a video as unwatched (toggle off)
   */
  async markVideoUnwatched(userId, videoId) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);

    let found = false;

    // Check playlists
    for (const playlist of history.trackedPlaylists) {
      const video = playlist.videos.find(v => v.videoId === videoId);
      if (video) {
        video.watched = false;
        video.watchProgress = 0;
        video.watchedAt = undefined;
        playlist.lastActivityAt = new Date();
        found = true;
        break;
      }
    }

    // Check standalone
    if (!found) {
      const video = history.trackedVideos.find(v => v.videoId === videoId);
      if (video) {
        video.watched = false;
        video.watchProgress = 0;
        video.watchedAt = undefined;
        found = true;
      }
    }

    if (!found) {
      throw new Error('Video not found in tracked history');
    }

    history.recalculateStats();
    await history.save();

    return { success: true, videoId };
  }

  /**
   * Get full progress dashboard
   */
  async getProgress(userId) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);

    return {
      consentGranted: history.consentGranted,
      consentGrantedAt: history.consentGrantedAt,
      trackedPlaylists: history.trackedPlaylists.map(p => ({
        _id: p._id,
        playlistId: p.playlistId,
        title: p.title,
        channelTitle: p.channelTitle,
        thumbnailUrl: p.thumbnailUrl,
        description: p.description,
        totalVideos: p.totalVideos,
        videosWatched: p.videos?.filter(v => v.watched).length || 0,
        completionPercentage: p.completionPercentage,
        isCompleted: p.isCompleted,
        startedAt: p.startedAt,
        lastActivityAt: p.lastActivityAt,
        completedAt: p.completedAt
      })),
      trackedVideos: history.trackedVideos,
      stats: history.stats
    };
  }

  /**
   * Get detailed playlist progress with all videos
   */
  async getPlaylistProgress(userId, playlistId) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);
    const playlist = history.trackedPlaylists.find(p => p.playlistId === playlistId);

    if (!playlist) {
      throw new Error('Playlist not found in tracked history');
    }

    return {
      ...playlist.toObject(),
      videosWatched: playlist.videos?.filter(v => v.watched).length || 0
    };
  }

  /**
   * Remove a playlist from tracking
   */
  async removePlaylist(userId, playlistId) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);

    const index = history.trackedPlaylists.findIndex(p => p.playlistId === playlistId);
    if (index === -1) {
      throw new Error('Playlist not found');
    }

    history.trackedPlaylists.splice(index, 1);
    history.recalculateStats();
    await history.save();

    return { success: true };
  }

  /**
   * Remove a standalone video from tracking
   */
  async removeVideo(userId, videoId) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);

    const index = history.trackedVideos.findIndex(v => v.videoId === videoId);
    if (index === -1) {
      throw new Error('Video not found');
    }

    history.trackedVideos.splice(index, 1);
    history.recalculateStats();
    await history.save();

    return { success: true };
  }

  /**
   * Auto-track videos from Chrome extension (batch upsert)
   * @param {string} userId
   * @param {Array} videos - [{videoId, title, channelTitle, thumbnailUrl, duration, durationSeconds, watchProgress}]
   */
  async autoTrackVideos(userId, videos) {
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      throw new Error('No video data provided');
    }

    const history = await YouTubeWatchHistory.getOrCreate(userId);

    if (!history.consentGranted) {
      throw new Error('Consent not granted. Please grant consent before tracking.');
    }

    let upsertedCount = 0;
    const processedVideos = [];

    for (const videoData of videos) {
      if (!videoData.videoId) continue;

      // Classify the video
      const category = classifyVideo({
        title: videoData.title || '',
        channelTitle: videoData.channelTitle || '',
      });

      const existing = history.autoTrackedVideos.find(v => v.videoId === videoData.videoId);

      if (existing) {
        // Update existing — only update if new progress is higher
        if ((videoData.watchProgress || 0) > (existing.watchProgress || 0)) {
          existing.watchProgress = videoData.watchProgress;
        }
        existing.lastUpdatedAt = new Date();
        existing.watchCount = (existing.watchCount || 1) + 1;
        existing.category = category;
        // Update metadata if provided (title could change on retry)
        if (videoData.title) existing.title = videoData.title;
        if (videoData.channelTitle) existing.channelTitle = videoData.channelTitle;
        if (videoData.thumbnailUrl) existing.thumbnailUrl = videoData.thumbnailUrl;
        if (videoData.durationSeconds) existing.durationSeconds = videoData.durationSeconds;
        if (videoData.duration) existing.duration = videoData.duration;

        processedVideos.push({
          videoId: existing.videoId,
          title: existing.title,
          channelTitle: existing.channelTitle,
          thumbnailUrl: existing.thumbnailUrl,
          watchProgress: existing.watchProgress,
          category,
          isNew: false,
        });
      } else {
        // Insert new
        const newVideo = {
          videoId: videoData.videoId,
          title: videoData.title || 'Untitled',
          channelTitle: videoData.channelTitle || '',
          thumbnailUrl: videoData.thumbnailUrl || `https://i.ytimg.com/vi/${videoData.videoId}/mqdefault.jpg`,
          duration: videoData.duration || '',
          durationSeconds: videoData.durationSeconds || 0,
          watchProgress: videoData.watchProgress || 0,
          category,
          firstSeenAt: new Date(),
          lastUpdatedAt: new Date(),
          watchCount: 1
        };
        history.autoTrackedVideos.push(newVideo);

        processedVideos.push({
          videoId: newVideo.videoId,
          title: newVideo.title,
          channelTitle: newVideo.channelTitle,
          thumbnailUrl: newVideo.thumbnailUrl,
          watchProgress: newVideo.watchProgress,
          category,
          isNew: true,
        });
      }
      upsertedCount++;
    }

    history.updateStreak();
    history.recalculateStats();
    await history.save();

    // ─── Watch-to-Journey Bridge (auto-complete resources) ───
    const autoCompletions = [];
    for (const video of processedVideos) {
      try {
        const watchPercent = (video.watchProgress || 0) / 100;
        const result = await watchJourneyBridge.checkAndAutoComplete(userId, video.videoId, watchPercent);
        if (result?.autoCompleted) {
          autoCompletions.push(result);
        }
      } catch (err) {
        this.log('warn', `Bridge check failed for ${video.videoId}: ${err.message}`);
      }
    }

    // ─── Distraction Alert Check ───
    try {
      const distractionCount = processedVideos.filter(v => v.category === 'distraction').length;
      if (distractionCount > 0) {
        await distractionAlertService.checkDistractionThreshold(userId, distractionCount);
      }
    } catch (err) {
      this.log('warn', `Distraction alert check failed: ${err.message}`);
    }

    // Emit real-time event for SSE clients
    if (processedVideos.length > 0) {
      watchActivityEmitter.emit(`activity:${userId}`, {
        type: 'VIDEO_UPDATE',
        videos: processedVideos,
        stats: history.stats,
        autoCompletions: autoCompletions.length > 0 ? autoCompletions : undefined,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      upsertedCount,
      totalAutoTracked: history.autoTrackedVideos.length,
      autoCompletions: autoCompletions.length > 0 ? autoCompletions : undefined,
    };
  }

  /**
   * Get paginated auto-tracked video history
   */
  async getAutoTrackedHistory(userId, page = 1, limit = 20) {
    const history = await YouTubeWatchHistory.getOrCreate(userId);

    // Sort by lastUpdatedAt descending
    const sorted = [...(history.autoTrackedVideos || [])].sort(
      (a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt)
    );

    const total = sorted.length;
    const start = (page - 1) * limit;
    const paginated = sorted.slice(start, start + limit);

    return {
      videos: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

// Singleton
const youtubeHistoryService = new YouTubeHistoryService();
module.exports = youtubeHistoryService;
