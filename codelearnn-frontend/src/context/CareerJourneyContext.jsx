import { useState, useEffect, createContext, useContext } from "react";
import { journeyAPI, careerAPI, careerProfileAPI } from "../services/api";
import { useAuth } from "./AuthContext";

// Create context for journey state
const CareerJourneyContext = createContext(null);

export const useCareerJourney = () => {
  const context = useContext(CareerJourneyContext);
  if (!context) {
    throw new Error(
      "useCareerJourney must be used within CareerJourneyProvider",
    );
  }
  return context;
};

// Local storage key for offline fallback
const JOURNEY_STORAGE_KEY = "codelearnn_career_journey";

/**
 * Convert AI learning plan phases into the journey roadmap phase format.
 * AI phases have: { phase, title, duration, objectives, skills, steps[], projects[], milestones[] }
 * Journey phases need: { phaseId, phaseNumber, title, description, status, progress, priority,
 *                        durationWeeks, skills[], resources[], projects[], milestones[] }
 */
function convertAIPhasesToJourneyPhases(aiPhases, careerName) {
  const typeMap = { learn: "course", build: "tutorial", practice: "practice", read: "article", explore: "video" };

  return aiPhases.map((aiPhase, idx) => {
    const phaseNum = aiPhase.phase || idx + 1;
    const phaseId = `phase-${phaseNum}`;

    // Flatten step resources — each step may contain multiple enriched resources (YouTube videos etc.)
    const resources = (aiPhase.steps || []).flatMap((step, i) => {
      const stepResources = (step.resources || []);
      if (stepResources.length > 0) {
        return stepResources.map((res, ri) => ({
          resourceId: `${phaseId}-r${i + 1}-${ri + 1}`,
          type: typeMap[res.type] || res.type || typeMap[step.type] || "video",
          title: res.name || step.title || `Step ${i + 1}`,
          url: res.url || res.youtubeUrl || "",
          provider: res.provider || "",
          duration: res.durationSeconds ? Math.round(res.durationSeconds / 60) : (step.estimatedHours || 1) * 60,
          isCompleted: false,
          order: (i * 10) + ri + 1,
          // YouTube video fields
          videoId: res.videoId || null,
          youtubeUrl: res.youtubeUrl || null,
          thumbnailUrl: res.thumbnailUrl || null,
          qualityScore: res.qualityScore || null,
        }));
      }
      // No sub-resources: create a default from the step itself
      return [{
        resourceId: `${phaseId}-r${i + 1}`,
        type: typeMap[step.type] || step.type || "video",
        title: step.title || `Step ${i + 1}`,
        duration: (step.estimatedHours || 1) * 60,
        isCompleted: false,
        order: step.order || i + 1,
      }];
    });

    const projects = (aiPhase.projects || []).map((p, i) => ({
      projectId: `${phaseId}-p${i + 1}`,
      title: p.name || p.title || `Project ${i + 1}`,
      description: p.description || "",
      difficulty: p.difficulty || "beginner",
      estimatedHours: p.estimatedHours || 10,
      isStarted: false,
      isCompleted: false,
    }));

    const skills = (aiPhase.skills || []).map((s) => ({
      skillName: typeof s === "string" ? s : s.name || "Skill",
      targetScore: 80,
      currentScore: 0,
    }));

    const milestones = (aiPhase.milestones || []).map((m, i) => ({
      milestoneId: `${phaseId}-m${i + 1}`,
      title: typeof m === "string" ? m : m.title || `Milestone ${i + 1}`,
      xpReward: 50 + phaseNum * 25,
      isAchieved: false,
    }));

    // Parse duration like "3-4 weeks" → number
    const durationMatch = String(aiPhase.duration || "").match(/(\d+)/);
    const durationWeeks = durationMatch ? parseInt(durationMatch[1], 10) : 4;

    let priority = "medium";
    if (phaseNum <= 2) priority = "critical";
    else if (phaseNum <= 4) priority = "high";

    return {
      phaseId,
      phaseNumber: phaseNum,
      title: aiPhase.title || `Phase ${phaseNum}`,
      description: (aiPhase.objectives || []).join(". ") || aiPhase.title || "",
      status: phaseNum === 1 ? "in_progress" : "locked",
      progress: 0,
      priority,
      startedAt: phaseNum === 1 ? new Date().toISOString() : undefined,
      durationWeeks,
      skills: skills.length > 0 ? skills : [{ skillName: aiPhase.title || "Core Skills", targetScore: 80, currentScore: 0 }],
      resources: resources.length > 0 ? resources : [
        { resourceId: `${phaseId}-r1`, type: "video", title: `${aiPhase.title} - Introduction`, duration: 30, isCompleted: false, order: 1 },
        { resourceId: `${phaseId}-r2`, type: "article", title: `${aiPhase.title} - Deep Dive`, duration: 20, isCompleted: false, order: 2 },
      ],
      projects: projects.length > 0 ? projects : [
        { projectId: `${phaseId}-p1`, title: `${aiPhase.title} Project`, difficulty: phaseNum <= 2 ? "beginner" : "intermediate", estimatedHours: 8, isStarted: false, isCompleted: false },
      ],
      milestones: milestones.length > 0 ? milestones : [
        { milestoneId: `${phaseId}-m1`, title: `Complete ${aiPhase.title}`, xpReward: 50 + phaseNum * 25, isAchieved: false },
      ],
    };
  });
}

