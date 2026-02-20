const mongoose = require('mongoose');

/**
 * YouTube Watch History Model
 * Tracks user's YouTube watch history with consent for lecture/playlist/course completion tracking
 */

const trackedVideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  channelTitle: String,
  thumbnailUrl: String,
  duration: String, // ISO 8601 or human-readable
  durationSeconds: { type: Number, default: 0 },
  watched: { type: Boolean, default: false },
  watchedAt: Date,
  watchProgress: { type: Number, default: 0, min: 0, max: 100 },
  position: { type: Number, default: 0 }, // order in playlist
  notes: { type: String, maxlength: 500 }
}, { _id: true });

const trackedPlaylistSchema = new mongoose.Schema({
  playlistId: { type: String, required: true },
  title: { type: String, required: true },
  channelTitle: String,
  thumbnailUrl: String,
  description: { type: String, maxlength: 1000 },
  totalVideos: { type: Number, default: 0 },
  videos: [trackedVideoSchema],
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  startedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  isCompleted: { type: Boolean, default: false },
  completedAt: Date
}, { _id: true });

// Auto-tracked videos (reported by Chrome extension)
const autoTrackedVideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String, default: 'Untitled' },
  channelTitle: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
  durationSeconds: { type: Number, default: 0 },
  watchProgress: { type: Number, default: 0, min: 0, max: 100 },
  category: {
    type: String,
    enum: ['programming', 'tech', 'distraction', 'other'],
    default: 'other'
  },
  firstSeenAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
  watchCount: { type: Number, default: 1 }
}, { _id: true });

const YouTubeWatchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Consent tracking
  consentGranted: { type: Boolean, default: false },
  consentGrantedAt: Date,
  consentRevokedAt: Date,

  // Tracked playlists (courses)
  trackedPlaylists: [trackedPlaylistSchema],

  // Standalone tracked videos (not in a playlist)
  trackedVideos: [trackedVideoSchema],

  // Auto-tracked videos (from Chrome extension)
  autoTrackedVideos: [autoTrackedVideoSchema],

  // Aggregate stats
  stats: {
    totalPlaylists: { type: Number, default: 0 },
    completedPlaylists: { type: Number, default: 0 },
    totalVideos: { type: Number, default: 0 },
    videosWatched: { type: Number, default: 0 },
    autoTrackedCount: { type: Number, default: 0 },
    totalWatchTimeMinutes: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveAt: Date,
    categoryBreakdown: {
      programming: { type: Number, default: 0 },
      tech: { type: Number, default: 0 },
      distraction: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    // Focus insights (Component 7)
    focusScore: { type: Number, default: 0, min: 0, max: 100 },       // 0-100 focus rating
    productiveMinutes: { type: Number, default: 0 },                  // Minutes spent on programming/tech
    distractionMinutes: { type: Number, default: 0 },                 // Minutes spent on distraction
    focusRatio: { type: Number, default: 0 },                         // productive / (productive + distraction)
    longestFocusStreak: { type: Number, default: 0 },                 // Consecutive programming videos
    todayProductiveMinutes: { type: Number, default: 0 },
    todayDistractionMinutes: { type: Number, default: 0 },
    weeklyFocusScores: [{ type: Number }],                            // Last 7 days for sparkline
  }
}, {
  timestamps: true
});

// Static: Get or create history for user
YouTubeWatchHistorySchema.statics.getOrCreate = async function(userId) {
  let history = await this.findOne({ user: userId });
  if (!history) {
    history = await this.create({ user: userId });
  }
  return history;
};

