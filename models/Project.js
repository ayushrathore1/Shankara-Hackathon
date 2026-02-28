const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['web', 'mobile', 'ai-ml', 'data', 'devops', 'blockchain', 'game', 'open-source', 'other'],
    default: 'web'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  skills: [{
    type: String,
    trim: true
  }],
  maxTeamSize: {
    type: Number,
    default: 4,
    min: 1,
    max: 10
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  applicants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, maxlength: 500 },
    appliedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed'],
    default: 'open'
  },
  githubUrl: String,
  liveUrl: String,
  xpReward: {
    type: Number,
    default: 200
  }
}, {
  timestamps: true
});

projectSchema.index({ status: 1, category: 1 });
projectSchema.index({ creator: 1 });
projectSchema.index({ skills: 1 });

module.exports = mongoose.model('Project', projectSchema);
