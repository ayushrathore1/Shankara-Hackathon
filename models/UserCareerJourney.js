const mongoose = require('mongoose');

/**
 * UserCareerJourney Schema - Tracks a user's progress through a career journey
 * Each user can have one active journey at a time
 */
const userCareerJourneySchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Career selection
  career: {
    careerId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    icon: String,
    demandLevel: String,
    avgSalary: Number,
    growthRate: String
  },

  // Journey status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'switched'],
    default: 'active',
    index: true
  },

  // User preferences
  preferences: {
    weeklyHours: {
      type: Number,
      default: 10,
      min: 5,
      max: 40
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'some_experience', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    learningStyle: {
      type: String,
      enum: ['videos', 'reading', 'projects', 'mixed'],
      default: 'mixed'
    },
    notificationFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'none'],
      default: 'weekly'
    },
    // Language & region preferences for YouTube-powered learning
    language: {
      type: String,
      enum: ['en', 'hi', 'hinglish', 'ta', 'te', 'bn', 'auto'],
      default: 'auto'
    },
    region: {
      type: String,
      enum: ['IN', 'US', 'GB', 'global'],
      default: 'IN'
    },
    contentCreatorPreference: {
      type: String,
      enum: ['indian', 'international', 'no-preference'],
      default: 'no-preference'
    },
    includeAITools: {
      type: Boolean,
      default: true
    }
  },

  // Generated roadmap
  roadmap: {
    phases: [{
      phaseId: {
        type: String,
        required: true
      },
      phaseNumber: {
        type: Number,
        required: true
      },
      title: String,
      description: String,
      status: {
        type: String,
        enum: ['locked', 'in_progress', 'completed'],
        default: 'locked'
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      priority: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium'
      },
      startedAt: Date,
      completedAt: Date,
      durationWeeks: Number,
      
      // Skills to learn in this phase
      skills: [{
        skillName: String,
        skillId: mongoose.Schema.Types.ObjectId,
        targetScore: { type: Number, default: 80 },
        currentScore: { type: Number, default: 0 },
        isAcquired: { type: Boolean, default: false }
      }],
      
      // Resources to complete
      resources: [{
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'FreeResource'
        },
        externalResourceId: String, // For non-vault resources
        type: {
          type: String,
          enum: ['video', 'article', 'course', 'quiz', 'practice', 'tutorial', 'guide', 'playlist']
        },
        title: String,
        url: String,
        provider: String,           // Channel name or platform
        duration: Number,           // in minutes
        isCompleted: { type: Boolean, default: false },
        completedAt: Date,
        progress: { type: Number, default: 0 },
        order: Number,
        // YouTube video integration fields
        videoId: String,            // YouTube video ID for watch tracking bridge
        youtubeUrl: String,         // Direct YouTube link
        thumbnailUrl: String,       // Video thumbnail for UI
        qualityScore: Number,       // 0-100 from YouTubeSearchService analysis
        autoCompleted: { type: Boolean, default: false }, // Set by extension watch tracking
        autoCompletedAt: Date,
      }],
      
      // Projects for this phase
      projects: [{
        projectId: String,
        title: String,
        description: String,
        difficulty: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced']
        },
        estimatedHours: Number,
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        startedAt: Date,
        completedAt: Date,
        submissionUrl: String,
        feedback: String,
        score: Number
      }],
      
      // Milestones
      milestones: [{
        milestoneId: String,
        title: String,
        description: String,
        requiredProgress: { type: Number, default: 100 },
        isAchieved: { type: Boolean, default: false },
        achievedAt: Date,
        xpReward: { type: Number, default: 50 }
      }]
    }],
    
    // Current state
    currentPhaseId: String,
    currentPhaseNumber: { type: Number, default: 1 },
    estimatedWeeks: Number,
    generatedAt: Date,
    generatedBy: {
      type: String,
      enum: ['ai', 'default', 'custom'],
      default: 'default'
    }
  },

  // Overall stats
  stats: {
    overallProgress: { type: Number, default: 0 },
    phasesCompleted: { type: Number, default: 0 },
    resourcesCompleted: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    skillsAcquired: { type: Number, default: 0 },
    totalLearningMinutes: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    onTrackStatus: {
      type: String,
      enum: ['ahead', 'on_track', 'behind'],
      default: 'on_track'
    },
    lastActivityDate: Date
  },

  // Journey history/events (for timeline)
  history: [{
    eventType: {
      type: String,
      enum: [
        'JOURNEY_STARTED',
        'PHASE_STARTED',
        'PHASE_COMPLETED',
        'RESOURCE_COMPLETED',
        'PROJECT_STARTED',
        'PROJECT_COMPLETED',
        'SKILL_ACQUIRED',
        'MILESTONE_REACHED',
        'STREAK_ACHIEVED',
        'JOURNEY_PAUSED',
        'JOURNEY_RESUMED',
        'JOURNEY_COMPLETED',
        'ROADMAP_REGENERATED'
      ],
      required: true
    },
    eventData: mongoose.Schema.Types.Mixed,
    xpEarned: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
  }],

  // Timestamps
  startedAt: {
    type: Date,
    default: Date.now
  },
  targetDate: Date,
  completedAt: Date,
  pausedAt: Date

}, {
  timestamps: true
});

// Indexes
userCareerJourneySchema.index({ user: 1, status: 1 });
userCareerJourneySchema.index({ 'career.careerId': 1 });
userCareerJourneySchema.index({ startedAt: -1 });

/**
 * Static: Get active journey for user
 */
