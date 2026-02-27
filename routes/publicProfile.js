const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const GamificationService = require('../services/GamificationService');

// @route   GET /api/profile/:slug
// @desc    Get public profile by username slug
router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    
    const user = await User.findOne(
      isObjectId
        ? { _id: slug }
        : { 'profile.publicSlug': slug }
    )
    .select('name bio avatarIndex skills badges projectShowcase gamification careerGoal createdAt profile')
    .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const totalXP = user.gamification?.totalXP || 0;
    const rank = GamificationService.getRank(totalXP);
    const achievements = await Achievement.getUserAchievements(user._id);

    const profile = {
      name: user.name,
      bio: user.bio || '',
      avatarIndex: user.avatarIndex || 0,
      slug: user.profile?.publicSlug || user._id,
      careerGoal: user.careerGoal?.title || user.careerGoal?.name || null,
      memberSince: user.createdAt,
      gamification: {
        totalXP,
        rank,
        currentStreak: user.gamification?.currentStreak || 0,
        longestStreak: user.gamification?.longestStreak || 0,
        achievementsCount: achievements.length,
        totalAchievements: GamificationService.getAllDefinitions().length
      },
      skills: (user.skills || []).slice(0, 20),
      badges: (user.badges || []).slice(0, 12),
      projectShowcase: (user.projectShowcase || []).slice(0, 6),
      achievements: achievements.slice(0, 8).map(a => ({
        title: a.title,
        icon: a.icon,
        tier: a.tier,
        category: a.category,
        unlockedAt: a.unlockedAt
      }))
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Public profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
});

module.exports = router;
