const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const GamificationService = require('../services/GamificationService');

// ============================================================
// PUBLIC ROUTES — Browse discussions
// ============================================================

// @route   GET /api/charcha
// @desc    Browse discussions with filters
router.get('/', async (req, res) => {
  try {
    const { category, tag, sort = 'newest', page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (tag) filter.tags = { $in: [tag.toLowerCase()] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { commentCount: -1, createdAt: -1 };
    if (sort === 'top') sortOption = { 'upvotes': -1, createdAt: -1 }; // by upvote count

    // Pinned posts first
    const pinned = await Discussion.find({ ...filter, isPinned: true })
      .sort(sortOption)
      .populate('author', 'name avatarIndex gamification')
      .lean();

    const discussions = await Discussion.find({ ...filter, isPinned: { $ne: true } })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'name avatarIndex gamification')
      .populate('linkedProject', 'title status')
      .lean();

    const total = await Discussion.countDocuments(filter);

    // Add vote score
    const all = [...pinned, ...discussions].map(d => ({
      ...d,
      score: (d.upvotes?.length || 0) - (d.downvotes?.length || 0),
      upvoteCount: d.upvotes?.length || 0,
      downvoteCount: d.downvotes?.length || 0,
    }));

    res.json({ success: true, data: all, pagination: { page: parseInt(page), total } });
  } catch (error) {
    console.error('Charcha browse error:', error);
    res.status(500).json({ success: false, message: 'Failed to load discussions' });
  }
});

// @route   GET /api/charcha/:id
// @desc    Get discussion detail
router.get('/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name avatarIndex gamification')
      .populate('linkedProject', 'title status members maxTeamSize')
      .lean();

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    // Get comments
    const comments = await Comment.find({ discussion: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'name avatarIndex gamification')
      .lean();

    // Add vote info
    const enriched = {
      ...discussion,
      score: (discussion.upvotes?.length || 0) - (discussion.downvotes?.length || 0),
      upvoteCount: discussion.upvotes?.length || 0,
      comments,
    };

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Charcha detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to load discussion' });
  }
});

// ============================================================
// PROTECTED ROUTES — Require auth
// ============================================================
router.use(protect);

// @route   POST /api/charcha
// @desc    Create a discussion
router.post('/', async (req, res) => {
  try {
    const { title, body, category, tags, linkedProject, linkedReview } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const discussion = await Discussion.create({
      author: req.user._id,
      title: title.trim(),
      body,
      category: category || 'general',
      tags: (tags || []).map(t => t.toLowerCase().trim()).filter(Boolean),
      linkedProject: linkedProject || undefined,
      linkedReview: linkedReview || undefined,
    });

    // Award XP
    try { await GamificationService.awardXP(req.user._id, 10, 'discussion_created'); } catch (e) {}

    const populated = await Discussion.findById(discussion._id)
      .populate('author', 'name avatarIndex gamification')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ success: false, message: 'Failed to create discussion' });
  }
});

// @route   POST /api/charcha/:id/comment
// @desc    Add a comment
router.post('/:id/comment', async (req, res) => {
  try {
    const { body, parentComment } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'Comment body is required' });

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });
    if (discussion.isLocked) return res.status(403).json({ success: false, message: 'Discussion is locked' });

    const comment = await Comment.create({
      discussion: req.params.id,
      author: req.user._id,
      body,
      parentComment: parentComment || undefined,
    });

    // Update comment count
    await Discussion.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });

    // Award XP
    try { await GamificationService.awardXP(req.user._id, 5, 'comment_posted'); } catch (e) {}

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name avatarIndex gamification')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to post comment' });
  }
});

// @route   POST /api/charcha/:id/vote
// @desc    Upvote or downvote a discussion
router.post('/:id/vote', async (req, res) => {
  try {
    const { type } = req.body; // 'up' or 'down'
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Not found' });

    const userId = req.user._id;

    if (type === 'up') {
      // Remove from downvotes if present
      discussion.downvotes = discussion.downvotes.filter(id => id.toString() !== userId.toString());
      // Toggle upvote
      const idx = discussion.upvotes.findIndex(id => id.toString() === userId.toString());
      if (idx > -1) {
        discussion.upvotes.splice(idx, 1);
      } else {
        discussion.upvotes.push(userId);
      }
    } else if (type === 'down') {
      // Remove from upvotes if present
      discussion.upvotes = discussion.upvotes.filter(id => id.toString() !== userId.toString());
      // Toggle downvote
      const idx = discussion.downvotes.findIndex(id => id.toString() === userId.toString());
      if (idx > -1) {
        discussion.downvotes.splice(idx, 1);
      } else {
        discussion.downvotes.push(userId);
      }
    }

    await discussion.save();

    res.json({
      success: true,
      data: {
        upvoteCount: discussion.upvotes.length,
        downvoteCount: discussion.downvotes.length,
        score: discussion.upvotes.length - discussion.downvotes.length,
        userVote: discussion.upvotes.includes(userId) ? 'up'
          : discussion.downvotes.includes(userId) ? 'down' : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Vote failed' });
  }
});

// @route   POST /api/charcha/comment/:commentId/upvote
// @desc    Upvote a comment
router.post('/comment/:commentId/upvote', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Not found' });

    const idx = comment.upvotes.findIndex(id => id.toString() === req.user._id.toString());
    if (idx > -1) {
      comment.upvotes.splice(idx, 1);
    } else {
      comment.upvotes.push(req.user._id);
    }

    await comment.save();
    res.json({ success: true, data: { upvoteCount: comment.upvotes.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Vote failed' });
  }
});

// @route   DELETE /api/charcha/:id
// @desc    Delete a discussion (author only)
router.delete('/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Not found' });
    if (discussion.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Comment.deleteMany({ discussion: req.params.id });
    await Discussion.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Discussion deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

module.exports = router;
