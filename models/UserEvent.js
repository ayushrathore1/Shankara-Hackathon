const mongoose = require('mongoose');

/**
 * User Event Model - Event Store Pattern
 * Immutable record of all user actions for analytics, resume generation, and AI personalization
 * 
 * Events are append-only and never modified after creation.
 * Use aggregations on this collection for analytics and behavior analysis.
 */
const UserEventSchema = new mongoose.Schema({
  // Reference to the user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Event Classification
  eventType: {
    type: String,
    required: true,
    enum: [
      // Learning Events
      'resource_started',
      'resource_progress',
      'resource_completed',
      'path_enrolled',
      'path_milestone_completed',
      'path_completed',
      'path_abandoned',
      
      // Assessment Events
      'quiz_started',
      'quiz_completed',
      'quiz_passed',
      'quiz_failed',
      'challenge_started',
      'challenge_submitted',
      'challenge_passed',
      'challenge_failed',
      
      // Skill Events
      'skill_updated',
      'skill_level_up',
      
      // Project Events
      'project_created',
      'project_submitted',
      'project_approved',
      'project_rejected',
      'review_given',
      'review_received',
      
      // Team Events
      'team_created',
      'team_joined',
      'team_left',
      
      // Engagement Events
      'daily_login',
      'streak_achieved',
      'achievement_unlocked',
      'xp_earned',
      
      // Profile Events
      'profile_updated',
      'profile_shared',
      'profile_exported',
      
      // Subscription Events
      'subscription_started',
      'subscription_upgraded',
      'subscription_downgraded',
      'subscription_cancelled',
      'subscription_renewed',
      
      // System Events
      'account_created',
      'settings_updated',
      'notification_sent',
      'ai_recommendation_shown',
      'ai_recommendation_clicked'
    ],
    index: true
  },

  // Event Category (for easier filtering)
  category: {
    type: String,
    enum: ['learning', 'assessment', 'skill', 'project', 'team', 'engagement', 'profile', 'subscription', 'system'],
    required: true,
    index: true
  },

  // Event Data (flexible JSON for event-specific details)
  data: {
    // Resource/Path related
    resourceId: mongoose.Schema.Types.ObjectId,
    resourceTitle: String,
    resourceType: String,
    pathId: mongoose.Schema.Types.ObjectId,
    pathTitle: String,
    milestoneIndex: Number,
    milestoneTitle: String,
    
    // Progress related
    progressBefore: Number,
    progressAfter: Number,
    timeSpent: Number, // minutes
    completionRate: Number,
    
    // Assessment related
    quizId: mongoose.Schema.Types.ObjectId,
    challengeId: mongoose.Schema.Types.ObjectId,
    score: Number,
    maxScore: Number,
    passingScore: Number,
    questionsAnswered: Number,
    correctAnswers: Number,
    timeTaken: Number, // seconds
    
    // Skill related
    skillName: String,
    skillBefore: Number,
    skillAfter: Number,
    skillLevel: String,
    xpEarned: Number,
    
    // Project related
    projectId: mongoose.Schema.Types.ObjectId,
    projectTitle: String,
    teamId: mongoose.Schema.Types.ObjectId,
    rating: Number,
    reviewId: mongoose.Schema.Types.ObjectId,
    
    // Subscription related
    tierBefore: String,
    tierAfter: String,
    subscriptionId: String,
    
    // Streak/Achievement
    streakCount: Number,
    achievementId: String,
    achievementName: String,
    
    // AI related
    recommendationType: String,
    recommendedItems: [mongoose.Schema.Types.Mixed],
    
    // Metadata
    source: String, // 'web', 'mobile', 'api'
    sessionId: String,
    ipAddress: String,
    userAgent: String
  },

  // Timestamp (separate from Mongoose timestamps for explicit control)
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Version for schema evolution
  schemaVersion: {
    type: Number,
    default: 1
  }
}, {
  timestamps: false, // We use our own timestamp
  collection: 'user_events' // Explicit collection name
});