userCareerJourneySchema.statics.getActiveJourney = async function(userId) {
  return this.findOne({ 
    user: userId, 
    status: 'active' 
  }).lean();
};

/**
 * Static: Start a new journey
 */
userCareerJourneySchema.statics.startJourney = async function(userId, careerData, preferences, roadmap) {
  // Pause any existing active journey
  await this.updateMany(
    { user: userId, status: 'active' },
    { $set: { status: 'paused', pausedAt: new Date() } }
  );

  // Create new journey
  const journey = new this({
    user: userId,
    career: careerData,
    preferences: preferences,
    roadmap: roadmap,
    status: 'active',
    startedAt: new Date(),
    history: [{
      eventType: 'JOURNEY_STARTED',
      eventData: { career: careerData.title },
      timestamp: new Date()
    }]
  });

  await journey.save();
  return journey;
};

/**
 * Instance: Complete a resource
 */
userCareerJourneySchema.methods.completeResource = async function(phaseId, resourceId) {
  const phase = this.roadmap.phases.find(p => p.phaseId === phaseId);
  if (!phase) throw new Error('Phase not found');

  const resource = phase.resources.find(r => 
    r.resourceId?.toString() === resourceId || r.externalResourceId === resourceId
  );
  if (!resource) throw new Error('Resource not found');
  if (resource.isCompleted) return this; // Already completed

  // Mark resource completed
  resource.isCompleted = true;
  resource.completedAt = new Date();
  resource.progress = 100;

  // Update phase progress
  const completedCount = phase.resources.filter(r => r.isCompleted).length;
  const totalCount = phase.resources.length;
  phase.progress = Math.round((completedCount / totalCount) * 100);

  // Update stats
  this.stats.resourcesCompleted++;
  this.stats.totalLearningMinutes += resource.duration || 0;
  this.stats.lastActivityDate = new Date();
  this.stats.xpEarned += 10; // XP for completing resource

  // Calculate overall progress
  const allPhases = this.roadmap.phases;
  const totalProgress = allPhases.reduce((sum, p) => sum + (p.progress || 0), 0);
  this.stats.overallProgress = Math.round(totalProgress / allPhases.length);

  // Add to history
  this.history.push({
    eventType: 'RESOURCE_COMPLETED',
    eventData: { resourceId, phaseId, title: resource.title },
    xpEarned: 10,
    timestamp: new Date()
  });

  // Check if phase is complete
  if (phase.progress >= 100 && phase.status !== 'completed') {
    await this.completePhase(phaseId);
  }

  await this.save();
  return this;
};

/**
 * Instance: Complete a phase
 */
userCareerJourneySchema.methods.completePhase = async function(phaseId) {
  const phases = this.roadmap.phases;
  const phaseIndex = phases.findIndex(p => p.phaseId === phaseId);
  if (phaseIndex === -1) throw new Error('Phase not found');

  const phase = phases[phaseIndex];
  phase.status = 'completed';
  phase.completedAt = new Date();
  phase.progress = 100;

  this.stats.phasesCompleted++;
  this.stats.xpEarned += 100; // XP for completing phase

  this.history.push({
    eventType: 'PHASE_COMPLETED',
    eventData: { phaseId, title: phase.title },
    xpEarned: 100,
    timestamp: new Date()
  });

  // Unlock next phase
  if (phaseIndex < phases.length - 1) {
    const nextPhase = phases[phaseIndex + 1];
    nextPhase.status = 'in_progress';
    nextPhase.startedAt = new Date();
    this.roadmap.currentPhaseId = nextPhase.phaseId;
    this.roadmap.currentPhaseNumber = nextPhase.phaseNumber;

    this.history.push({
      eventType: 'PHASE_STARTED',
      eventData: { phaseId: nextPhase.phaseId, title: nextPhase.title },
      timestamp: new Date()
    });
  } else {
    // All phases complete - journey finished!
    this.status = 'completed';
    this.completedAt = new Date();
    this.stats.xpEarned += 500; // Bonus XP

    this.history.push({
      eventType: 'JOURNEY_COMPLETED',
      eventData: { career: this.career.title },
      xpEarned: 500,
      timestamp: new Date()
    });
  }

  await this.save();
  return this;
};

/**
 * Instance: Get next recommended actions
 */
userCareerJourneySchema.methods.getNextActions = function() {
  const currentPhase = this.roadmap.phases.find(
    p => p.phaseId === this.roadmap.currentPhaseId
  );
  if (!currentPhase) return [];

  const actions = [];

  // Find incomplete resources
  const incompleteResources = currentPhase.resources
    .filter(r => !r.isCompleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 2);

  incompleteResources.forEach((resource, idx) => {
    actions.push({
      type: 'resource',
      title: resource.title,
      description: `Continue with ${resource.type}`,
      resourceId: resource.resourceId?.toString() || resource.externalResourceId,
      phaseId: currentPhase.phaseId,
      priority: idx === 0 ? 'high' : 'medium',
      duration: resource.duration
    });
  });

  // Check for ready projects (phase is 50%+ complete)
  if (currentPhase.progress >= 50) {
    const readyProjects = currentPhase.projects
      .filter(p => !p.isStarted && !p.isCompleted)
      .slice(0, 1);

    readyProjects.forEach(project => {
      actions.push({
        type: 'project',
        title: project.title,
        description: 'Ready to start this project',
        projectId: project.projectId,
        phaseId: currentPhase.phaseId,
        priority: 'medium',
        estimatedHours: project.estimatedHours
      });
    });
  }

  return actions;
};

const UserCareerJourney = mongoose.model('UserCareerJourney', userCareerJourneySchema);

module.exports = UserCareerJourney;