// Method: Recalculate stats
YouTubeWatchHistorySchema.methods.recalculateStats = function() {
  const playlists = this.trackedPlaylists || [];
  const standaloneVideos = this.trackedVideos || [];
  const autoTracked = this.autoTrackedVideos || [];

  // Count all videos across playlists + standalone
  const playlistVideos = playlists.reduce((acc, p) => acc + (p.videos?.length || 0), 0);
  const totalVideos = playlistVideos + standaloneVideos.length;

  // Count watched videos
  const playlistWatched = playlists.reduce(
    (acc, p) => acc + (p.videos?.filter(v => v.watched).length || 0), 0
  );
  const standaloneWatched = standaloneVideos.filter(v => v.watched).length;
  const videosWatched = playlistWatched + standaloneWatched;

  // Auto-tracked count
  const autoTrackedCount = autoTracked.length;

  // Category breakdown from auto-tracked videos
  const categoryBreakdown = { programming: 0, tech: 0, distraction: 0, other: 0 };
  for (const v of autoTracked) {
    const cat = v.category || 'other';
    if (categoryBreakdown[cat] !== undefined) {
      categoryBreakdown[cat]++;
    } else {
      categoryBreakdown.other++;
    }
  }

  // Update playlist completion percentages
  for (const playlist of playlists) {
    if (playlist.videos && playlist.videos.length > 0) {
      const watched = playlist.videos.filter(v => v.watched).length;
      playlist.completionPercentage = Math.round((watched / playlist.videos.length) * 100);
      playlist.isCompleted = playlist.completionPercentage === 100;
      if (playlist.isCompleted && !playlist.completedAt) {
        playlist.completedAt = new Date();
      }
    }
  }

  // Completed playlists
  const completedPlaylists = playlists.filter(p => p.isCompleted).length;

  // Estimate watch time (sum of durationSeconds for watched videos)
  const playlistTime = playlists.reduce(
    (acc, p) => acc + (p.videos?.filter(v => v.watched).reduce((a, v) => a + (v.durationSeconds || 0), 0) || 0), 0
  );
  const standaloneTime = standaloneVideos.filter(v => v.watched).reduce((a, v) => a + (v.durationSeconds || 0), 0);
  // Auto-tracked watch time (estimate based on progress)
  const autoTrackedTime = autoTracked.reduce((a, v) => {
    const watched = (v.watchProgress || 0) / 100;
    return a + Math.round((v.durationSeconds || 0) * watched);
  }, 0);
  const totalWatchTimeMinutes = Math.round((playlistTime + standaloneTime + autoTrackedTime) / 60);

  this.stats = {
    ...this.stats,
    totalPlaylists: playlists.length,
    completedPlaylists,
    totalVideos,
    videosWatched,
    autoTrackedCount,
    totalWatchTimeMinutes,
    lastActiveAt: new Date(),
    categoryBreakdown,
  };

  // ─── Focus Insights Calculation ──────────────────────────
  const productiveMinutes = autoTracked.reduce((a, v) => {
    if (v.category === 'programming' || v.category === 'tech') {
      const watched = (v.watchProgress || 0) / 100;
      return a + Math.round(((v.durationSeconds || 0) * watched) / 60);
    }
    return a;
  }, 0);

  const distractionMinutes = autoTracked.reduce((a, v) => {
    if (v.category === 'distraction') {
      const watched = (v.watchProgress || 0) / 100;
      return a + Math.round(((v.durationSeconds || 0) * watched) / 60);
    }
    return a;
  }, 0);

  const totalFocusMinutes = productiveMinutes + distractionMinutes;
  const focusRatio = totalFocusMinutes > 0 ? productiveMinutes / totalFocusMinutes : 0;
  const focusScore = Math.round(focusRatio * 100);

  // Longest consecutive programming/tech videos (focus streak)
  let longestFocusStreak = 0;
  let currentFocusStreak = 0;
  const sortedAuto = [...autoTracked].sort((a, b) => 
    new Date(a.lastUpdatedAt || a.firstSeenAt) - new Date(b.lastUpdatedAt || b.firstSeenAt)
  );
  for (const v of sortedAuto) {
    if (v.category === 'programming' || v.category === 'tech') {
      currentFocusStreak++;
      longestFocusStreak = Math.max(longestFocusStreak, currentFocusStreak);
    } else if (v.category === 'distraction') {
      currentFocusStreak = 0;
    }
  }

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayVideos = autoTracked.filter(v => {
    const date = v.lastUpdatedAt || v.firstSeenAt;
    return date && new Date(date) >= today;
  });
  const todayProductiveMinutes = todayVideos.reduce((a, v) => {
    if (v.category === 'programming' || v.category === 'tech') {
      return a + Math.round(((v.durationSeconds || 0) * ((v.watchProgress || 0) / 100)) / 60);
    }
    return a;
  }, 0);
  const todayDistractionMinutes = todayVideos.reduce((a, v) => {
    if (v.category === 'distraction') {
      return a + Math.round(((v.durationSeconds || 0) * ((v.watchProgress || 0) / 100)) / 60);
    }
    return a;
  }, 0);

  this.stats.focusScore = focusScore;
  this.stats.productiveMinutes = productiveMinutes;
  this.stats.distractionMinutes = distractionMinutes;
  this.stats.focusRatio = Math.round(focusRatio * 100) / 100;
  this.stats.longestFocusStreak = longestFocusStreak;
  this.stats.todayProductiveMinutes = todayProductiveMinutes;
  this.stats.todayDistractionMinutes = todayDistractionMinutes;

  return this;
};

// Method: Update streak
YouTubeWatchHistorySchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = this.stats.lastActiveAt ? new Date(this.stats.lastActiveAt) : null;

  if (!lastActive) {
    this.stats.currentStreak = 1;
    this.stats.longestStreak = 1;
    return;
  }

  lastActive.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same day — no change
  } else if (daysDiff === 1) {
    this.stats.currentStreak = (this.stats.currentStreak || 0) + 1;
  } else {
    this.stats.currentStreak = 1;
  }

  if (this.stats.currentStreak > (this.stats.longestStreak || 0)) {
    this.stats.longestStreak = this.stats.currentStreak;
  }
};

module.exports = mongoose.model('YouTubeWatchHistory', YouTubeWatchHistorySchema);
