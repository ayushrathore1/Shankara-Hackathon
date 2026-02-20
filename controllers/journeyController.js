const UserCareerJourney = require('../models/UserCareerJourney');
const CareerRoadmap = require('../models/CareerRoadmap');
const FreeResource = require('../models/FreeResource');
const User = require('../models/User');
const EventService = require('../services/EventService');

/**
 * @desc    Get user's active career journey
 * @route   GET /api/journey/active
 * @access  Private
 */
exports.getActiveJourney = async (req, res) => {
  try {
    const journey = await UserCareerJourney.getActiveJourney(req.user._id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active career journey found. Start one from Career Explorer!',
        data: null
      });
    }

    res.json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get journey overview/dashboard data
 * @route   GET /api/journey/overview
 * @access  Private
 */
exports.getJourneyOverview = async (req, res) => {
  try {
    const journey = await UserCareerJourney.getActiveJourney(req.user._id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active career journey',
        data: null
      });
    }

    // Get current phase details
    const currentPhase = journey.roadmap.phases.find(
      p => p.phaseId === journey.roadmap.currentPhaseId
    );

    // Calculate next actions
    const nextActions = [];
    if (currentPhase) {
      const incompleteResources = currentPhase.resources
        .filter(r => !r.isCompleted)
        .slice(0, 3);
      
      incompleteResources.forEach((resource, idx) => {
        nextActions.push({
          type: 'resource',
          title: resource.title,
          resourceType: resource.type,
          resourceId: resource.resourceId || resource.externalResourceId,
          phaseId: currentPhase.phaseId,
          duration: resource.duration,
          priority: idx === 0 ? 'high' : 'medium'
        });
      });

      // Check for projects
      if (currentPhase.progress >= 50) {
        const readyProjects = currentPhase.projects.filter(p => !p.isStarted);
        if (readyProjects.length > 0) {
          nextActions.push({
            type: 'project',
            title: readyProjects[0].title,
            projectId: readyProjects[0].projectId,
            phaseId: currentPhase.phaseId,
            priority: 'medium'
          });
        }
      }
    }

    // Calculate estimated time remaining
    const totalPhases = journey.roadmap.phases.length;
    const completedPhases = journey.stats.phasesCompleted;
    const avgWeeksPerPhase = journey.roadmap.estimatedWeeks / totalPhases;
    const remainingWeeks = Math.round((totalPhases - completedPhases) * avgWeeksPerPhase);

    res.json({
      success: true,
      data: {
        career: journey.career,
        currentPhase: currentPhase ? {
          phaseId: currentPhase.phaseId,
          phaseNumber: currentPhase.phaseNumber,
          title: currentPhase.title,
          progress: currentPhase.progress,
          resourcesRemaining: currentPhase.resources.filter(r => !r.isCompleted).length
        } : null,
        stats: journey.stats,
        nextActions,
        timeline: {
          startedAt: journey.startedAt,
          estimatedWeeks: journey.roadmap.estimatedWeeks,
          remainingWeeks,
          targetDate: journey.targetDate
        },
        totalPhases: totalPhases,
        preferences: journey.preferences
      }
    });
  } catch (error) {
    console.error('Error fetching journey overview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get full roadmap for the journey
 * @route   GET /api/journey/roadmap
 * @access  Private
 */
exports.getJourneyRoadmap = async (req, res) => {
  try {
    const journey = await UserCareerJourney.getActiveJourney(req.user._id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active career journey'
      });
    }

    res.json({
      success: true,
      data: {
        career: journey.career,
        phases: journey.roadmap.phases,
        currentPhaseId: journey.roadmap.currentPhaseId,
        estimatedWeeks: journey.roadmap.estimatedWeeks,
        stats: journey.stats
      }
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Start a new career journey
 * @route   POST /api/journey/start
 * @access  Private
 */
exports.startJourney = async (req, res) => {
  try {
    const { career, preferences } = req.body;
    
    if (!career || (!career.title && !career.name)) {
      return res.status(400).json({
        success: false,
        message: 'Career data is required (provide career.title or career.name)'
      });
    }

    // Fetch user's learning preferences (language, region, AI tools)
    const userDoc = await User.findById(req.user._id).select('learningPreferences').lean();
    const userLearningPrefs = userDoc?.learningPreferences || {};

    // Merge user-level prefs with journey-level prefs
    const mergedPrefs = {
      ...preferences,
      language: preferences?.language || userLearningPrefs.language || 'auto',
      region: preferences?.region || userLearningPrefs.region || 'IN',
      contentCreatorPreference: preferences?.contentCreatorPreference || userLearningPrefs.contentCreatorPreference || 'no-preference',
      includeAITools: preferences?.includeAITools ?? userLearningPrefs.includeAITools ?? true,
      experienceLevel: preferences?.experienceLevel || userLearningPrefs.experienceLevel || 'beginner',
    };

    // Generate roadmap (AI service with YouTube video enrichment)
    const roadmap = await generateDefaultRoadmap(career, mergedPrefs);

    // Create the journey
    const journey = await UserCareerJourney.startJourney(
      req.user._id,
      {
        careerId: career.careerId || career.name?.toLowerCase().replace(/\s+/g, '-'),
        title: career.name || career.title,
        description: career.description,
        icon: career.icon,
        demandLevel: career.demandLevel,
        avgSalary: career.avgSalaryUSD || career.avgSalary,
        growthRate: career.growthRate
      },
      {
        weeklyHours: mergedPrefs.weeklyHours || 10,
        experienceLevel: mergedPrefs.experienceLevel || 'beginner',
        learningStyle: mergedPrefs.learningStyle || 'mixed',
        language: mergedPrefs.language,
        region: mergedPrefs.region,
        contentCreatorPreference: mergedPrefs.contentCreatorPreference,
        includeAITools: mergedPrefs.includeAITools,
      },
      roadmap
    );

    // Update user's career goal
    await User.findByIdAndUpdate(req.user._id, {
      $set: { careerGoal: career.name || career.title }
    });

    // Record event — use correct static methods
    try {
      await EventService.pathEnrolled(
        req.user._id,
        journey._id,
        journey.career.title
      );
    } catch (evtErr) {
      console.error('Event recording failed:', evtErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Career journey started successfully!',
      data: journey
    });
  } catch (error) {
    console.error('Error starting journey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start journey',
      error: error.message
    });
  }
};

/**
 * @desc    Complete a resource in the journey
 * @route   POST /api/journey/resource/complete
 * @access  Private
 */
exports.completeResource = async (req, res) => {
  try {
    const { phaseId, resourceId } = req.body;
    
    if (!phaseId || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'phaseId and resourceId are required'
      });
    }

    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active journey found'
      });
    }

    await journey.completeResource(phaseId, resourceId);

    // Record event — resource completed
    try {
      const phase = journey.roadmap.phases.find(p => p.phaseId === phaseId);
      const resource = phase?.resources?.find(r => (r.resourceId || r.externalResourceId) === resourceId);
      await EventService.resourceCompleted(
        req.user._id,
        resourceId,
        resource?.title || 'Resource',
        resource?.type || 'video',
        0,
        journey._id
      );
    } catch (evtErr) {
      console.error('Event recording failed:', evtErr.message);
    }

    res.json({
      success: true,
      message: 'Resource completed!',
      data: {
        phaseProgress: journey.roadmap.phases.find(p => p.phaseId === phaseId)?.progress,
        overallProgress: journey.stats.overallProgress,
        xpEarned: 10
      }
    });
  } catch (error) {
    console.error('Error completing resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete resource',
      error: error.message
    });
  }
};

