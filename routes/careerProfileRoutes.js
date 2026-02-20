const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const UserCareerJourney = require('../models/UserCareerJourney');

/**
 * @desc    Get user's active career + career history summary
 * @route   GET /api/career-profile
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get active journey
  const activeJourney = await UserCareerJourney.findOne({
    user: userId,
    status: 'active'
  }).lean();

  // Get all journeys (for history) — lightweight projection
  const allJourneys = await UserCareerJourney.find({ user: userId })
    .select('career status stats.overallProgress stats.resourcesCompleted stats.phasesCompleted startedAt pausedAt completedAt updatedAt')
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      activeCareer: activeJourney ? {
        journeyId: activeJourney._id,
        careerId: activeJourney.career.careerId,
        title: activeJourney.career.title,
        description: activeJourney.career.description,
        icon: activeJourney.career.icon,
        progress: activeJourney.stats?.overallProgress || 0,
        currentPhase: activeJourney.roadmap?.currentPhaseNumber || 1,
        totalPhases: activeJourney.roadmap?.phases?.length || 0,
        startedAt: activeJourney.startedAt,
      } : null,
      careerHistory: allJourneys.map(j => ({
        journeyId: j._id,
        careerId: j.career.careerId,
        title: j.career.title,
        icon: j.career.icon,
        status: j.status,
        progress: j.stats?.overallProgress || 0,
        resourcesCompleted: j.stats?.resourcesCompleted || 0,
        phasesCompleted: j.stats?.phasesCompleted || 0,
        startedAt: j.startedAt,
        pausedAt: j.pausedAt,
        completedAt: j.completedAt,
      })),
      totalCareers: allJourneys.length,
    }
  });
}));

/**
 * @desc    Set/save active career (auto-save on career selection)
 * @route   POST /api/career-profile/set
 * @access  Private
 */
router.post('/set', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { careerId, title } = req.body;

  if (!careerId || !title) {
    return res.status(400).json({
      success: false,
      message: 'careerId and title are required'
    });
  }

  // Update user's activeCareerId
  await User.findByIdAndUpdate(userId, {
    activeCareerId: careerId,
    'careerGoal.title': title,
  });

  res.json({
    success: true,
    message: 'Active career saved',
    data: { careerId, title }
  });
}));

/**
 * @desc    Switch career — pauses current, activates target (or creates new)
 * @route   POST /api/career-profile/switch
 * @access  Private
 */
router.post('/switch', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { targetJourneyId } = req.body;

  if (!targetJourneyId) {
    return res.status(400).json({
      success: false,
      message: 'targetJourneyId is required'
    });
  }

  // 1. Pause current active journey
  await UserCareerJourney.updateMany(
    { user: userId, status: 'active' },
    {
      $set: { status: 'paused', pausedAt: new Date() },
      $push: {
        history: {
          eventType: 'JOURNEY_PAUSED',
          eventData: { reason: 'career_switch' },
          timestamp: new Date()
        }
      }
    }
  );

  // 2. Activate target journey
  const targetJourney = await UserCareerJourney.findOneAndUpdate(
    { _id: targetJourneyId, user: userId },
    {
      $set: { status: 'active', pausedAt: null },
      $push: {
        history: {
          eventType: 'JOURNEY_RESUMED',
          eventData: { reason: 'career_switch' },
          timestamp: new Date()
        }
      }
    },
    { new: true }
  ).lean();

  if (!targetJourney) {
    return res.status(404).json({
      success: false,
      message: 'Target journey not found'
    });
  }

  // 3. Update user's activeCareerId
  await User.findByIdAndUpdate(userId, {
    activeCareerId: targetJourney.career.careerId,
    'careerGoal.title': targetJourney.career.title,
  });

  res.json({
    success: true,
    message: `Switched to ${targetJourney.career.title}`,
    data: {
      journeyId: targetJourney._id,
      careerId: targetJourney.career.careerId,
      title: targetJourney.career.title,
      progress: targetJourney.stats?.overallProgress || 0,
    }
  });
}));

/**
 * @desc    Get career history with detailed stats
 * @route   GET /api/career-profile/history
 * @access  Private
 */
router.get('/history', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const journeys = await UserCareerJourney.find({ user: userId })
    .select('career status preferences stats roadmap.currentPhaseId roadmap.currentPhaseNumber roadmap.phases.phaseId roadmap.phases.title roadmap.phases.status roadmap.phases.progress startedAt pausedAt completedAt updatedAt')
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: journeys.map(j => ({
      journeyId: j._id,
      career: j.career,
      status: j.status,
      stats: j.stats,
      currentPhase: j.roadmap?.currentPhaseNumber || 1,
      phases: (j.roadmap?.phases || []).map(p => ({
        phaseId: p.phaseId,
        title: p.title,
        status: p.status,
        progress: p.progress,
      })),
      startedAt: j.startedAt,
      pausedAt: j.pausedAt,
      completedAt: j.completedAt,
    })),
    total: journeys.length,
  });
}));

module.exports = router;
