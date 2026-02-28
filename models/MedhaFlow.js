const mongoose = require('mongoose');

/**
 * MedhaFlow — Stores a user's career discovery journey
 * Quiz answers, AI results, selected career, roadmap progress, and proof submissions
 */
const medhaFlowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Quiz
  quizAnswers: {
    q1: String,
    q2: String,
    q3: String,
    q4: String,
    q5: String,
  },
  // AI-generated career recommendations
  careerResults: [{
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
  // Domain-based career recommendations
  careerDomains: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Selected career for roadmap
  selectedCareer: {
    title: String,
    slug: String,
  },
  // Day in life data (cached)
  dayInLifeData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Roadmap data (cached from AI)
  roadmapData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Step completion tracking: { "step-id": true }
  roadmapProgress: {
    type: Map,
    of: Boolean,
    default: {},
  },
  // Proof submissions per step
  // { "step-id": { proof, proofType, status, feedback, submittedAt, validatedAt } }
  proofSubmissions: {
    type: Map,
    of: {
      proof: String,           // user's proof text, link, or description
      proofType: { type: String, enum: ['text', 'link', 'description'], default: 'text' },
      status: { type: String, enum: ['pending', 'approved', 'needs_improvement'], default: 'pending' },
      feedback: String,        // AI feedback on the proof
      score: Number,           // 0-100 confidence score
      submittedAt: Date,
      validatedAt: Date,
    },
    default: {},
  },
  // Streak tracking
  streakCount: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: '' },
}, {
  timestamps: true,
});

// One active flow per user
medhaFlowSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('MedhaFlow', medhaFlowSchema);
