const mongoose = require('mongoose');

const codeReviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    maxlength: 1000
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust', 'html', 'css', 'sql', 'other'],
    default: 'javascript'
  },
  code: {
    type: String,
    required: true,
    maxlength: 50000
  },
  skill: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-review', 'reviewed', 'resolved'],
    default: 'pending'
  },
  reviewComments: [{
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lineStart: Number,
    lineEnd: Number,
    comment: { type: String, maxlength: 2000 },
    type: { type: String, enum: ['suggestion', 'issue', 'praise'], default: 'suggestion' },
    createdAt: { type: Date, default: Date.now }
  }],
  overallFeedback: {
    type: String,
    maxlength: 3000
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  }
}, {
  timestamps: true
});

codeReviewSchema.index({ status: 1, createdAt: -1 });
codeReviewSchema.index({ author: 1 });
codeReviewSchema.index({ language: 1 });

module.exports = mongoose.model('CodeReview', codeReviewSchema);