/**
 * @desc    Get next recommended actions
 * @route   GET /api/journey/next-actions
 * @access  Private
 */
exports.getNextActions = async (req, res) => {
  try {
    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active journey'
      });
    }

    const actions = journey.getNextActions();

    res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    console.error('Error getting next actions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get journey history/timeline
 * @route   GET /api/journey/history
 * @access  Private
 */
exports.getJourneyHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: 'active'
    }).select('history career startedAt').lean();

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active journey'
      });
    }

    // Get recent history
    const history = journey.history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        career: journey.career,
        startedAt: journey.startedAt,
        events: history
      }
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Pause/Resume journey
 * @route   POST /api/journey/toggle-pause
 * @access  Private
 */
exports.togglePauseJourney = async (req, res) => {
  try {
    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: { $in: ['active', 'paused'] }
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No journey found'
      });
    }

    const wasPaused = journey.status === 'paused';
    
    journey.status = wasPaused ? 'active' : 'paused';
    if (wasPaused) {
      journey.history.push({
        eventType: 'JOURNEY_RESUMED',
        timestamp: new Date()
      });
    } else {
      journey.pausedAt = new Date();
      journey.history.push({
        eventType: 'JOURNEY_PAUSED',
        timestamp: new Date()
      });
    }

    await journey.save();

    res.json({
      success: true,
      message: wasPaused ? 'Journey resumed!' : 'Journey paused',
      data: { status: journey.status }
    });
  } catch (error) {
    console.error('Error toggling pause:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Regenerate roadmap with real YouTube resources
 * @route   POST /api/journey/regenerate-roadmap
 * @access  Private
 */
exports.regenerateRoadmap = async (req, res) => {
  try {
    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: { $in: ['active', 'paused'] }
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active journey found'
      });
    }

    const careerName = journey.career?.title || journey.career?.name || 'Developer';

    // Fetch user preferences
    const user = await User.findById(req.user._id).select('learningPreferences').lean();
    const userPrefs = user?.learningPreferences || {};

    const mergedPrefs = {
      weeklyHours: journey.preferences?.weeklyHours || 10,
      experienceLevel: journey.preferences?.experienceLevel || 'beginner',
      language: userPrefs.language || journey.preferences?.language || 'auto',
      region: userPrefs.region || journey.preferences?.region || 'IN',
      contentCreatorPreference: userPrefs.contentCreatorPreference || 'no-preference',
      includeAITools: userPrefs.includeAITools ?? true,
      forceRefresh: true, // bypass cache — generate fresh with YouTube enrichment
    };

    console.log(`🔄 Regenerating roadmap for "${careerName}" with YouTube enrichment...`);

    // Build a map of completed resource IDs to preserve completion status
    const completedMap = new Map();
    for (const phase of (journey.roadmap?.phases || [])) {
      for (const res of (phase.resources || [])) {
        if (res.isCompleted) {
          completedMap.set(res.title?.toLowerCase(), {
            isCompleted: true,
            completedAt: res.completedAt,
            progress: 100,
            autoCompleted: res.autoCompleted,
          });
        }
      }
    }

    // Generate fresh roadmap with real YouTube resources
    const newRoadmap = await generateDefaultRoadmap({ name: careerName }, mergedPrefs);

    // Preserve completion status for resources with matching titles
    for (const phase of newRoadmap.phases) {
      for (const res of (phase.resources || [])) {
        const match = completedMap.get(res.title?.toLowerCase());
        if (match) {
          Object.assign(res, match);
        }
      }
    }

    // Count YouTube-enriched resources
    const videoCount = newRoadmap.phases.reduce((sum, p) =>
      sum + (p.resources || []).filter(r => r.videoId).length, 0
    );

    // Update journey roadmap
    journey.roadmap.phases = newRoadmap.phases;
    journey.roadmap.estimatedWeeks = newRoadmap.estimatedWeeks;
    journey.roadmap.generatedAt = new Date();
    journey.roadmap.generatedBy = 'ai';

    journey.history.push({
      eventType: 'ROADMAP_REGENERATED',
      timestamp: new Date(),
      details: { reason: 'YouTube enrichment', videoResourceCount: videoCount }
    });

    await journey.save();

    console.log(`✅ Regenerated roadmap for "${careerName}": ${newRoadmap.phases.length} phases, ${videoCount} YouTube videos`);

    res.json({
      success: true,
      message: `Roadmap regenerated with ${videoCount} real YouTube resources`,
      data: {
        roadmap: journey.roadmap,
        stats: journey.stats,
        videoResourceCount: videoCount,
      }
    });
  } catch (error) {
    console.error('Error regenerating roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate roadmap',
      error: error.message
    });
  }
};

