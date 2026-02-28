const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const GamificationService = require('../services/GamificationService');

// @route   GET /api/certificates/verify/:code
// @desc    Public verification — no auth required
router.get('/verify/:code', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ verificationCode: req.params.code })
      .populate('userId', 'name')
      .lean();

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({
      success: true,
      data: {
        holder: cert.userId?.name,
        title: cert.title,
        type: cert.type,
        skills: cert.skills,
        issuedAt: cert.issuedAt,
        verificationCode: cert.verificationCode,
        verified: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// All remaining routes require auth
router.use(protect);

// @route   GET /api/certificates/me
// @desc    Get user's certificates
router.get('/me', async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id })
      .sort({ issuedAt: -1 })
      .lean();

    res.json({ success: true, data: certs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load certificates' });
  }
});

// @route   POST /api/certificates/generate
// @desc    Generate a certificate (for completed paths/projects)
router.post('/generate', async (req, res) => {
  try {
    const { type, title, description, skills, metadata } = req.body;

    if (!type || !title) {
      return res.status(400).json({ success: false, message: 'Type and title are required' });
    }

    // Check if duplicate certificate exists
    const existing = await Certificate.findOne({
      userId: req.user._id,
      title,
      type
    });

    if (existing) {
      return res.json({ success: true, data: existing, message: 'Certificate already issued' });
    }

    const user = await User.findById(req.user._id).select('gamification').lean();
    const rank = GamificationService.getRank(user?.gamification?.totalXP || 0);

    const cert = await Certificate.create({
      userId: req.user._id,
      type,
      title,
      description,
      skills: skills || [],
      metadata: {
        ...metadata,
        rank: rank.title,
        xpEarned: user?.gamification?.totalXP || 0
      }
    });

    // Award XP for earning a certificate
    try {
      await GamificationService.awardXP(req.user._id, 100, 'certificate_earned');
    } catch (e) { /* non-critical */ }

    res.status(201).json({ success: true, data: cert });
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate certificate' });
  }
});

module.exports = router;