// Compound indexes for efficient querying
UserEventSchema.index({ user: 1, timestamp: -1 }); // User's recent events
UserEventSchema.index({ user: 1, eventType: 1, timestamp: -1 }); // User's events by type
UserEventSchema.index({ user: 1, category: 1, timestamp: -1 }); // User's events by category
UserEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // TTL: 1 year for GDPR

// Static: Record an event
UserEventSchema.statics.record = async function(userId, eventType, category, data = {}) {
  return this.create({
    user: userId,
    eventType,
    category,
    data,
    timestamp: new Date()
  });
};

// Static: Get user's recent events
UserEventSchema.statics.getRecentEvents = function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static: Get user's events by type
UserEventSchema.statics.getEventsByType = function(userId, eventType, options = {}) {
  const { limit = 50, startDate, endDate } = options;
  
  const query = { user: userId, eventType };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static: Get user's activity summary for a date range
UserEventSchema.statics.getActivitySummary = async function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          category: '$category'
        },
        count: { $sum: 1 },
        events: { $push: '$eventType' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        categories: {
          $push: {
            category: '$_id.category',
            count: '$count',
            events: '$events'
          }
        },
        totalEvents: { $sum: '$count' }
      }
    },
    { $sort: { _id: -1 } }
  ]);
};

// Static: Get learning statistics (field names match dashboard expectations)
UserEventSchema.statics.getLearningStats = async function(userId) {
  const userObjId = new mongoose.Types.ObjectId(userId);

  // Aggregate learning + engagement events in one pass
  const stats = await this.aggregate([
    {
      $match: {
        user: userObjId,
        category: { $in: ['learning', 'engagement'] }
      }
    },
    {
      $group: {
        _id: null,
        completedResources: {
          $sum: { $cond: [{ $eq: ['$eventType', 'resource_completed'] }, 1, 0] }
        },
        resourcesStarted: {
          $sum: { $cond: [{ $eq: ['$eventType', 'resource_started'] }, 1, 0] }
        },
        pathsEnrolled: {
          $sum: { $cond: [{ $eq: ['$eventType', 'path_enrolled'] }, 1, 0] }
        },
        pathsCompleted: {
          $sum: { $cond: [{ $eq: ['$eventType', 'path_completed'] }, 1, 0] }
        },
        totalXP: { $sum: { $ifNull: ['$data.xpEarned', 0] } },
        totalTimeSpent: { $sum: { $ifNull: ['$data.timeSpent', 0] } }
      }
    }
  ]);

  // Calculate current streak from daily_login events
  let currentStreak = 0;
  try {
    const loginDays = await this.aggregate([
      {
        $match: {
          user: userObjId,
          eventType: 'daily_login'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    if (loginDays.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);

      for (const day of loginDays) {
        const dayDate = new Date(day._id + 'T00:00:00');
        const diffDays = Math.round((checkDate - dayDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          currentStreak++;
          checkDate = dayDate;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  } catch (err) {
    // Streak calculation failure shouldn't break stats
    console.error('Streak calculation error:', err.message);
  }

  const base = stats[0] || {};
  return {
    completedResources: base.completedResources || 0,
    resourcesStarted: base.resourcesStarted || 0,
    pathsEnrolled: base.pathsEnrolled || 0,
    pathsCompleted: base.pathsCompleted || 0,
    totalXP: base.totalXP || 0,
    totalTimeSpent: base.totalTimeSpent || 0,
    currentStreak
  };
};

// Static: Get skill progression history
UserEventSchema.statics.getSkillProgression = function(userId, skillName) {
  return this.find({
    user: userId,
    eventType: 'skill_updated',
    'data.skillName': skillName
  })
    .sort({ timestamp: 1 })
    .select('timestamp data.skillBefore data.skillAfter data.skillLevel')
    .lean();
};

module.exports = mongoose.model('UserEvent', UserEventSchema);
