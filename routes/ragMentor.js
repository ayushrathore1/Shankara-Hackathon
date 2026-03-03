const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const ragMentorService = require('../services/RAGMentorService');
const voiceMentorService = require('../services/VoiceMentorService');

// Multer setup — store audio in memory (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/flac', 'video/webm'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`), false);
    }
  },
});

/**
 * RAG Mentor Routes — AI Career Mentor powered by RAG + Groq
 * 
 * Provides personalized career mentoring with:
 * - Text chat (POST /chat)
 * - Voice chat (POST /voice) — STT → RAG → LLM → TTS
 * - Health check (GET /health)
 */

// ─── POST /api/rag-mentor/chat ─── Main career mentoring endpoint
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    if (message.length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 3000 characters)'
      });
    }

    const result = await ragMentorService.chat(message.trim());

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('RAG Mentor chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message?.includes('API key')
        ? 'AI service temporarily unavailable'
        : error.message || 'Failed to get career mentoring response'
    });
  }
});

// ─── POST /api/rag-mentor/voice ─── Voice interaction endpoint
router.post('/voice', protect, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required. Send as multipart/form-data with field name "audio".'
      });
    }

    console.log(`🎤 Voice request: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB, ${req.file.mimetype})`);

    const result = await voiceMentorService.voiceChat(
      req.file.buffer,
      req.file.originalname || 'audio.webm'
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Voice Mentor error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Voice processing failed'
    });
  }
});

// ─── GET /api/rag-mentor/health ─── Check RAG + Voice system health
router.get('/health', async (req, res) => {
  try {
    const ragHealth = await ragMentorService.getHealth();
    let voiceHealth = {};
    try {
      voiceHealth = await voiceMentorService.health();
    } catch {}

    res.json({
      success: true,
      data: {
        ...ragHealth,
        voice: voiceHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

module.exports = router;

