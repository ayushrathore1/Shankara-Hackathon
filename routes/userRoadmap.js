const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// POST /initialize — Create roadmap stage/step structure for tracking
router.post('/initialize', protect, async (req, res) => {
  try {
    const { careerSlug, roadmapData } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    if (!user.roadmapProgress) user.roadmapProgress = {};

    // Check if user already has progress for this career
    if (user.roadmapProgress.activeCareerSlug === careerSlug && user.roadmapProgress.stages?.length > 0) {
      return res.json({ initialized: false, progress: user.roadmapProgress, message: 'Existing progress found' });
    }

    // Map AI roadmap data into tracking structure
    const stages = (roadmapData?.stages || []).map(stage => ({
      stageId: stage.id,
      stageTitle: stage.title,
      completed: false,
      completedAt: null,
      steps: (stage.steps || []).map(step => ({
        stepId: step.id,
        skill: step.skill,
        status: 'available',
        completedAt: null,
        exercises: [],
      })),
    }));

    user.roadmapProgress.activeCareerSlug = careerSlug;
    user.roadmapProgress.stages = stages;
    user.roadmapProgress.totalStepsCompleted = 0;
    await user.save();

    res.json({ initialized: true, progress: user.roadmapProgress });
  } catch (err) {
    console.error('Roadmap init error:', err.message);
    res.status(500).json({ success: false });
  }
});

// POST /step/start — Mark step as in_progress
router.post('/step/start', protect, async (req, res) => {
  try {
    const { stageId, stepId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    const stage = user.roadmapProgress?.stages?.find(s => s.stageId === stageId);
    const step = stage?.steps?.find(s => s.stepId === stepId);
    if (step) {
      step.status = 'in_progress';
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Step start error:', err.message);
    res.status(500).json({ success: false });
  }
});

// POST /exercise/submit — Save exercise submission and feedback
router.post('/exercise/submit', protect, async (req, res) => {
  try {
    const { stageId, stepId, exerciseId, exerciseType, response, feedback } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    const stage = user.roadmapProgress?.stages?.find(s => s.stageId === stageId);
    const step = stage?.steps?.find(s => s.stepId === stepId);
    if (!step) return res.status(404).json({ success: false, message: 'Step not found' });

    // Find or create exercise entry
    let exercise = step.exercises?.find(e => e.exerciseId === exerciseId);
    if (!exercise) {
      step.exercises.push({
        exerciseId, type: exerciseType, attempts: 0,
        lastResponse: '', verdict: '', feedback: {}, completedAt: null,
      });
      exercise = step.exercises[step.exercises.length - 1];
    }

    exercise.attempts = (exercise.attempts || 0) + 1;
    exercise.lastResponse = response || '';
    exercise.verdict = feedback?.verdict || '';
    exercise.feedback = {
      what_worked: feedback?.what_worked || '',
      what_was_missing: feedback?.what_was_missing || '',
      one_thing_to_do: feedback?.one_thing_to_do || '',
      encouragement: feedback?.encouragement || '',
    };

    if (feedback?.unlock) {
      exercise.completedAt = new Date();
    }

    // Check if step is complete (any exercise unlocked = step complete)
    const anyUnlocked = step.exercises.some(e => e.completedAt != null);
    let stepCompleted = false;
    let stageCompleted = false;

    if (anyUnlocked && step.status !== 'completed') {
      step.status = 'completed';
      step.completedAt = new Date();
      user.roadmapProgress.totalStepsCompleted = (user.roadmapProgress.totalStepsCompleted || 0) + 1;
      stepCompleted = true;

      // Check if all steps in stage are completed
      const allStepsDone = stage.steps.every(s => s.status === 'completed');
      if (allStepsDone && !stage.completed) {
        stage.completed = true;
        stage.completedAt = new Date();
        stageCompleted = true;
      }
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    if (user.roadmapProgress.lastActiveDate !== today) {
      user.roadmapProgress.streakCount = (user.roadmapProgress.streakCount || 0) + 1;
      user.roadmapProgress.lastActiveDate = today;
    }

    await user.save();

    res.json({
      success: true,
      stepCompleted,
      stageCompleted,
      streakCount: user.roadmapProgress.streakCount,
      totalStepsCompleted: user.roadmapProgress.totalStepsCompleted,
    });
  } catch (err) {
    console.error('Exercise submit error:', err.message);
    res.status(500).json({ success: false });
  }
});

// GET /progress — Get full roadmap progress
router.get('/progress', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });
    res.json({ roadmapProgress: user.roadmapProgress || null });
  } catch (err) {
    console.error('Progress load error:', err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
