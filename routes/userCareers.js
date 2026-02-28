const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// POST /save — Save AI-generated career results
router.post('/save', protect, async (req, res) => {
  try {
    const { careers } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    if (!user.careerResults) user.careerResults = {};
    user.careerResults.careers = careers || [];
    user.careerResults.generatedAt = new Date();
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Careers save error:', err.message);
    res.status(500).json({ success: false });
  }
});

// POST /select — Record which career user chose
router.post('/select', protect, async (req, res) => {
  try {
    const { slug, title } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    if (!user.careerResults) user.careerResults = {};
    user.careerResults.selectedCareer = { slug, title, chosenAt: new Date() };
    if (!user.roadmapProgress) user.roadmapProgress = {};
    user.roadmapProgress.activeCareerSlug = slug;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Career select error:', err.message);
    res.status(500).json({ success: false });
  }
});

// GET / — Retrieve saved career results
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });
    res.json({ careerResults: user.careerResults || null });
  } catch (err) {
    console.error('Careers load error:', err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
