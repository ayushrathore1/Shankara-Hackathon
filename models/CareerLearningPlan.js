const mongoose = require('mongoose');

/**
 * CareerLearningPlan Schema
 * Stores AI-generated, real-time-data-driven learning plans for career domains.
 * Each plan has phases, actionable steps, projects, community links, and job market data.
 */

const ResourceSchema = new mongoose.Schema({
  name: String,
  url: String,
  type: { type: String, enum: ['course', 'docs', 'video', 'book', 'tool', 'article', 'github'], default: 'course' },
  isFree: { type: Boolean, default: true },
  provider: String,
  // YouTube video fields (populated by enrichWithYouTubeVideos)
  videoId: String,
  youtubeUrl: String,
  thumbnailUrl: String,
  qualityScore: Number,
  duration: String,              // e.g. "12:34"
  durationSeconds: Number,
}, { _id: false });

const StepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['learn', 'build', 'practice', 'read', 'explore'], default: 'learn' },
  estimatedHours: { type: Number, default: 2 },
  resources: [ResourceSchema]
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  skills: [String],
  inspiration: String,          // e.g. "Trending on GitHub", "Common in job listings"
  estimatedHours: { type: Number, default: 10 },
  referenceUrl: String          // Link to a real project/repo for inspiration
}, { _id: false });

const PhaseSchema = new mongoose.Schema({
  phase: { type: Number, required: true },
  title: { type: String, required: true },
  duration: String,             // e.g. "3-4 weeks"
  objectives: [String],
  skills: [String],
  steps: [StepSchema],
  projects: [ProjectSchema],
  milestones: [String]
}, { _id: false });

const careerLearningPlanSchema = new mongoose.Schema({
  // Unique keyword for lookup
  keyword: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true
  },

  // Plan overview
  title: { type: String, required: true },
  description: { type: String, maxlength: 2000 },
  domain: String,
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all-levels'], default: 'all-levels' },
  estimatedDuration: String,    // e.g. "6-8 months"

  // ─── Core: phased learning plan  ────────────────────────
  phases: [PhaseSchema],

  // ─── Community & Social ─────────────────────────────────
  community: {
    subreddits: [{
      name: String,
      url: String,
      description: String,
      _id: false
    }],
    discord: [{
      name: String,
      url: String,
      description: String,
      _id: false
    }],
    twitterAccounts: [{
      handle: String,
      description: String,
      _id: false
    }],
    youtubeChannels: [{
      name: String,
      url: String,
      description: String,
      _id: false
    }]
  },

  // ─── Trending Now ───────────────────────────────────────
  trendingNow: [{
    topic: String,
    reason: String,
    relevance: String,
    _id: false
  }],

  // ─── Job Market Snapshot ────────────────────────────────
  jobMarketSnapshot: {
    totalJobs: Number,
    topSkills: [String],
    topCompanies: [String],
    salaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' }
    },
    sampleListings: [{
      title: String,
      company: String,
      location: String,
      salary: String,
      _id: false
    }]
  },

  // ─── Metadata ───────────────────────────────────────────
  generatedBy: {
    model: String,
    webContextUsed: Boolean,
    jobDataUsed: Boolean,
    redditDataUsed: Boolean,
    generatedAt: { type: Date, default: Date.now }
  },

  usageCount: { type: Number, default: 1 },
  lastAccessedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
careerLearningPlanSchema.index({ usageCount: -1 });
careerLearningPlanSchema.index({ domain: 1 });
careerLearningPlanSchema.index({ updatedAt: 1 });

/**
 * Static: Find by keyword — increments usage counter
 */
careerLearningPlanSchema.statics.findByKeyword = async function (keyword) {
  const normalized = keyword.toLowerCase().trim();
  return this.findOneAndUpdate(
    { keyword: normalized },
    { $inc: { usageCount: 1 }, $set: { lastAccessedAt: new Date() } },
    { new: true }
  );
};

/**
 * Static: Upsert a learning plan
 */
careerLearningPlanSchema.statics.savePlan = async function (keyword, data) {
  const normalized = keyword.toLowerCase().trim();
  try {
    return await this.findOneAndUpdate(
      { keyword: normalized },
      { $set: { keyword: normalized, ...data, lastAccessedAt: new Date() } },
      { upsert: true, new: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return this.findOne({ keyword: normalized });
  }
};

/**
 * Static: Get popular plans
 */
careerLearningPlanSchema.statics.getPopular = async function (limit = 10) {
  return this.find({})
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('keyword title domain estimatedDuration usageCount phases');
};

/**
 * Check freshness — plans older than 7 days are considered stale
 */
careerLearningPlanSchema.methods.isFresh = function (maxAgeDays = 7) {
  const ageMs = Date.now() - this.updatedAt.getTime();
  return ageMs < maxAgeDays * 24 * 60 * 60 * 1000;
};

module.exports = mongoose.model('CareerLearningPlan', careerLearningPlanSchema);