// ============= Helper Functions =============

/**
 * Generate roadmap phases — tries AI-powered generation first, falls back to defaults.
 */
async function generateDefaultRoadmap(career, preferences) {
  const careerName = career.name || career.title || 'Developer';
  const weeklyHours = preferences?.weeklyHours || 10;
  const experienceLevel = preferences?.experienceLevel || 'beginner';

  // ─── 1. Try AI-generated roadmap via LearningPlanService ───
  try {
    const learningPlanService = require('../services/LearningPlanService');
    // Pass user preferences (language, region, AI tools) to the plan generator
    const result = await learningPlanService.generateLearningPlan(careerName, {
      language: preferences?.language || 'auto',
      region: preferences?.region || 'IN',
      contentCreatorPreference: preferences?.contentCreatorPreference || 'no-preference',
      includeAITools: preferences?.includeAITools ?? true,
      experienceLevel: experienceLevel,
      forceRefresh: preferences?.forceRefresh || false,
    });

    if (result.success && result.plan?.phases?.length > 0) {
      console.log(`✅ AI roadmap generated for "${careerName}" (${result.plan.phases.length} phases)`);
      return convertAIPlanToRoadmap(result.plan, preferences);
    }
  } catch (err) {
    console.log(`⚠️ AI roadmap generation failed for "${careerName}", using defaults:`, err.message);
  }

  // ─── 2. Fallback: vault resources + hardcoded structure ────
  return generateFallbackRoadmap(careerName, weeklyHours, experienceLevel);
}

