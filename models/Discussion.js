const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    maxlength: 10000
  },
  category: {
    type: String,
    enum: ['general', 'career', 'learning', 'projects', 'code-help', 'resources', 'interview-prep', 'showcase', 'off-topic'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  // Link to a project for collaboration discussions
  linkedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  // Link to a code review for discussion
  linkedReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeReview',
    default: null
  }
}, {
  timestamps: true
});

discussionSchema.index({ category: 1, createdAt: -1 });
discussionSchema.index({ author: 1 });
discussionSchema.index({ tags: 1 });
discussionSchema.index({ createdAt: -1 });

// Virtual for vote score
discussionSchema.virtual('score').get(function() {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

discussionSchema.set('toJSON', { virtuals: true });
discussionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Discussion', discussionSchema);