export const CareerJourneyProvider = ({ children }) => {
  const [journey, setJourney] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [careerHistory, setCareerHistory] = useState([]);
  const [pendingSwitch, setPendingSwitch] = useState(null); // { journeyId, title } when awaiting confirm

  // Get auth context - if not authenticated, we'll work offline only
  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth?.isAuthenticated || false;
  } catch (_) {
    // AuthContext not available, work offline
    isAuthenticated = false;
  }

  // Load journey from backend (or localStorage fallback)
  useEffect(() => {
    const loadJourney = async () => {
      setIsLoading(true);
      try {
        // Try backend first if authenticated
        if (isAuthenticated) {
          try {
            const response = await journeyAPI.getActive();
            if (response.data?.success && response.data?.data) {
              const backendJourney = response.data.data;
              // Convert to frontend format
              setJourney({
                ...backendJourney,
                isActive: backendJourney.status === "active",
                currentPhase: {
                  phaseId: backendJourney.roadmap?.currentPhaseId,
                  phaseNumber: backendJourney.roadmap?.currentPhaseNumber,
                  progress:
                    backendJourney.roadmap?.phases?.find(
                      (p) =>
                        p.phaseId === backendJourney.roadmap?.currentPhaseId,
                    )?.progress || 0,
                },
              });
              // Also sync to localStorage for offline access
              localStorage.setItem(
                JOURNEY_STORAGE_KEY,
                JSON.stringify(backendJourney),
              );
              return;
            }
          } catch (apiError) {
            // API error (404 means no journey exists - this is expected behavior)
            // Only log actual errors, not expected 404s
            if (apiError.response?.status !== 404) {
              console.error("Backend journey fetch failed:", apiError);
            }
            // 404 is silently handled - user simply has no journey yet
          }
        }

        // Fallback to localStorage
        const stored = localStorage.getItem(JOURNEY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setJourney(parsed);
        }
      } catch (err) {
        console.error("Error loading journey:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadJourney();
  }, [isAuthenticated]);

  // Load career history from backend
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadHistory = async () => {
      try {
        const res = await careerProfileAPI.get();
        if (res.data?.success) {
          setCareerHistory(res.data.data.careerHistory || []);
        }
      } catch {
        // History load is best-effort
      }
    };
    loadHistory();
  }, [isAuthenticated, journey]);

  // Save journey to localStorage whenever it changes (for offline access)
  useEffect(() => {
    if (journey) {
      localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journey));
    }
  }, [journey]);

  // Start a new career journey
  const startJourney = async (careerData, preferences) => {
    try {
      // Try backend first if authenticated
      if (isAuthenticated) {
        try {
          const response = await journeyAPI.start(careerData, preferences);
          if (response.data?.success && response.data?.data) {
            const backendJourney = response.data.data;
            setJourney({
              ...backendJourney,
              isActive: backendJourney.status === "active",
              currentPhase: {
                phaseId: backendJourney.roadmap?.currentPhaseId,
                phaseNumber: backendJourney.roadmap?.currentPhaseNumber,
                progress: 0,
              },
            });

            // Auto-save career to user profile
            try {
              await careerProfileAPI.set({
                careerId: careerData.careerId || careerData.name?.toLowerCase().replace(/\s+/g, "-"),
                title: careerData.name || careerData.title,
              });
            } catch {
              // Profile save is best-effort
            }

            return backendJourney;
          }
        } catch (apiErr) {
          console.warn("Backend journey start failed, trying AI plan:", apiErr.message);
        }
      }

      // Try to get AI-generated phases from the public learning plan API
      const newJourney = await createSmartLocalJourney(careerData, preferences);
      setJourney(newJourney);
      return newJourney;
    } catch (err) {
      console.error("Error starting journey:", err);
      // Final fallback to hardcoded local journey
      const newJourney = createLocalJourney(careerData, preferences);
      setJourney(newJourney);
      return newJourney;
    }
  };

  // Create a local journey enriched with AI-generated learning plan data
  const createSmartLocalJourney = async (careerData, preferences) => {
    const careerName = careerData.name || careerData.title || "Developer";
    let phases;
    let generatedBy = "default";

    try {
      // Call the PUBLIC learning plan API (no auth required)
      const response = await careerAPI.getLearningPlan(careerName);
      if (response.data?.success && response.data?.data?.phases?.length > 0) {
        phases = convertAIPhasesToJourneyPhases(response.data.data.phases, careerName);
        generatedBy = "ai";
        console.log(`✅ AI journey generated for "${careerName}" (${phases.length} phases)`);
      }
    } catch (aiErr) {
      console.warn("AI learning plan fetch failed, using defaults:", aiErr.message);
    }

    if (!phases) {
      phases = generateDefaultPhases(careerData);
    }

    return {
      id: Date.now().toString(),
      isActive: true,
      startedAt: new Date().toISOString(),
      career: {
        careerId: careerData.careerId || careerName.toLowerCase().replace(/\s+/g, "-"),
        title: careerName,
        description: careerData.description,
        icon: careerData.icon,
        demandLevel: careerData.demandLevel,
        avgSalary: careerData.avgSalaryUSD,
        growthRate: careerData.growthRate,
      },
      preferences: {
        weeklyHours: preferences.weeklyHours || 10,
        experienceLevel: preferences.experienceLevel || "beginner",
        learningStyle: preferences.learningStyle || "mixed",
      },
      roadmap: {
        phases,
        estimatedWeeks: calculateEstimatedWeeks(preferences.weeklyHours),
        generatedAt: new Date().toISOString(),
        generatedBy,
        currentPhaseId: "phase-1",
        currentPhaseNumber: 1,
      },
      currentPhase: {
        phaseId: "phase-1",
        phaseNumber: 1,
        progress: 0,
      },
      stats: {
        overallProgress: 0,
        phasesCompleted: 0,
        resourcesCompleted: 0,
        projectsCompleted: 0,
        skillsAcquired: 0,
        totalLearningMinutes: 0,
        currentStreak: 0,
        onTrackStatus: "on_track",
        lastActivityDate: new Date().toISOString(),
      },
      history: [
        {
          eventType: "JOURNEY_STARTED",
          eventData: { career: careerName },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  };

  // Helper to create local journey (hardcoded fallback — only used if AI fails completely)
  const createLocalJourney = (careerData, preferences) => ({
    id: Date.now().toString(),
    isActive: true,
    startedAt: new Date().toISOString(),
    career: {
      careerId:
        careerData.careerId ||
        careerData.name?.toLowerCase().replace(/\s+/g, "-"),
      title: careerData.name || careerData.title,
      description: careerData.description,
      icon: careerData.icon,
      demandLevel: careerData.demandLevel,
      avgSalary: careerData.avgSalaryUSD,
      growthRate: careerData.growthRate,
    },
    preferences: {
      weeklyHours: preferences.weeklyHours || 10,
      experienceLevel: preferences.experienceLevel || "beginner",
      learningStyle: preferences.learningStyle || "mixed",
    },
    roadmap: {
      phases: generateDefaultPhases(careerData),
      estimatedWeeks: calculateEstimatedWeeks(preferences.weeklyHours),
      generatedAt: new Date().toISOString(),
      generatedBy: "default",
      currentPhaseId: "phase-1",
      currentPhaseNumber: 1,
    },
    currentPhase: {
      phaseId: "phase-1",
      phaseNumber: 1,
      progress: 0,
    },
    stats: {
      overallProgress: 0,
      phasesCompleted: 0,
      resourcesCompleted: 0,
      projectsCompleted: 0,
      skillsAcquired: 0,
      totalLearningMinutes: 0,
      currentStreak: 0,
      onTrackStatus: "on_track",
      lastActivityDate: new Date().toISOString(),
    },
    history: [
      {
        eventType: "JOURNEY_STARTED",
        eventData: { career: careerData.name },
        timestamp: new Date().toISOString(),
      },
    ],
  });

  // Update journey progress
  const updateProgress = (phaseId, resourceId, _progressData) => {
    if (!journey) return;

    setJourney((prev) => {
      const updated = { ...prev };

      // Update resource completion
      const phase = updated.roadmap.phases.find((p) => p.phaseId === phaseId);
      if (phase) {
        const resource = phase.resources.find(
          (r) => r.resourceId === resourceId,
        );
        if (resource && !resource.isCompleted) {
          resource.isCompleted = true;
          resource.completedAt = new Date().toISOString();

          // Update phase progress
          const completedCount = phase.resources.filter(
            (r) => r.isCompleted,
          ).length;
          const totalCount = phase.resources.length;
          phase.progress = Math.round((completedCount / totalCount) * 100);

          // Update current phase
          if (updated.currentPhase.phaseId === phaseId) {
            updated.currentPhase.progress = phase.progress;
          }

          // Update stats
          updated.stats.resourcesCompleted++;
          updated.stats.lastActivityDate = new Date().toISOString();

          // Calculate overall progress
          const allPhases = updated.roadmap.phases;
          const totalProgress = allPhases.reduce(
            (sum, p) => sum + (p.progress || 0),
            0,
          );
          updated.stats.overallProgress = Math.round(
            totalProgress / allPhases.length,
          );

          // Check if phase is complete
          if (phase.progress >= 100 && phase.status !== "completed") {
            phase.status = "completed";
            phase.completedAt = new Date().toISOString();
            updated.stats.phasesCompleted++;

            // Unlock next phase
            const currentIdx = allPhases.findIndex(
              (p) => p.phaseId === phaseId,
            );
            if (currentIdx < allPhases.length - 1) {
              const nextPhase = allPhases[currentIdx + 1];
              nextPhase.status = "in_progress";
              nextPhase.startedAt = new Date().toISOString();
              updated.currentPhase = {
                phaseId: nextPhase.phaseId,
                phaseNumber: nextPhase.phaseNumber,
                progress: 0,
              };
            }
          }

          // Add to history
          updated.history.push({
            eventType: "RESOURCE_COMPLETED",
            eventData: { resourceId, phaseId },
            timestamp: new Date().toISOString(),
          });
        }
      }

      return updated;
    });
  };

  // Complete a project
  const completeProject = (phaseId, projectId) => {
    if (!journey) return;

    setJourney((prev) => {
      const updated = { ...prev };
      const phase = updated.roadmap.phases.find((p) => p.phaseId === phaseId);

      if (phase) {
        const project = phase.projects?.find((p) => p.projectId === projectId);
        if (project && !project.isCompleted) {
          project.isCompleted = true;
          project.completedAt = new Date().toISOString();
          updated.stats.projectsCompleted++;

          // Projects give bonus progress
          phase.progress = Math.min(100, (phase.progress || 0) + 15);

          updated.history.push({
            eventType: "PROJECT_COMPLETED",
            eventData: { projectId, phaseId },
            timestamp: new Date().toISOString(),
          });
        }
      }

      return updated;
    });
  };

  // Get next recommended actions
  const getNextActions = () => {
    if (!journey || !journey.roadmap?.phases) return [];

    const currentPhase = journey.roadmap.phases.find(
      (p) => p.phaseId === journey.currentPhase?.phaseId,
    );

    if (!currentPhase) return [];

    const actions = [];

    // Find incomplete resources
    const incompleteResources = (currentPhase.resources || [])
      .filter((r) => !r.isCompleted)
      .slice(0, 2);

    incompleteResources.forEach((resource) => {
      actions.push({
        type: "resource",
        title: resource.title,
        description: `Continue with ${resource.type}`,
        resourceId: resource.resourceId,
        phaseId: currentPhase.phaseId,
        priority: "high",
      });
    });

    // Check for pending projects
    const pendingProjects = (currentPhase.projects || []).filter(
      (p) => !p.isStarted && currentPhase.progress >= 50,
    );

    if (pendingProjects.length > 0) {
      actions.push({
        type: "project",
        title: pendingProjects[0].title,
        description: "Ready to start project",
        projectId: pendingProjects[0].projectId,
        phaseId: currentPhase.phaseId,
        priority: "medium",
      });
    }

    return actions;
  };

  // Reset journey
  const resetJourney = () => {
    localStorage.removeItem(JOURNEY_STORAGE_KEY);
    setJourney(null);
  };

  // Check if user has an active journey
  const hasActiveJourney = () => {
    return journey?.isActive === true;
  };

  // Request career switch (triggers confirmation UI)
  const requestSwitch = (journeyId, title) => {
    setPendingSwitch({ journeyId, title });
  };

  // Confirm and execute career switch
  const confirmSwitch = async () => {
    if (!pendingSwitch) return;
    try {
      const res = await careerProfileAPI.switch(pendingSwitch.journeyId);
      if (res.data?.success) {
        // Reload active journey
        const activeRes = await journeyAPI.getActive();
        if (activeRes.data?.success && activeRes.data?.data) {
          const bj = activeRes.data.data;
          setJourney({
            ...bj,
            isActive: bj.status === "active",
            currentPhase: {
              phaseId: bj.roadmap?.currentPhaseId,
              phaseNumber: bj.roadmap?.currentPhaseNumber,
              progress: bj.roadmap?.phases?.find(p => p.phaseId === bj.roadmap?.currentPhaseId)?.progress || 0,
            },
          });
        }
      }
    } catch (err) {
      console.error("Career switch failed:", err);
      setError(err.message);
    } finally {
      setPendingSwitch(null);
    }
  };

  // Cancel pending switch
  const cancelSwitch = () => setPendingSwitch(null);

  const value = {
    journey,
    isLoading,
    error,
    careerHistory,
    pendingSwitch,
    startJourney,
    updateProgress,
    completeProject,
    getNextActions,
    resetJourney,
    hasActiveJourney,
    requestSwitch,
    confirmSwitch,
    cancelSwitch,
  };

  return (
    <CareerJourneyContext.Provider value={value}>
      {children}
    </CareerJourneyContext.Provider>
  );
};

// Helper function to generate default phases based on career (fallback for local/offline mode)
function generateDefaultPhases(career) {
  const careerName = career.name || career.title || "Developer";

  const phases = [
    {
      phaseId: "phase-1",
      phaseNumber: 1,
      title: `${careerName} Fundamentals & Setup`,
      description: `Build the foundational knowledge required for ${careerName}`,
      status: "in_progress",
      progress: 0,
      priority: "critical",
      startedAt: new Date().toISOString(),
      skills: [
        { skillName: "Programming Basics", targetScore: 80, currentScore: 0 },
        { skillName: "Version Control", targetScore: 70, currentScore: 0 },
        { skillName: "Problem Solving", targetScore: 75, currentScore: 0 },
      ],
      resources: [
        { resourceId: "r1-1", type: "video", title: `Introduction to ${careerName}`, duration: 120, isCompleted: false },
        { resourceId: "r1-2", type: "video", title: "Git & GitHub Essentials", duration: 90, isCompleted: false },
        { resourceId: "r1-3", type: "article", title: `${careerName} Environment Setup`, duration: 30, isCompleted: false },
        { resourceId: "r1-4", type: "quiz", title: `${careerName} Fundamentals Assessment`, duration: 20, isCompleted: false },
      ],
      projects: [
        { projectId: "p1-1", title: `Setup ${careerName} Development Environment`, isStarted: false, isCompleted: false },
      ],
      milestones: [
        { milestoneId: "m1-1", title: "Complete fundamentals quiz with 80%+", isAchieved: false },
      ],
      durationWeeks: 3,
    },
    {
      phaseId: "phase-2",
      phaseNumber: 2,
      title: `Core ${careerName} Skills`,
      description: `Master the essential technical skills for ${careerName}`,
      status: "locked",
      progress: 0,
      priority: "critical",
      skills: [
        { skillName: "Core Technology", targetScore: 85, currentScore: 0 },
        { skillName: "Data Structures", targetScore: 70, currentScore: 0 },
        { skillName: "Algorithms", targetScore: 65, currentScore: 0 },
      ],
      resources: [
        { resourceId: "r2-1", type: "course", title: `${careerName} Core Deep Dive`, duration: 300, isCompleted: false },
        { resourceId: "r2-2", type: "video", title: "Data Structures Explained", duration: 180, isCompleted: false },
        { resourceId: "r2-3", type: "practice", title: `${careerName} Coding Challenges`, duration: 120, isCompleted: false },
        { resourceId: "r2-4", type: "quiz", title: `${careerName} Technical Assessment`, duration: 30, isCompleted: false },
      ],
      projects: [
        { projectId: "p2-1", title: `Build Your First ${careerName} Application`, isStarted: false, isCompleted: false },
      ],
      milestones: [
        { milestoneId: "m2-1", title: "Complete first functional project", isAchieved: false },
      ],
      durationWeeks: 4,
    },
    {
      phaseId: "phase-3",
      phaseNumber: 3,
      title: `Intermediate ${careerName} Concepts`,
      description: `Level up with intermediate ${careerName} concepts and practices`,
      status: "locked",
      progress: 0,
      priority: "high",
      skills: [
        { skillName: "Frameworks", targetScore: 80, currentScore: 0 },
        { skillName: "Database Design", targetScore: 75, currentScore: 0 },
        { skillName: "API Development", targetScore: 80, currentScore: 0 },
      ],
      resources: [
        { resourceId: "r3-1", type: "course", title: `${careerName} Frameworks & Tools`, duration: 360, isCompleted: false },
        { resourceId: "r3-2", type: "video", title: "Database Fundamentals", duration: 150, isCompleted: false },
        { resourceId: "r3-3", type: "tutorial", title: "Building REST APIs", duration: 180, isCompleted: false },
      ],
      projects: [
        { projectId: "p3-1", title: `Full-Featured ${careerName} Application`, isStarted: false, isCompleted: false },
      ],
      durationWeeks: 5,
    },
    {
      phaseId: "phase-4",
      phaseNumber: 4,
      title: `Advanced ${careerName} & Professional Skills`,
      description: `Master advanced ${careerName} concepts and professional practices`,
      status: "locked",
      progress: 0,
      priority: "high",
      skills: [
        { skillName: "System Design", targetScore: 70, currentScore: 0 },
        { skillName: "Testing", targetScore: 75, currentScore: 0 },
        { skillName: "Security", targetScore: 70, currentScore: 0 },
      ],
      resources: [
        { resourceId: "r4-1", type: "course", title: `${careerName} System Design`, duration: 240, isCompleted: false },
        { resourceId: "r4-2", type: "video", title: `${careerName} Testing Best Practices`, duration: 120, isCompleted: false },
        { resourceId: "r4-3", type: "article", title: `${careerName} Security Essentials`, duration: 60, isCompleted: false },
      ],
      projects: [
        { projectId: "p4-1", title: `Production-Ready ${careerName} Project`, isStarted: false, isCompleted: false },
      ],
      durationWeeks: 5,
    },
    {
      phaseId: "phase-5",
      phaseNumber: 5,
      title: "Capstone & Career Prep",
      description: `Complete capstone project and prepare for ${careerName} job applications`,
      status: "locked",
      progress: 0,
      priority: "medium",
      skills: [
        { skillName: "Portfolio Building", targetScore: 85, currentScore: 0 },
        { skillName: "Interview Prep", targetScore: 80, currentScore: 0 },
      ],
      resources: [
        { resourceId: "r5-1", type: "guide", title: `${careerName} Portfolio Building Guide`, duration: 60, isCompleted: false },
        { resourceId: "r5-2", type: "course", title: `${careerName} Interview Preparation`, duration: 180, isCompleted: false },
        { resourceId: "r5-3", type: "practice", title: "Mock Interviews", duration: 120, isCompleted: false },
      ],
      projects: [
        { projectId: "p5-1", title: `${careerName} Capstone Project`, isStarted: false, isCompleted: false },
      ],
      milestones: [
        { milestoneId: "m5-1", title: "Portfolio complete with 3+ projects", isAchieved: false },
        { milestoneId: "m5-2", title: "Career ready!", isAchieved: false },
      ],
      durationWeeks: 4,
    },
  ];

  return phases;
}

// Calculate estimated weeks based on weekly hours
function calculateEstimatedWeeks(weeklyHours) {
  const baseWeeks = 21;
  const baseHours = 15;
  const adjustment = baseHours / weeklyHours;
  return Math.round(baseWeeks * adjustment);
}

export default CareerJourneyProvider;