/**
 * Convert an AI-generated learning plan into the journey roadmap schema.
 *
 * AI plan phase format:
 *   { phase, title, duration, objectives, skills, steps[], projects[], milestones[] }
 *
 * Journey roadmap phase format:
 *   { phaseId, phaseNumber, title, description, status, progress, priority,
 *     durationWeeks, skills[], resources[], projects[], milestones[] }
 */
function convertAIPlanToRoadmap(aiPlan, preferences) {
  const weeklyHours = preferences?.weeklyHours || 10;
  const phases = (aiPlan.phases || []).map((aiPhase, idx) => {
    const phaseNum = aiPhase.phase || (idx + 1);
    const phaseId = `phase-${phaseNum}`;

    // Map step type to resource type
    const typeMap = { learn: 'course', build: 'tutorial', practice: 'practice', read: 'article', explore: 'video' };

    // Convert AI steps → journey resources (with YouTube video data)
    const resources = (aiPhase.steps || []).map((step, i) => {
      // Flatten resources from the step's resource array (includes YouTube videos)
      const stepResources = (step.resources || []).map((res, ri) => ({
        externalResourceId: `${phaseId}-r${i + 1}-${ri + 1}`,
        type: typeMap[res.type] || res.type || typeMap[step.type] || 'video',
        title: res.name || step.title || `Step ${i + 1}`,
        url: res.url || res.youtubeUrl || '',
        provider: res.provider || '',
        duration: res.durationSeconds ? Math.round(res.durationSeconds / 60) : (step.estimatedHours || 1) * 60,
        isCompleted: false,
        progress: 0,
        order: (i * 10) + ri + 1,
        // YouTube video integration fields
        videoId: res.videoId || null,
        youtubeUrl: res.youtubeUrl || null,
        thumbnailUrl: res.thumbnailUrl || null,
        qualityScore: res.qualityScore || null,
        autoCompleted: false,
      }));

      // If no resources from AI, create a default resource from the step itself
      if (stepResources.length === 0) {
        return [{
          externalResourceId: `${phaseId}-r${i + 1}`,
          type: typeMap[step.type] || step.type || 'video',
          title: step.title || `Step ${i + 1}`,
          duration: (step.estimatedHours || 1) * 60,
          isCompleted: false,
          progress: 0,
          order: step.order || (i + 1),
        }];
      }

      return stepResources;
    }).flat(); // Flatten nested resource arrays

    // Convert AI projects → journey projects
    const projects = (aiPhase.projects || []).map((proj, i) => ({
      projectId: `${phaseId}-p${i + 1}`,
      title: proj.name || proj.title || `Project ${i + 1}`,
      description: proj.description || '',
      difficulty: proj.difficulty || 'beginner',
      estimatedHours: proj.estimatedHours || 10,
      isStarted: false,
      isCompleted: false
    }));

    // Convert AI skills → journey skills
    const skills = (aiPhase.skills || []).map(skillName => ({
      skillName: typeof skillName === 'string' ? skillName : skillName.name || 'Skill',
      targetScore: 80,
      currentScore: 0
    }));

    // Convert AI milestones → journey milestones
    const milestones = (aiPhase.milestones || []).map((m, i) => ({
      milestoneId: `${phaseId}-m${i + 1}`,
      title: typeof m === 'string' ? m : (m.title || `Milestone ${i + 1}`),
      xpReward: 50 + (phaseNum * 25),
      isAchieved: false
    }));

    // Parse duration string like "3-4 weeks" → number
    const durationWeeks = parseDurationWeeks(aiPhase.duration) || 4;

    // Determine priority based on phase position
    let priority = 'medium';
    if (phaseNum <= 2) priority = 'critical';
    else if (phaseNum <= 4) priority = 'high';

    return {
      phaseId,
      phaseNumber: phaseNum,
      title: aiPhase.title || `Phase ${phaseNum}`,
      description: (aiPhase.objectives || []).join('. ') || aiPhase.title || '',
      status: phaseNum === 1 ? 'in_progress' : 'locked',
      progress: 0,
      priority,
      startedAt: phaseNum === 1 ? new Date() : undefined,
      durationWeeks,
      skills: skills.length > 0 ? skills : [{ skillName: aiPhase.title || 'Core Skills', targetScore: 80, currentScore: 0 }],
      resources: resources.length > 0 ? resources : [
        { externalResourceId: `${phaseId}-r1`, type: 'video', title: `${aiPhase.title} - Introduction`, duration: 30, isCompleted: false, order: 1 },
        { externalResourceId: `${phaseId}-r2`, type: 'article', title: `${aiPhase.title} - Deep Dive`, duration: 20, isCompleted: false, order: 2 },
        { externalResourceId: `${phaseId}-r3`, type: 'practice', title: `${aiPhase.title} - Practice`, duration: 45, isCompleted: false, order: 3 }
      ],
      projects: projects.length > 0 ? projects : [
        { projectId: `${phaseId}-p1`, title: `${aiPhase.title} Project`, difficulty: phaseNum <= 2 ? 'beginner' : 'intermediate', estimatedHours: 8, isStarted: false, isCompleted: false }
      ],
      milestones: milestones.length > 0 ? milestones : [
        { milestoneId: `${phaseId}-m1`, title: `Complete ${aiPhase.title}`, xpReward: 50 + (phaseNum * 25), isAchieved: false }
      ]
    };
  });

  // Calculate estimated weeks
  const baseWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
  const adjustedWeeks = Math.round(baseWeeks * (15 / weeklyHours));

  return {
    phases,
    currentPhaseId: 'phase-1',
    currentPhaseNumber: 1,
    estimatedWeeks: adjustedWeeks,
    generatedAt: new Date(),
    generatedBy: 'ai'
  };
}

