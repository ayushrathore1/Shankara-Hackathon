const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  context: {
    careerGoal: String,
    skills: [String],
    rank: String,
    totalXP: Number
  }
}, {
  timestamps: true
});

// Compound index for fast retrieval
chatMessageSchema.index({ userId: 1, createdAt: -1 });

// Auto-delete messages older than 30 days
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
