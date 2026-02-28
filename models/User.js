const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true // For future GitHub OAuth support
  },
  avatarUrl: {
    type: String
  },
  avatarIndex: {
    type: Number,
    default: 0
  },
  isOtpVerified: {
    type: Boolean,
    default: false
  },
  subscribedNewsletter: {
    type: Boolean,
    default: false
  },

  // Subscription & Premium Features
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing', 'incomplete'],
      default: 'active'
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },

  // Career & Learning Goals
  careerGoal: {
    title: String,        // e.g., "Full Stack Developer"
    targetRole: String,   // e.g., "Senior Software Engineer"
    targetCompany: String,
    targetSalary: Number,
    targetDate: Date,
    currentLevel: {
      type: String,
      enum: ['student', 'entry', 'junior', 'mid', 'senior', 'lead', 'other'],
      default: 'student'
    }
  },

  // Active Career & Learning State (for career-first architecture)
  activeCareerId: {
    type: String,  // Career domain ID (from CareerDomain collection)
    index: true,
    default: null
  },
  activeLearningPathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLearningPath',  // Reference to user's learning path
    default: null
  },

  // Profile Settings
  profile: {
    headline: String,           // e.g., "Aspiring Full Stack Developer"
    bio: {
      type: String,
      maxlength: 500
    },
    location: String,
    website: String,
    linkedinUrl: String,
    githubUsername: String,
    isPublic: {
      type: Boolean,
      default: false
    },
    publicSlug: {
      type: String,
      unique: true,
      sparse: true
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showSkills: {
      type: Boolean,
      default: true
    },
    showProjects: {
      type: Boolean,
      default: true
    },
    showProgress: {
      type: Boolean,
      default: false
    }
  },

  // Learning Preferences (for YouTube-powered learning paths)
  learningPreferences: {
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
    },
    experienceLevel: {
      type: String,
      enum: ['absolute-beginner', 'beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },

  // Notification Preferences
  notifications: {
    email: {
      dailyReminder: { type: Boolean, default: true },
      weeklyProgress: { type: Boolean, default: true },
      newFeatures: { type: Boolean, default: true },
      streakReminder: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true },
      distractionAlerts: { type: Boolean, default: false },
      distractionThreshold: { type: Number, default: 5, min: 2, max: 20 }
    },
    push: {
      enabled: { type: Boolean, default: false },
      dailyReminder: { type: Boolean, default: false },
      streakReminder: { type: Boolean, default: true }
    },
    preferredTime: {
      type: String,
      default: '09:00' // HH:mm format
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },

  // Usage Limits (for free tier tracking)
  usageLimits: {
    aiAnalysisCount: { type: Number, default: 0 },
    aiAnalysisResetAt: Date,
    quizAttempts: { type: Number, default: 0 },
    quizAttemptsResetAt: Date,
    pathsEnrolled: { type: Number, default: 0 }
  },

  // Gamification
  gamification: {
    totalXP: { type: Number, default: 0 },
    careerRank: {
      type: String,
      enum: ['intern', 'junior', 'mid', 'senior', 'lead', 'architect', 'cto'],
      default: 'intern'
    },
    achievementsCount: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: Date
  },

  // Badges (for public profile display)
  badges: [{
    badgeId: String,
    name: String,
    icon: String,
    tier: String,
    earnedAt: { type: Date, default: Date.now }
  }],

  // Project showcase (for public profile)
  projectShowcase: [{
    title: String,
    description: String,
    url: String,
    skills: [String],
    thumbnail: String,
    addedAt: { type: Date, default: Date.now }
  }],

  // Onboarding
  onboarding: {
    completed: { type: Boolean, default: false },
    currentStep: { type: Number, default: 0 },
    completedAt: Date
  },

  // Referral
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },

  // ═══ Medha Career Discovery Persistence ═══

  quizData: {
    completedAt: { type: Date, default: null },
    questions: [{
      dimension: String,
      questionText: String,
      selectedTrait: String,
      selectedText: String,
      customText: { type: String, default: '' },
      followupQuestion: { type: String, default: '' },
      followupAnswer: { type: String, default: '' },
    }],
    selfDescription: { type: String, default: '' },
  },

  careerResults: {
    generatedAt: { type: Date, default: null },
    careers: [{
      rank: Number,
      title: String,
      slug: String,
      fit_label: String,
      why: String,
      reality_check: String,
      salary_range: String,
      market_demand: String,
      time_to_first_role: String,
    }],
    selectedCareer: {
      slug: { type: String, default: '' },
      title: { type: String, default: '' },
      chosenAt: { type: Date, default: null },
    },
  },

  roadmapProgress: {
    activeCareerSlug: { type: String, default: '' },
    streakCount: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: '' },
    totalStepsCompleted: { type: Number, default: 0 },
    stages: [{
      stageId: String,
      stageTitle: String,
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
      steps: [{
        stepId: String,
        skill: String,
        status: {
          type: String,
          enum: ['available', 'in_progress', 'needs_revision', 'completed'],
          default: 'available',
        },
        completedAt: { type: Date, default: null },
        exercises: [{
          exerciseId: String,
          type: String,
          attempts: { type: Number, default: 0 },
          lastResponse: { type: String, default: '' },
          verdict: { type: String, default: '' },
          feedback: {
            what_worked: String,
            what_was_missing: String,
            one_thing_to_do: String,
            encouragement: String,
          },
          completedAt: { type: Date, default: null },
        }],
      }],
    }],
  },

  mentorChat: [{
    careerSlug: String,
    messages: [{
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      timestamp: { type: Date, default: Date.now },
    }],
    startedAt: { type: Date, default: Date.now },
  }],

}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and store in DB
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiry — 30 minutes
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

