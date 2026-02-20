import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRocket,
  faChartLine,
  faCheckCircle,
  faLock,
  faPlay,
  faBook,
  faCode,
  faFire,
  faChevronDown,
  faChevronUp,
  faTrophy,
  faLightbulb,
  faSpinner,
  faBolt,
  faGraduationCap,
  faCalendarAlt,
  faLayerGroup,
  faAngleRight,
  faSync,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { useCareerJourney } from "../context/CareerJourneyContext";
import { journeyAPI } from "../services/api";

// Phase Status Badge
const PhaseStatusBadge = ({ status }) => {
  const statusConfig = {
    in_progress: {
      bg: "bg-primary/20",
      text: "text-primary",
      label: "In Progress",
    },
    completed: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      label: "Completed",
    },
    locked: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Locked" },
  };

  const config = statusConfig[status] || statusConfig["locked"];

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-mono ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-bg-elevated"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-text-main">{progress}%</span>
      </div>
    </div>
  );
};

// Phase Card Component
const PhaseCard = ({ phase, isExpanded, onToggle, onResourceComplete }) => {
  const isLocked = phase.status === "locked";
  const isActive = phase.status === "in_progress";
  const isCompleted = phase.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border transition-all duration-300
        ${isActive ? "bg-bg-surface border-primary/50 shadow-lg shadow-primary/10" : ""}
        ${isCompleted ? "bg-bg-surface border-green-500/30" : ""}
        ${isLocked ? "bg-bg-surface/50 border-border" : ""}
      `}
    >
      {/* Phase Header */}
      <button
        onClick={() => onToggle()}
        className={`
          w-full p-5 flex items-center justify-between text-left
          cursor-pointer hover:bg-bg-elevated/50
          transition-colors rounded-xl
        `}
      >
        <div className="flex items-center gap-4">
          <div
            className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold
            ${isActive ? "bg-primary/20 text-primary" : ""}
            ${isCompleted ? "bg-green-500/20 text-green-400" : ""}
            ${isLocked ? "bg-bg-elevated text-text-dim" : ""}
          `}
          >
            {isCompleted ? (
              <FontAwesomeIcon icon={faCheckCircle} />
            ) : isLocked ? (
              <FontAwesomeIcon icon={faLock} />
            ) : (
              phase.phaseNumber
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-text-main">
                {phase.title}
              </h3>
              <PhaseStatusBadge status={phase.status} />
            </div>
            <p className="text-sm text-text-muted">{phase.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress indicator */}
          {(
            <div className="text-right">
              <div className="text-sm font-bold text-text-main">
                {phase.progress || 0}%
              </div>
              <div className="text-xs text-text-muted">Complete</div>
            </div>
          )}

          {(
            <FontAwesomeIcon
              icon={isExpanded ? faChevronUp : faChevronDown}
              className="text-text-dim"
            />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-border">
              {/* Skills */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-text-muted mb-3 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faLightbulb}
                    className="text-yellow-400"
                  />
                  Skills to Master
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {phase.skills?.map((skill, idx) => (
                    <div key={idx} className="bg-bg-elevated rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-text-main">
                          {skill.skillName}
                        </span>
                        <span className="text-xs text-primary">
                          {skill.currentScore}/{skill.targetScore}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${(skill.currentScore / skill.targetScore) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-text-muted mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBook} className="text-secondary" />
                  Learning Resources
                </h4>
                <div className="space-y-2">
                  {phase.resources?.map((resource, idx) => (
                    <div
                      key={idx}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border
                        ${
                          resource.isCompleted
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-bg-elevated border-border hover:border-primary/50"
                        }
                        transition-colors cursor-pointer
                      `}
                      onClick={() => {
                        if (resource.youtubeUrl) {
                          window.open(resource.youtubeUrl, '_blank');
                        } else if (resource.url) {
                          window.open(resource.url, '_blank');
                        } else {
                          onResourceComplete(phase.phaseId, resource.resourceId);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* YouTube thumbnail */}
                        {resource.thumbnailUrl ? (
                          <img
                            src={resource.thumbnailUrl}
                            alt=""
                            className="w-16 h-10 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`
                            w-8 h-8 rounded flex items-center justify-center text-xs
                            ${resource.isCompleted ? "bg-green-500/20 text-green-400" : "bg-bg-base text-text-muted"}
                          `}
                          >
                            {resource.isCompleted ? (
                              <FontAwesomeIcon icon={faCheckCircle} />
                            ) : resource.videoId ? (
                              <FontAwesomeIcon icon={faPlay} className="text-red-400" />
                            ) : resource.type === "video" ? (
                              <FontAwesomeIcon icon={faPlay} />
                            ) : resource.type === "quiz" ? (
                              <FontAwesomeIcon icon={faGraduationCap} />
                            ) : resource.type === "practice" ? (
                              <FontAwesomeIcon icon={faCode} />
                            ) : (
                              <FontAwesomeIcon icon={faBook} />
                            )}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span
                            className={`text-sm font-medium block truncate ${resource.isCompleted ? "text-green-400 line-through" : "text-text-main"}`}
                          >
                            {resource.title}
                          </span>
                          <div className="text-xs text-text-muted flex items-center gap-2">
                            {resource.provider && (
                              <><span className="text-text-dim">{resource.provider}</span><span>•</span></>
                            )}
                            <span className="capitalize">{resource.type}</span>
                            <span>•</span>
                            <span>{resource.duration} min</span>
                            {resource.qualityScore && (
                              <><span>•</span><span className="text-primary">Score {resource.qualityScore}</span></>
                            )}
                          </div>
                        </div>
                      </div>

                      {resource.youtubeUrl ? (
                        <span className="text-red-400 text-xs flex items-center gap-1 flex-shrink-0">
                          <FontAwesomeIcon icon={faExternalLinkAlt} />
                          Watch
                        </span>
                      ) : !resource.isCompleted ? (
                        <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20 transition-colors">
                          Start
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              {phase.projects && phase.projects.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-text-muted mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCode} className="text-accent" />
                    Projects
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {phase.projects.map((project, idx) => (
                      <div
                        key={idx}
                        className={`
                          p-4 rounded-lg border
                          ${
                            project.isCompleted
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-bg-elevated border-border"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-text-main">
                            {project.title}
                          </span>
                          {project.isCompleted ? (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-green-400"
                            />
                          ) : (
                            <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                              {phase.progress >= 50
                                ? "Ready"
                                : `Unlocks at 50%`}
                            </span>
                          )}
                        </div>
                        {!project.isCompleted && phase.progress >= 50 && (
                          <button className="w-full mt-2 py-2 bg-accent/20 text-accent text-sm rounded hover:bg-accent/30 transition-colors">
                            View Project Guidelines
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Next Actions Component
const NextActionsCard = ({ actions, onAction }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-surface border border-primary/30 rounded-xl p-6 shadow-lg shadow-primary/5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
          <FontAwesomeIcon icon={faBolt} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-main">What to Do Next</h3>
          <p className="text-xs text-text-muted">
            Recommended actions to keep progressing
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg hover:bg-bg-base transition-colors cursor-pointer group"
            onClick={() => onAction(action)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                w-8 h-8 rounded flex items-center justify-center
                ${idx === 0 ? "bg-primary/20 text-primary" : "bg-bg-base text-text-muted"}
              `}
              >
                {idx + 1}
              </div>
              <div>
                <span className="text-sm font-medium text-text-main group-hover:text-primary transition-colors">
                  {action.title}
                </span>
                <div className="text-xs text-text-muted">
                  {action.description}
                </div>
              </div>
            </div>
            <FontAwesomeIcon
              icon={faAngleRight}
              className="text-text-dim group-hover:text-primary transition-colors"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Stats Card
const StatsCard = ({ icon, label, value, trend, color = "primary" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-4"
  >
    <div
      className={`w-12 h-12 rounded-xl bg-${color}/10 text-${color} flex items-center justify-center text-xl`}
    >
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <div className="text-2xl font-bold text-text-main">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
    {trend && <div className="ml-auto text-xs text-green-400">+{trend}</div>}
  </motion.div>
);

// Main Career Journey Page
const CareerJourneyPage = () => {
  const { journey, isLoading, updateProgress, getNextActions } =
    useCareerJourney();
  const navigate = useNavigate();

  // Initialize expandedPhase from journey's current phase
  const initialPhaseId = journey?.currentPhase?.phaseId || null;
  const [expandedPhase, setExpandedPhase] = useState(initialPhaseId);

  // Regenerate roadmap state (must be before early returns — React hooks rule)
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateMsg, setRegenerateMsg] = useState(null);

  // Redirect if no journey
  useEffect(() => {
    if (!isLoading && !journey) {
      // No active journey, redirect to career explorer
      navigate("/career-explorer");
    }
  }, [isLoading, journey, navigate]);

  // Sync expanded phase when journey changes (memoized to avoid state-in-effect)
  const currentPhaseId = journey?.currentPhase?.phaseId;
  useEffect(() => {
    if (currentPhaseId && expandedPhase !== currentPhaseId) {
      setExpandedPhase(currentPhaseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhaseId]);

  if (isLoading) {
    return (
      <main className="min-h-screen pt-28 pb-16 bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-primary mb-4"
          />
          <p className="text-text-muted font-mono">Loading your journey...</p>
        </div>
      </main>
    );
  }

  if (!journey) {
    return null; // Will redirect
  }

  const { career, roadmap, stats, currentPhase, preferences } = journey;
  const nextActions = getNextActions();

  const handleResourceComplete = (phaseId, resourceId) => {
    updateProgress(phaseId, resourceId, { completed: true });
  };

  const handleNextAction = (action) => {
    // Navigate or trigger action
    if (action.type === "resource") {
      // Scroll to phase or navigate to resource
      setExpandedPhase(action.phaseId);
    } else if (action.type === "project") {
      // Navigate to project guide
      // navigate(`/project/${action.projectId}`);
    }
  };

  // ─── Regenerate Roadmap with YouTube ─────────────────────

  const handleRegenerateRoadmap = async () => {
    if (regenerating) return;
    if (!window.confirm('Regenerate your roadmap with real YouTube resources?\nCompleted items will be preserved.')) return;

    setRegenerating(true);
    setRegenerateMsg(null);
    try {
      const res = await journeyAPI.regenerateRoadmap();
      if (res.data?.success) {
        setRegenerateMsg(`✅ ${res.data.message}`);
        // Reload the page after a brief delay to reflect new data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setRegenerateMsg('⚠️ Regeneration failed. Try again.');
      }
    } catch (err) {
      setRegenerateMsg(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  // Calculate time estimates
  const estimatedWeeks = roadmap?.estimatedWeeks || 20;
  const weeksCompleted = Math.round(
    (stats.overallProgress / 100) * estimatedWeeks,
  );

  return (
    <main className="min-h-screen pt-28 pb-16 bg-bg-base relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-30 z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-primary mb-4">
            <FontAwesomeIcon icon={faRocket} />
            <span>CAREER_JOURNEY_ACTIVE</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{career.icon || "🎯"}</span>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-1">
                    {career.title}
                  </h1>
                  <p className="text-text-muted">
                    Your personalized learning roadmap
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">Overall Progress</span>
                  <span className="font-bold text-primary">
                    {stats.overallProgress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.overallProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Current phase info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-text-muted">
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className="text-primary"
                  />
                  <span>
                    Phase {currentPhase.phaseNumber} of{" "}
                    {roadmap.phases?.length || 5}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    className="text-secondary"
                  />
                  <span>
                    ~{estimatedWeeks - weeksCompleted} weeks remaining
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                    stats.onTrackStatus === "ahead"
                      ? "bg-green-500/10 text-green-400"
                      : stats.onTrackStatus === "behind"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {stats.onTrackStatus === "ahead" && "⚡ Ahead of Schedule"}
                  {stats.onTrackStatus === "on_track" && "✓ On Track"}
                  {stats.onTrackStatus === "behind" && "⚠ Behind Schedule"}
                </div>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="flex-shrink-0">
              <ProgressRing
                progress={stats.overallProgress}
                size={140}
                strokeWidth={10}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatsCard
            icon={faTrophy}
            label="Phases Completed"
            value={stats.phasesCompleted}
            color="yellow-400"
          />
          <StatsCard
            icon={faCheckCircle}
            label="Resources Done"
            value={stats.resourcesCompleted}
            color="primary"
          />
          <StatsCard
            icon={faCode}
            label="Projects Built"
            value={stats.projectsCompleted}
            color="accent"
          />
          <StatsCard
            icon={faFire}
            label="Day Streak"
            value={stats.currentStreak}
            color="orange-500"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Roadmap */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-primary" />
                Your Learning Roadmap
              </h2>
              <button
                onClick={handleRegenerateRoadmap}
                disabled={regenerating}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                  regenerating
                    ? 'bg-bg-elevated text-text-dim border-border cursor-wait'
                    : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                }`}
                title="Regenerate with real YouTube videos and web resources"
              >
                <FontAwesomeIcon icon={regenerating ? faSpinner : faSync} spin={regenerating} />
                {regenerating ? 'Regenerating...' : 'Refresh with YouTube'}
              </button>
            </div>
            {regenerateMsg && (
              <div className="text-sm text-text-muted bg-bg-surface border border-border rounded-lg p-3 mb-2">{regenerateMsg}</div>
            )}

            {roadmap.phases?.map((phase) => (
              <PhaseCard
                key={phase.phaseId}
                phase={phase}
                isExpanded={expandedPhase === phase.phaseId}
                onToggle={() =>
                  setExpandedPhase(
                    expandedPhase === phase.phaseId ? null : phase.phaseId,
                  )
                }
                onResourceComplete={handleResourceComplete}
              />
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Actions */}
            <NextActionsCard
              actions={nextActions}
              onAction={handleNextAction}
            />

            {/* Weekly Goals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bg-surface border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="text-secondary"
                />
                Weekly Commitment
              </h3>

              <div className="text-center py-4">
                <div className="text-4xl font-bold text-text-main mb-1">
                  {preferences.weeklyHours}
                </div>
                <div className="text-sm text-text-muted">hours per week</div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-xs text-text-muted mb-2">
                  This week's progress
                </div>
                <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-secondary rounded-full" />
                </div>
                <div className="text-xs text-text-dim mt-1">
                  4/{preferences.weeklyHours} hours
                </div>
              </div>
            </motion.div>

            {/* Journey Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-bg-surface border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-text-main mb-4">
                Journey Details
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Started</span>
                  <span className="text-text-main">
                    {new Date(journey.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Experience Level</span>
                  <span className="text-text-main capitalize">
                    {preferences.experienceLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Learning Style</span>
                  <span className="text-text-main capitalize">
                    {preferences.learningStyle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Phases</span>
                  <span className="text-text-main">
                    {roadmap.phases?.length || 5}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to switch careers? Your current progress will be saved but you will start a new journey.",
                      )
                    ) {
                      navigate("/career-explorer");
                    }
                  }}
                  className="w-full py-2 text-sm text-text-muted hover:text-text-main border border-border rounded hover:border-text-muted transition-colors"
                >
                  Switch Career Goal
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CareerJourneyPage;
