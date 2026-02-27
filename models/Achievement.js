const mongoose = require('mongoose');

/**
 * Achievement Model
 * Tracks user achievements/badges across the platform
 */
const AchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Achievement identifier (unique per achievement type)
  achievementId: {
    type: String,
    required: true,
    trim: true
  },

  // Display info
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏆'
  },

  // Category
  category: {
    type: String,
    enum: [
      'skill-mastery',    // Related to skill scores/levels
      'consistency',      // Streaks, daily activity
      'collaboration',    // Team projects, peer reviews
      'career-milestone', // Career journey progress
      'learning',         // Course/path completion
      'community',        // Charcha, helping others
      'explorer'          // Trying new features, domains
    ],
    required: true
  },

  // Tier/rarity
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },

  // Rewards
  xpReward: {
    type: Number,
    default: 50
  },
  premiumDaysReward: {
    type: Number,
    default: 0
  },

  // When earned
  unlockedAt: {
    type: Date,
    default: Date.now
  },

  // Progress tracking (for progressive achievements)
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    isComplete: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Compound index: one achievement per user
AchievementSchema.index({ user: 1, achievementId: 1 }, { unique: true });

// Static: Get all achievements for a user
AchievementSchema.statics.getUserAchievements = function(userId, options = {}) {
  const { category, tier } = options;
  const query = { user: userId };
  if (category) query.category = category;
  if (tier) query.tier = tier;
  
  return this.find(query).sort({ unlockedAt: -1 }).lean();
};

// Static: Check if user has specific achievement
AchievementSchema.statics.hasAchievement = async function(userId, achievementId) {
  const count = await this.countDocuments({ user: userId, achievementId });
  return count > 0;
};

// Static: Award achievement (idempotent — won't duplicate)
AchievementSchema.statics.award = async function(userId, achievementData) {
  const existing = await this.findOne({ user: userId, achievementId: achievementData.achievementId });
  if (existing) return { awarded: false, achievement: existing };

  const achievement = await this.create({
    user: userId,
    ...achievementData,
    unlockedAt: new Date()
  });

  return { awarded: true, achievement };
};

// Static: Get achievement counts by category
AchievementSchema.statics.getCategoryCounts = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
};

module.exports = mongoose.model('Achievement', AchievementSchema);