// Check if user has premium access
userSchema.methods.isPremium = function() {
  return ['premium', 'pro'].includes(this.subscription?.tier);
};

// Check if user has pro access
userSchema.methods.isPro = function() {
  return this.subscription?.tier === 'pro';
};

// Check subscription status
userSchema.methods.hasActiveSubscription = function() {
  if (this.subscription?.tier === 'free') return true;
  return this.subscription?.status === 'active' || this.subscription?.status === 'trialing';
};

// Get tier limits
userSchema.methods.getTierLimits = function() {
  const limits = {
    free: {
      aiAnalysisPerMonth: 10,
      quizzesPerMonth: 5,
      maxPaths: 3,
      codingChallenges: false,
      teamFeatures: false,
      profileExport: false
    },
    premium: {
      aiAnalysisPerMonth: -1, // unlimited
      quizzesPerMonth: -1,
      maxPaths: -1,
      codingChallenges: true,
      teamFeatures: true,
      profileExport: true
    },
    pro: {
      aiAnalysisPerMonth: -1,
      quizzesPerMonth: -1,
      maxPaths: -1,
      codingChallenges: true,
      teamFeatures: true,
      profileExport: true,
      mentorship: true,
      apiAccess: true,
      certificates: true
    }
  };
  
  return limits[this.subscription?.tier || 'free'];
};

// Check if user can use a feature (returns { allowed: bool, reason: string })
userSchema.methods.canUseFeature = function(feature) {
  const limits = this.getTierLimits();
  
  switch (feature) {
    case 'ai_analysis':
      if (limits.aiAnalysisPerMonth === -1) return { allowed: true };
      const analysisCount = this.usageLimits?.aiAnalysisCount || 0;
      const resetNeeded = !this.usageLimits?.aiAnalysisResetAt || 
        new Date() > new Date(this.usageLimits.aiAnalysisResetAt);
      if (resetNeeded || analysisCount < limits.aiAnalysisPerMonth) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: `Free tier limit: ${limits.aiAnalysisPerMonth} AI analyses per month`,
        upgradeRequired: true 
      };
      
    case 'quiz':
      if (limits.quizzesPerMonth === -1) return { allowed: true };
      const quizCount = this.usageLimits?.quizAttempts || 0;
      const quizResetNeeded = !this.usageLimits?.quizAttemptsResetAt || 
        new Date() > new Date(this.usageLimits.quizAttemptsResetAt);
      if (quizResetNeeded || quizCount < limits.quizzesPerMonth) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: `Free tier limit: ${limits.quizzesPerMonth} quizzes per month`,
        upgradeRequired: true 
      };
      
    case 'coding_challenge':
      if (!limits.codingChallenges) {
        return { allowed: false, reason: 'Coding challenges are a Premium feature', upgradeRequired: true };
      }
      return { allowed: true };
      
    case 'team':
      if (!limits.teamFeatures) {
        return { allowed: false, reason: 'Team features require Premium', upgradeRequired: true };
      }
      return { allowed: true };
      
    case 'enroll_path':
      if (limits.maxPaths === -1) return { allowed: true };
      const pathCount = this.usageLimits?.pathsEnrolled || 0;
      if (pathCount < limits.maxPaths) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: `Free tier limit: ${limits.maxPaths} concurrent learning paths`,
        upgradeRequired: true 
      };
      
    default:
      return { allowed: true };
  }
};

// Increment usage counter
userSchema.methods.incrementUsage = async function(feature) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  switch (feature) {
    case 'ai_analysis':
      // Reset if new month
      if (!this.usageLimits.aiAnalysisResetAt || now > this.usageLimits.aiAnalysisResetAt) {
        this.usageLimits.aiAnalysisCount = 1;
        this.usageLimits.aiAnalysisResetAt = nextMonth;
      } else {
        this.usageLimits.aiAnalysisCount += 1;
      }
      break;
      
    case 'quiz':
      if (!this.usageLimits.quizAttemptsResetAt || now > this.usageLimits.quizAttemptsResetAt) {
        this.usageLimits.quizAttempts = 1;
        this.usageLimits.quizAttemptsResetAt = nextMonth;
      } else {
        this.usageLimits.quizAttempts += 1;
      }
      break;
      
    case 'enroll_path':
      this.usageLimits.pathsEnrolled += 1;
      break;
  }
  
  return this.save();
};

// Generate public profile slug
userSchema.methods.generatePublicSlug = function() {
  if (!this.profile) this.profile = {};
  
  // Generate from name + random suffix
  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  this.profile.publicSlug = `${baseSlug}-${randomSuffix}`;
  
  return this.profile.publicSlug;
};

// Static: Find by public slug
userSchema.statics.findByPublicSlug = function(slug) {
  return this.findOne({ 'profile.publicSlug': slug, 'profile.isPublic': true });
};

module.exports = mongoose.model('User', userSchema);
