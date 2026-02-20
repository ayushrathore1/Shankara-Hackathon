const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const journeyController = require('../controllers/journeyController');

/**
 * Career Journey Routes
 * All routes are protected and require authentication
 */

// Get active journey
router.get('/active', protect, journeyController.getActiveJourney);

// Get journey overview/dashboard data
router.get('/overview', protect, journeyController.getJourneyOverview);

// Get full roadmap
router.get('/roadmap', protect, journeyController.getJourneyRoadmap);

// Get next recommended actions
router.get('/next-actions', protect, journeyController.getNextActions);

// Get journey history/timeline
router.get('/history', protect, journeyController.getJourneyHistory);

// Start a new journey
router.post('/start', protect, journeyController.startJourney);

// Complete a resource
router.post('/resource/complete', protect, journeyController.completeResource);

// Pause/Resume journey
router.post('/toggle-pause', protect, journeyController.togglePauseJourney);

// Regenerate roadmap with real YouTube resources
router.post('/regenerate-roadmap', protect, journeyController.regenerateRoadmap);

module.exports = router;
