const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MentorService = require('../services/MentorService');

// All routes require authentication
router.use(protect);

// @route   POST /api/mentor/chat
// @desc    Send message to AI mentor
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message too long (max 2000 chars)' });
    }

    const response = await MentorService.chat(req.user._id, message.trim());
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Mentor chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message?.includes('API key')
        ? 'AI service temporarily unavailable'
        : 'Failed to get response'
    });
  }
});

// @route   GET /api/mentor/history
// @desc    Get conversation history
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const messages = await MentorService.getHistory(req.user._id, limit);
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Mentor history error:', error);
    res.status(500).json({ success: false, message: 'Failed to load history' });
  }
});

// @route   GET /api/mentor/prompts
// @desc    Get suggested prompts
router.get('/prompts', async (req, res) => {
  try {
    const prompts = await MentorService.getSuggestedPrompts(req.user._id);
    res.json({ success: true, data: prompts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load prompts' });
  }
});

// @route   DELETE /api/mentor/history
// @desc    Clear conversation history
router.delete('/history', async (req, res) => {
  try {
    await MentorService.clearHistory(req.user._id);
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Mentor clear error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
});

module.exports = router;
