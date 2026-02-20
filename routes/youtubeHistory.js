const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  getProgress,
  grantConsent,
  revokeConsent,
  addPlaylist,
  getPlaylistProgress,
  removePlaylist,
  addVideo,
  updateVideoProgress,
  unwatchVideo,
  removeVideo,
  autoTrackVideos,
  getAutoTracked,
  liveActivity
} = require('../controllers/youtubeHistoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// SSE endpoint — needs token via query param since EventSource can't send headers
router.get('/live', async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}, liveActivity);

// All other routes require authentication via header
router.use(protect);

// Dashboard
router.get('/', getProgress);

// Consent
router.post('/consent', grantConsent);
router.delete('/consent', revokeConsent);

// Auto-tracking (Chrome extension)
router.post('/auto-track', autoTrackVideos);
router.get('/auto-tracked', getAutoTracked);

// Playlists
router.post('/playlist', addPlaylist);
router.get('/playlist/:playlistId', getPlaylistProgress);
router.delete('/playlist/:playlistId', removePlaylist);

// Videos
router.post('/video', addVideo);
router.put('/video/:videoId/progress', updateVideoProgress);
router.put('/video/:videoId/unwatch', unwatchVideo);
router.delete('/video/:videoId', removeVideo);

module.exports = router;
