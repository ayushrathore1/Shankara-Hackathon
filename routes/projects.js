const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');
const GamificationService = require('../services/GamificationService');

// @route   GET /api/projects
// @desc    Browse projects
router.get('/', async (req, res) => {
  try {
    const { status = 'open', category, difficulty, skill, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (skill) filter.skills = { $in: [skill] };

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('creator', 'name avatarIndex')
      .populate('members.user', 'name avatarIndex')
      .lean();

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: projects,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Projects browse error:', error);
    res.status(500).json({ success: false, message: 'Failed to load projects' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project detail
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'name avatarIndex gamification')
      .populate('members.user', 'name avatarIndex')
      .populate('applicants.user', 'name avatarIndex')
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load project' });
  }
});

// All write routes require auth
router.use(protect);

// @route   POST /api/projects
// @desc    Create a project
router.post('/', async (req, res) => {
  try {
    const { title, description, category, difficulty, skills, maxTeamSize, githubUrl } = req.body;

    const project = await Project.create({
      title,
      description,
      category,
      difficulty,
      skills: skills || [],
      maxTeamSize: maxTeamSize || 4,
      githubUrl,
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'lead' }]
    });

    // Award XP for creating a project
    try {
      await GamificationService.awardXP(req.user._id, 50, 'project_created');
    } catch (e) { /* non-critical */ }

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

// @route   POST /api/projects/:id/apply
// @desc    Apply to join a project
router.post('/:id/apply', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.status !== 'open') return res.status(400).json({ success: false, message: 'Project is not accepting applications' });

    // Check if already a member or applicant
    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    const isApplicant = project.applicants.some(a => a.user.toString() === req.user._id.toString());

    if (isMember) return res.status(400).json({ success: false, message: 'Already a member' });
    if (isApplicant) return res.status(400).json({ success: false, message: 'Already applied' });

    project.applicants.push({
      user: req.user._id,
      message: req.body.message || ''
    });

    await project.save();
    res.json({ success: true, message: 'Application submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to apply' });
  }
});

// @route   PUT /api/projects/:id/accept/:userId
// @desc    Accept an applicant (creator only)
router.put('/:id/accept/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can accept members' });
    }

    if (project.members.length >= project.maxTeamSize) {
      return res.status(400).json({ success: false, message: 'Team is full' });
    }

    project.members.push({ user: req.params.userId, role: 'member' });
    project.applicants = project.applicants.filter(a => a.user.toString() !== req.params.userId);

    if (project.members.length >= 2 && project.status === 'open') {
      project.status = 'in-progress';
    }

    await project.save();
    res.json({ success: true, message: 'Member accepted', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept member' });
  }
});

// @route   PUT /api/projects/:id/complete
// @desc    Mark project as completed (creator only)
router.put('/:id/complete', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can complete' });
    }

    project.status = 'completed';
    if (req.body.githubUrl) project.githubUrl = req.body.githubUrl;
    if (req.body.liveUrl) project.liveUrl = req.body.liveUrl;
    await project.save();

    // Award XP to all members
    for (const member of project.members) {
      try {
        await GamificationService.awardXP(member.user, project.xpReward, 'project_completed');
      } catch (e) { /* non-critical */ }
    }

    res.json({ success: true, message: 'Project completed!', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete project' });
  }
});

// @route   GET /api/projects/me/list
// @desc    Get user's projects
router.get('/me/list', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { creator: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('creator', 'name avatarIndex')
    .populate('members.user', 'name avatarIndex')
    .lean();

    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load projects' });
  }
});

module.exports = router;
