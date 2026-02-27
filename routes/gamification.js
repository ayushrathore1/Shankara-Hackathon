const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const GamificationService = require('../services/GamificationService');
const Achievement = require('../models/Achievement');
const Referral = require('../models/Referral');
const User = require('../models/User');

// All routes require authentication
router.use(protect);

// @route   GET /api/gamification/profile
// @desc    Get gamification profile (XP, rank, streaks, achievements)
router.get('/profile', async (req, res) => {
  try {
    const profile = await GamificationService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Gamification profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get gamification profile' });
  }
});

// @route   POST /api/gamification/heartbeat
// @desc    Record daily activity (updates streak)
router.post('/heartbeat', async (req, res) => {
  try {
    const result = await GamificationService.updateStreak(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ success: false, message: 'Failed to update streak' });
  }
});

// @route   GET /api/gamification/achievements
// @desc    Get all achievements for user
router.get('/achievements', async (req, res) => {
  try {
    const { category, tier } = req.query;
    const achievements = await Achievement.getUserAchievements(req.user.id, { category, tier });
    res.json({ success: true, data: achievements });
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({ success: false, message: 'Failed to get achievements' });
  }
});

// @route   GET /api/gamification/achievements/definitions
// @desc    Get all achievement definitions (for gallery view)
router.get('/achievements/definitions', async (req, res) => {
  try {
    const definitions = GamificationService.getAllDefinitions();
    const userAchievements = await Achievement.getUserAchievements(req.user.id);
    const unlockedIds = new Set(userAchievements.map(a => a.achievementId));

    const enriched = definitions.map(def => ({
      ...def,
      unlocked: unlockedIds.has(def.achievementId),
      unlockedAt: userAchievements.find(a => a.achievementId === def.achievementId)?.unlockedAt || null
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Achievement definitions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get achievement definitions' });
  }
});

// @route   GET /api/gamification/ranks
// @desc    Get career rank tiers
router.get('/ranks', async (req, res) => {
  try {
    const ranks = GamificationService.getCareerRanks();
    const user = await User.findById(req.user.id).select('gamification').lean();
    const totalXP = user?.gamification?.totalXP || 0;
    const currentRank = GamificationService.getRank(totalXP);

    res.json({ success: true, data: { ranks, current: currentRank, totalXP } });
  } catch (error) {
    console.error('Ranks error:', error);
    res.status(500).json({ success: false, message: 'Failed to get ranks' });
  }
});

// @route   GET /api/gamification/leaderboard
// @desc    Get XP leaderboard (top users)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const users = await User.find({ 'gamification.totalXP': { $gt: 0 } })
      .sort({ 'gamification.totalXP': -1 })
      .limit(limit)
      .select('name gamification.totalXP gamification.careerRank gamification.currentStreak avatarIndex')
      .lean();

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      totalXP: u.gamification?.totalXP || 0,
      careerRank: u.gamification?.careerRank || 'intern',
      streak: u.gamification?.currentStreak || 0,
      avatarIndex: u.avatarIndex || 0
    }));

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leaderboard' });
  }
});

// ============================================
// REFERRAL ROUTES
// ============================================

// @route   GET /api/gamification/referral
// @desc    Get user's referral code and stats
router.get('/referral', async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    
    // Generate referral code if user doesn't have one
    if (!user.referralCode) {
      user.referralCode = Referral.generateCode(req.user.id);
      await user.save();
    }

    const stats = await Referral.getStats(req.user.id);
    
    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?ref=${user.referralCode}`,
        stats
      }
    });
  } catch (error) {
    console.error('Referral error:', error);
    res.status(500).json({ success: false, message: 'Failed to get referral info' });
  }
});

// @route   POST /api/gamification/referral/track
// @desc    Track a referral signup (called internally after registration)
router.post('/referral/track', async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) {
      return res.status(400).json({ success: false, message: 'Referral code required' });
    }

    // Find the referrer
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    // Don't let users refer themselves
    if (referrer._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot refer yourself' });
    }

    // Create referral record
    const referral = await Referral.create({
      referrer: referrer._id,
      referred: req.user.id,
      referralCode: referralCode.toUpperCase(),
      status: 'signed_up',
      signedUpAt: new Date()
    });

    // Award achievement to referrer
    await GamificationService.tryAwardAchievement(referrer._id, 'referral-first');

    res.json({ success: true, data: referral });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: true, message: 'Referral already tracked' });
    }
    console.error('Referral track error:', error);
    res.status(500).json({ success: false, message: 'Failed to track referral' });
  }
});

module.exports = router;
