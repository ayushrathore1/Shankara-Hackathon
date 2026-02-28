const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const CodeReview = require('../models/CodeReview');
const GamificationService = require('../services/GamificationService');

// @route   GET /api/reviews/pending
// @desc    Get pending reviews (for reviewers)
router.get('/pending', async (req, res) => {
  try {
    const { language, page = 1, limit = 20 } = req.query;
    const filter = { status: 'pending' };
    if (language) filter.language = language;

    const reviews = await CodeReview.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'name avatarIndex')
      .select('-code') // Don't send full code in list
      .lean();

    const total = await CodeReview.countDocuments(filter);
    res.json({ success: true, data: reviews, pagination: { page: parseInt(page), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review detail with code
router.get('/:id', async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id)
      .populate('author', 'name avatarIndex')
      .populate('reviewer', 'name avatarIndex')
      .populate('reviewComments.reviewer', 'name avatarIndex')
      .lean();

    if (!review) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load review' });
  }
});

// Auth required for all write actions
router.use(protect);

// @route   POST /api/reviews
// @desc    Submit code for review
router.post('/', async (req, res) => {
  try {
    const { title, description, language, code, skill } = req.body;

    if (!title || !code || !language) {
      return res.status(400).json({ success: false, message: 'Title, code, and language are required' });
    }

    const review = await CodeReview.create({
      author: req.user._id,
      title,
      description,
      language,
      code,
      skill
    });

    // Award XP for submitting code for review
    try {
      await GamificationService.awardXP(req.user._id, 15, 'code_submitted');
    } catch (e) { /* non-critical */ }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
});

// @route   PUT /api/reviews/:id/review
// @desc    Submit a review (comments + feedback)
router.put('/:id/review', async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Not found' });

    if (review.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot review your own code' });
    }

    const { comments, overallFeedback, rating } = req.body;

    if (comments?.length) {
      review.reviewComments.push(
        ...comments.map(c => ({
          reviewer: req.user._id,
          lineStart: c.lineStart,
          lineEnd: c.lineEnd,
          comment: c.comment,
          type: c.type || 'suggestion'
        }))
      );
    }

    if (overallFeedback) review.overallFeedback = overallFeedback;
    if (rating) review.rating = rating;
    review.reviewer = req.user._id;
    review.status = 'reviewed';

    await review.save();

    // Award XP to reviewer
    try {
      await GamificationService.awardXP(req.user._id, 30, 'code_reviewed');
    } catch (e) { /* non-critical */ }

    res.json({ success: true, data: review, message: 'Review submitted! +30 XP' });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
});

// @route   GET /api/reviews/me/list
// @desc    Get user's submitted reviews
router.get('/me/list', async (req, res) => {
  try {
    const reviews = await CodeReview.find({
      $or: [{ author: req.user._id }, { reviewer: req.user._id }]
    })
    .sort({ createdAt: -1 })
    .populate('author', 'name avatarIndex')
    .populate('reviewer', 'name avatarIndex')
    .select('-code')
    .lean();

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
});

module.exports = router;