/**
 * Parse a duration string like "3-4 weeks" or "2 weeks" into a number.
 */
function parseDurationWeeks(durationStr) {
  if (!durationStr) return null;
  const match = String(durationStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Fallback roadmap generator — uses vault resources + hardcoded structure.
 * Called when AI generation fails.
 */
async function generateFallbackRoadmap(careerName, weeklyHours, experienceLevel) {
  // Try to get existing resources from vault
  let vaultResources = [];
  try {
    vaultResources = await FreeResource.find({
      $or: [
        { category: { $regex: careerName, $options: 'i' } },
        { tags: { $in: careerName.toLowerCase().split(' ') } },
        { title: { $regex: careerName.split(' ')[0], $options: 'i' } }
      ],
      isActive: true
    })
    .sort({ codeLearnnScore: -1 })
    .limit(20)
    .select('_id title type duration category tags')
    .lean();
  } catch (e) {
    console.log('Could not fetch vault resources:', e.message);
  }

  const resourcesPerPhase = Math.max(3, Math.ceil(vaultResources.length / 5));

  const phases = [
    {
      phaseId: 'phase-1', phaseNumber: 1,
      title: `${careerName} Fundamentals & Setup`,
      description: `Build the foundational knowledge required for ${careerName}`,
      status: 'in_progress', progress: 0, priority: 'critical',
      startedAt: new Date(),
      durationWeeks: experienceLevel === 'beginner' ? 4 : 2,
      skills: [
        { skillName: 'Programming Basics', targetScore: 80, currentScore: 0 },
        { skillName: 'Version Control', targetScore: 70, currentScore: 0 },
        { skillName: 'Problem Solving', targetScore: 75, currentScore: 0 }
      ],
      resources: vaultResources.slice(0, resourcesPerPhase).map((r, i) => ({
        resourceId: r._id, type: r.type || 'video', title: r.title,
        duration: r.duration || 60, isCompleted: false, progress: 0, order: i + 1
      })),
      projects: [{ projectId: 'p1-1', title: `Setup ${careerName} Development Environment`, difficulty: 'beginner', estimatedHours: 4, isStarted: false, isCompleted: false }],
      milestones: [{ milestoneId: 'm1-1', title: 'Complete fundamentals', xpReward: 50, isAchieved: false }]
    },
    {
      phaseId: 'phase-2', phaseNumber: 2,
      title: `Core ${careerName} Skills`,
      description: `Master the essential technical skills for ${careerName}`,
      status: 'locked', progress: 0, priority: 'critical', durationWeeks: 5,
      skills: [
        { skillName: 'Core Technology', targetScore: 85, currentScore: 0 },
        { skillName: 'Data Structures', targetScore: 70, currentScore: 0 },
        { skillName: 'Algorithms', targetScore: 65, currentScore: 0 }
      ],
      resources: vaultResources.slice(resourcesPerPhase, resourcesPerPhase * 2).map((r, i) => ({
        resourceId: r._id, type: r.type || 'video', title: r.title,
        duration: r.duration || 90, isCompleted: false, progress: 0, order: i + 1
      })),
      projects: [{ projectId: 'p2-1', title: `Build Your First ${careerName} Application`, difficulty: 'beginner', estimatedHours: 8, isStarted: false, isCompleted: false }],
      milestones: [{ milestoneId: 'm2-1', title: 'Complete first project', xpReward: 100, isAchieved: false }]
    },
    {
      phaseId: 'phase-3', phaseNumber: 3,
      title: `Intermediate ${careerName} Concepts`,
      description: `Level up with intermediate ${careerName} concepts and practices`,
      status: 'locked', progress: 0, priority: 'high', durationWeeks: 5,
      skills: [
        { skillName: 'Frameworks', targetScore: 80, currentScore: 0 },
        { skillName: 'Database', targetScore: 75, currentScore: 0 },
        { skillName: 'APIs', targetScore: 80, currentScore: 0 }
      ],
      resources: vaultResources.slice(resourcesPerPhase * 2, resourcesPerPhase * 3).map((r, i) => ({
        resourceId: r._id, type: r.type || 'video', title: r.title,
        duration: r.duration || 120, isCompleted: false, progress: 0, order: i + 1
      })),
      projects: [{ projectId: 'p3-1', title: `Full-Featured ${careerName} Application`, difficulty: 'intermediate', estimatedHours: 16, isStarted: false, isCompleted: false }]
    },
    {
      phaseId: 'phase-4', phaseNumber: 4,
      title: `Advanced ${careerName} & Professional Skills`,
      description: `Master advanced ${careerName} concepts and professional practices`,
      status: 'locked', progress: 0, priority: 'high', durationWeeks: 5,
      skills: [
        { skillName: 'System Design', targetScore: 70, currentScore: 0 },
        { skillName: 'Testing', targetScore: 75, currentScore: 0 },
        { skillName: 'Security', targetScore: 70, currentScore: 0 }
      ],
      resources: vaultResources.slice(resourcesPerPhase * 3, resourcesPerPhase * 4).map((r, i) => ({
        resourceId: r._id, type: r.type || 'video', title: r.title,
        duration: r.duration || 120, isCompleted: false, progress: 0, order: i + 1
      })),
      projects: [{ projectId: 'p4-1', title: `Production-Ready ${careerName} Project`, difficulty: 'advanced', estimatedHours: 24, isStarted: false, isCompleted: false }]
    },
    {
      phaseId: 'phase-5', phaseNumber: 5,
      title: 'Capstone & Career Prep',
      description: `Complete capstone project and prepare for ${careerName} job applications`,
      status: 'locked', progress: 0, priority: 'medium', durationWeeks: 4,
      skills: [
        { skillName: 'Portfolio', targetScore: 85, currentScore: 0 },
        { skillName: 'Interview Prep', targetScore: 80, currentScore: 0 }
      ],
      resources: vaultResources.slice(resourcesPerPhase * 4).map((r, i) => ({
        resourceId: r._id, type: r.type || 'video', title: r.title,
        duration: r.duration || 60, isCompleted: false, progress: 0, order: i + 1
      })),
      projects: [{ projectId: 'p5-1', title: `${careerName} Capstone Project`, difficulty: 'advanced', estimatedHours: 40, isStarted: false, isCompleted: false }],
      milestones: [
        { milestoneId: 'm5-1', title: 'Portfolio complete', xpReward: 200, isAchieved: false },
        { milestoneId: 'm5-2', title: 'Career ready!', xpReward: 500, isAchieved: false }
      ]
    }
  ];

  // Add placeholder resources if no vault resources found
  phases.forEach(phase => {
    if (phase.resources.length === 0) {
      phase.resources = [
        { externalResourceId: `${phase.phaseId}-r1`, type: 'video', title: `${phase.title} - Introduction`, duration: 30, isCompleted: false, order: 1 },
        { externalResourceId: `${phase.phaseId}-r2`, type: 'article', title: `${phase.title} - Deep Dive`, duration: 20, isCompleted: false, order: 2 },
        { externalResourceId: `${phase.phaseId}-r3`, type: 'practice', title: `${phase.title} - Practice`, duration: 45, isCompleted: false, order: 3 }
      ];
    }
  });

  const baseWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
  const adjustedWeeks = Math.round(baseWeeks * (15 / weeklyHours));

  return {
    phases,
    currentPhaseId: 'phase-1',
    currentPhaseNumber: 1,
    estimatedWeeks: adjustedWeeks,
    generatedAt: new Date(),
    generatedBy: 'default'
  };
}

module.exports = exports;
