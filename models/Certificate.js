const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['path-completion', 'skill-verified', 'project-completion', 'achievement'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 500
  },
  skills: [{
    type: String,
    trim: true
  }],
  issuedAt: {
    type: Date,
    default: Date.now
  },
  verificationCode: {
    type: String,
    unique: true,
    default: () => `MEDHA-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
  },
  metadata: {
    pathTitle: String,
    projectTitle: String,
    completionPercentage: Number,
    xpEarned: Number,
    rank: String
  }
}, {
  timestamps: true
});

certificateSchema.index({ verificationCode: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
