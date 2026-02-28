const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// POST /save — Save mentor chat history
router.post('/save', protect, async (req, res) => {
  try {
    const { careerSlug, messages } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    if (!user.mentorChat) user.mentorChat = [];
    const existing = user.mentorChat.find(c => c.careerSlug === careerSlug);
    if (existing) {
      existing.messages = messages || [];
    } else {
      user.mentorChat.push({ careerSlug, messages: messages || [], startedAt: new Date() });
    }
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Mentor save error:', err.message);
    res.status(500).json({ success: false });
  }
});

// GET /:careerSlug — Retrieve chat history for a career
router.get('/:careerSlug', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    const chat = user.mentorChat?.find(c => c.careerSlug === req.params.careerSlug);
    res.json({ messages: chat?.messages || [] });
  } catch (err) {
    console.error('Mentor load error:', err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
