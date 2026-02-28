const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// POST /save — Save completed quiz answers
router.post('/save', protect, async (req, res) => {
  try {
    const { questions, selfDescription } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.quizData = {
      completedAt: new Date(),
      questions: questions || [],
      selfDescription: selfDescription || '',
    };
    await user.save();
    res.json({ success: true, message: 'Quiz saved' });
  } catch (err) {
    console.error('Quiz save error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET / — Retrieve saved quiz data
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    if (!user.quizData?.completedAt) {
      return res.json({ quizData: null, message: 'No quiz completed' });
    }
    res.json({ quizData: user.quizData });
  } catch (err) {
    console.error('Quiz load error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
