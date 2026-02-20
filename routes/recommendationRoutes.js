const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');

const ML_CLASSIFIER_URL = process.env.ML_CLASSIFIER_URL || 'http://localhost:8100';

/**
 * @desc    Get personalized ML recommendations
 * @route   GET /api/recommendations
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  const user = req.user;
  const limit = parseInt(req.query.limit) || 5;

  // Build user profile from their data
  const userProfile = {
    skills: user.skills?.map(s => s.name) || [],
    interests: user.interests || [],
    career: user.careerGoal?.name || '',
    completedCourseIds: user.completedCourses?.map(c => c.toString()) || [],
    limit,
  };

  try {
    const response = await axios.post(`${ML_CLASSIFIER_URL}/recommend`, userProfile, {
      timeout: 10000,
    });
    
    res.json({
      success: true,
      data: response.data,
      source: 'personalized',
    });
  } catch (mlErr) {
    console.warn('ML recommend failed, returning trending:', mlErr.message);
    // Fallback to trending
    try {
      const trendingRes = await axios.get(`${ML_CLASSIFIER_URL}/trending?limit=${limit}`, {
        timeout: 5000,
      });
      res.json({
        success: true,
        data: trendingRes.data,
        source: 'trending',
      });
    } catch {
      res.json({
        success: true,
        data: [],
        source: 'none',
      });
    }
  }
}));

/**
 * @desc    Get trending courses (no auth needed — for new users)
 * @route   GET /api/recommendations/trending
 * @access  Public
 */
router.get('/trending', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  try {
    const response = await axios.get(`${ML_CLASSIFIER_URL}/trending?limit=${limit}`, {
      timeout: 5000,
    });
    res.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    console.warn('ML trending failed:', err.message);
    res.json({
      success: true,
      data: [],
    });
  }
}));

module.exports = router;
