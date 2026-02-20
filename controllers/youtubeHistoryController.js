const youtubeHistoryService = require('../services/YouTubeHistoryService');
const watchActivityEmitter = require('../utils/watchActivityEmitter');

/**
 * @desc    Get full progress dashboard
 * @route   GET /api/youtube-tracker
 * @access  Private
 */
exports.getProgress = async (req, res) => {
  try {
    const data = await youtubeHistoryService.getProgress(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker getProgress error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Grant tracking consent
 * @route   POST /api/youtube-tracker/consent
 * @access  Private
 */
exports.grantConsent = async (req, res) => {
  try {
    const data = await youtubeHistoryService.grantConsent(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker grantConsent error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Revoke tracking consent
 * @route   DELETE /api/youtube-tracker/consent
 * @access  Private
 */
exports.revokeConsent = async (req, res) => {
  try {
    const clearData = req.query.clearData === 'true';
    const data = await youtubeHistoryService.revokeConsent(req.user._id, clearData);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker revokeConsent error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Add playlist to track
 * @route   POST /api/youtube-tracker/playlist
 * @access  Private
 */
exports.addPlaylist = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'Playlist URL is required' });
    }
    const data = await youtubeHistoryService.addPlaylist(req.user._id, url);
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker addPlaylist error:', err.message);
    const status = err.message.includes('already') || err.message.includes('Invalid') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get playlist progress detail
 * @route   GET /api/youtube-tracker/playlist/:playlistId
 * @access  Private
 */
exports.getPlaylistProgress = async (req, res) => {
  try {
    const data = await youtubeHistoryService.getPlaylistProgress(req.user._id, req.params.playlistId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker getPlaylistProgress error:', err.message);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Remove playlist from tracking
 * @route   DELETE /api/youtube-tracker/playlist/:playlistId
 * @access  Private
 */
exports.removePlaylist = async (req, res) => {
  try {
    const data = await youtubeHistoryService.removePlaylist(req.user._id, req.params.playlistId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker removePlaylist error:', err.message);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Add standalone video to track
 * @route   POST /api/youtube-tracker/video
 * @access  Private
 */
exports.addVideo = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'Video URL is required' });
    }
    const data = await youtubeHistoryService.addVideo(req.user._id, url);
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker addVideo error:', err.message);
    const status = err.message.includes('already') || err.message.includes('Invalid') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update video watch progress
 * @route   PUT /api/youtube-tracker/video/:videoId/progress
 * @access  Private
 */
exports.updateVideoProgress = async (req, res) => {
  try {
    const { watchProgress } = req.body;
    const progress = watchProgress !== undefined ? watchProgress : 100;
    const data = await youtubeHistoryService.markVideoWatched(req.user._id, req.params.videoId, progress);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker updateVideoProgress error:', err.message);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Mark video as unwatched
 * @route   PUT /api/youtube-tracker/video/:videoId/unwatch
 * @access  Private
 */
exports.unwatchVideo = async (req, res) => {
  try {
    const data = await youtubeHistoryService.markVideoUnwatched(req.user._id, req.params.videoId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker unwatchVideo error:', err.message);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Remove standalone video from tracking
 * @route   DELETE /api/youtube-tracker/video/:videoId
 * @access  Private
 */
exports.removeVideo = async (req, res) => {
  try {
    const data = await youtubeHistoryService.removeVideo(req.user._id, req.params.videoId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker removeVideo error:', err.message);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Auto-track videos from Chrome extension (batch)
 * @route   POST /api/youtube-tracker/auto-track
 * @access  Private
 */
exports.autoTrackVideos = async (req, res) => {
  try {
    const { videos } = req.body;
    if (!videos || !Array.isArray(videos)) {
      return res.status(400).json({ success: false, message: 'videos array is required' });
    }
    const data = await youtubeHistoryService.autoTrackVideos(req.user._id, videos);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker autoTrack error:', err.message);
    const status = err.message.includes('Consent') ? 403 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get paginated auto-tracked video history
 * @route   GET /api/youtube-tracker/auto-tracked
 * @access  Private
 */
exports.getAutoTracked = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const data = await youtubeHistoryService.getAutoTrackedHistory(req.user._id, page, limit);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('YouTube Tracker getAutoTracked error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Live activity stream (SSE) for real-time dashboard updates
 * @route   GET /api/youtube-tracker/live
 * @access  Private
 */
exports.liveActivity = async (req, res) => {
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  });

  const userId = req.user._id.toString();

  // Send initial data
  try {
    const progress = await youtubeHistoryService.getProgress(userId);
    const recentAuto = await youtubeHistoryService.getAutoTrackedHistory(userId, 1, 10);
    res.write(`data: ${JSON.stringify({
      type: 'INIT',
      stats: progress.stats,
      recentVideos: recentAuto.videos,
      timestamp: new Date().toISOString(),
    })}\n\n`);
  } catch (err) {
    console.error('SSE init error:', err.message);
  }

  // Listen for real-time updates
  const handler = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      // Connection might be closed
    }
  };

  watchActivityEmitter.on(`activity:${userId}`, handler);

  // Keep-alive ping every 30s
  const keepAlive = setInterval(() => {
    try {
      res.write(`: keep-alive\n\n`);
    } catch (e) {
      clearInterval(keepAlive);
    }
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    watchActivityEmitter.off(`activity:${userId}`, handler);
    clearInterval(keepAlive);
  });
};
