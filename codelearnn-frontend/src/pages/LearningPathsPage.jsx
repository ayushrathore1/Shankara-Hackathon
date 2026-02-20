import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRoute,
  faPlus,
  faArrowRight,
  faSearch,
  faRocket,
  faChartLine,
  faBook,
  faChevronRight,
  faLayerGroup,
  faGraduationCap,
  faClock,
  faCheckCircle,
  faSpinner,
  faLock,
  faPlay,
  faBolt,
  faMap,
} from "@fortawesome/free-solid-svg-icons";
import { useCareerJourney } from "../context/CareerJourneyContext";

// ─── Status badge component ────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    in_progress: "bg-primary/20 text-primary border-primary/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    locked: "bg-text-dim/10 text-text-dim border-border",
  };
  const labels = {
    in_progress: "In Progress",
    completed: "Completed",
    locked: "Locked",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || styles.locked}`}
    >
      {labels[status] || status}
    </span>
  );
};

// ─── Phase mini-card for the active journey ────────────────
const PhaseMiniCard = ({ phase, index }) => {
  const isActive = phase.status === "in_progress";
  const isCompleted = phase.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all
        ${isActive ? "bg-primary/5 border-primary/30" : ""}
        ${isCompleted ? "bg-green-500/5 border-green-500/20" : ""}
        ${!isActive && !isCompleted ? "bg-bg-elevated/50 border-border/50" : ""}
      `}
    >
      {/* Phase number */}
      <div
        className={`
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${isCompleted ? "bg-green-500/20 text-green-400" : ""}
        ${isActive ? "bg-primary/20 text-primary" : ""}
        ${!isActive && !isCompleted ? "bg-bg-elevated text-text-dim" : ""}
      `}
      >
        {isCompleted ? (
          <FontAwesomeIcon icon={faCheckCircle} />
        ) : (
          phase.phaseNumber
        )}
      </div>

      {/* Phase info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-main truncate">
          {phase.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden max-w-[120px]">
            <div
              className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${phase.progress || 0}%` }}
            />
          </div>
          <span className="text-xs text-text-dim">{phase.progress || 0}%</span>
        </div>
      </div>

      {/* Status indicator */}
      {!isActive && !isCompleted && (
        <FontAwesomeIcon icon={faLock} className="text-text-dim/40 text-xs" />
      )}
      {isActive && (
        <FontAwesomeIcon
          icon={faPlay}
          className="text-primary text-xs animate-pulse"
        />
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

const LearningPathsPage = () => {
  const navigate = useNavigate();
  const { journey, isLoading } = useCareerJourney();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllPhases, setShowAllPhases] = useState(false);

  const hasJourney = journey && journey.roadmap?.phases?.length > 0;
  const phases = journey?.roadmap?.phases || [];
  const currentPhase = phases.find((p) => p.status === "in_progress");
  const completedCount = phases.filter(
    (p) => p.status === "completed",
  ).length;
  const careerTitle = journey?.career?.title || "Your Career";
  const overallProgress = journey?.stats?.overallProgress || 0;

  // For the learning plan link
  const careerKeyword = journey?.career?.careerId || journey?.career?.title?.toLowerCase().replace(/\s+/g, "-");

  // Phases to display (collapsed or full)
  const visiblePhases = showAllPhases ? phases : phases.slice(0, 4);

  if (isLoading) {
    return (
      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-3xl text-primary animate-spin"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-main mb-2">
                Learning Paths
              </h1>
              <p className="text-text-muted">
                Your personalized roadmaps to career success
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                />
                <input
                  type="text"
                  placeholder="Search paths, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary w-64"
                />
              </div>
              <Link
                to="/career-explorer"
                className="btn-primary inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                New Journey
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ─── Active Journey Hero ─────────────────────────── */}
        {hasJourney ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <h2 className="text-sm font-mono text-primary uppercase tracking-wider mb-4">
              Active Journey
            </h2>

            <div className="card-bento p-0 overflow-hidden border-primary/20">
              {/* Hero gradient header */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-5 border-b border-border/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faRocket}
                        className="text-xl text-primary"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-main">
                        {careerTitle}
                      </h3>
                      <p className="text-sm text-text-muted mt-0.5">
                        {currentPhase
                          ? `Currently: ${currentPhase.title}`
                          : `${completedCount}/${phases.length} phases completed`}
                      </p>
                    </div>
                  </div>

                  {/* Progress circle */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {overallProgress}%
                      </div>
                      <div className="text-xs text-text-dim">Overall</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {completedCount}
                      </div>
                      <div className="text-xs text-text-dim">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-main">
                        {phases.length}
                      </div>
                      <div className="text-xs text-text-dim">Total Phases</div>
                    </div>
                  </div>
                </div>

                {/* Overall progress bar */}
                <div className="mt-4">
                  <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${overallProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Phase list */}
              <div className="p-5">
                <div className="space-y-2">
                  {visiblePhases.map((phase, idx) => (
                    <PhaseMiniCard key={phase.phaseId} phase={phase} index={idx} />
                  ))}
                </div>

                {phases.length > 4 && (
                  <button
                    onClick={() => setShowAllPhases(!showAllPhases)}
                    className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    {showAllPhases
                      ? "Show less"
                      : `Show all ${phases.length} phases`}
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className={`text-xs transition-transform ${showAllPhases ? "rotate-90" : ""}`}
                    />
                  </button>
                )}

                {/* Action buttons */}
                <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap gap-3">
                  <Link
                    to="/my-career-journey"
                    className="btn-primary inline-flex items-center gap-2 text-sm"
                  >
                    <FontAwesomeIcon icon={faMap} />
                    Full Roadmap View
                    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </Link>

                  {careerKeyword && (
                    <Link
                      to={`/career/learning-plan/${careerKeyword}`}
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-bg-elevated border border-border text-text-main hover:border-primary/50 hover:text-primary transition-all"
                    >
                      <FontAwesomeIcon icon={faBook} />
                      View Detailed AI Plan
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
          /* ─── No Journey — Onboarding CTA ──────────────── */
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <h2 className="text-sm font-mono text-primary uppercase tracking-wider mb-4">
              Get Started
            </h2>

            <div className="card-bento border-dashed border-2 border-border p-0 overflow-hidden">
              <div className="bg-gradient-to-br from-primary/5 via-transparent to-transparent p-10 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faRoute}
                    className="text-3xl text-primary"
                  />
                </div>
                <h3 className="text-2xl font-bold text-text-main mb-3">
                  Start Your Learning Journey
                </h3>
                <p className="text-text-muted max-w-lg mx-auto mb-8 leading-relaxed">
                  Choose a career path and get a personalized AI-generated
                  roadmap with curated YouTube tutorials, hands-on projects,
                  and milestone tracking.
                </p>
                <Link
                  to="/career-explorer"
                  className="btn-primary inline-flex items-center gap-2 text-base px-6 py-3"
                >
                  <FontAwesomeIcon icon={faRocket} />
                  Explore Careers
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-sm"
                  />
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* ─── Quick Actions Grid ─────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
            Quick Actions
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Career Explorer */}
            <Link
              to="/career-explorer"
              className="card-bento p-5 group hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <FontAwesomeIcon
                    icon={faRocket}
                    className="text-primary"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-1">
                    Career Explorer
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Browse careers and start a new AI-powered learning journey
                  </p>
                </div>
              </div>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="absolute top-5 right-5 text-text-dim/0 group-hover:text-text-dim transition-all"
              />
            </Link>

            {/* AI Learning Plan */}
            <div
              onClick={() => {
                if (careerKeyword) {
                  navigate(`/career/learning-plan/${careerKeyword}`);
                } else {
                  navigate("/career-explorer");
                }
              }}
              className="card-bento p-5 group hover:border-amber-400/30 transition-all cursor-pointer relative"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 group-hover:bg-amber-400/20 transition-colors">
                  <FontAwesomeIcon
                    icon={faBolt}
                    className="text-amber-400"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-1">
                    AI Learning Plan
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {hasJourney
                      ? `View detailed plan for ${careerTitle}`
                      : "Generate an AI-powered learning plan for any topic"}
                  </p>
                </div>
              </div>
            </div>

            {/* YouTube Analyzer */}
            <Link
              to="/analyzer"
              className="card-bento p-5 group hover:border-red-400/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                  <FontAwesomeIcon
                    icon={faGraduationCap}
                    className="text-red-400"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-1">
                    YouTube Analyzer
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Analyze any YouTube video to extract learning insights
                  </p>
                </div>
              </div>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="absolute top-5 right-5 text-text-dim/0 group-hover:text-text-dim transition-all"
              />
            </Link>
          </div>
        </motion.section>

        {/* ─── Stats / Info (shown only when journey exists) ─ */}
        <AnimatePresence>
          {hasJourney && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
                Journey Stats
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-bento p-4 text-center">
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className="text-primary mb-2 text-lg"
                  />
                  <div className="text-2xl font-bold text-text-main">
                    {journey?.stats?.resourcesCompleted || 0}
                  </div>
                  <div className="text-xs text-text-dim mt-1">
                    Resources Done
                  </div>
                </div>

                <div className="card-bento p-4 text-center">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-green-400 mb-2 text-lg"
                  />
                  <div className="text-2xl font-bold text-text-main">
                    {journey?.stats?.projectsCompleted || 0}
                  </div>
                  <div className="text-xs text-text-dim mt-1">
                    Projects Done
                  </div>
                </div>

                <div className="card-bento p-4 text-center">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="text-amber-400 mb-2 text-lg"
                  />
                  <div className="text-2xl font-bold text-text-main">
                    {Math.round(
                      (journey?.stats?.totalLearningMinutes || 0) / 60,
                    )}h
                  </div>
                  <div className="text-xs text-text-dim mt-1">
                    Learning Time
                  </div>
                </div>

                <div className="card-bento p-4 text-center">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-cyan-400 mb-2 text-lg"
                  />
                  <div className="text-2xl font-bold text-text-main">
                    {journey?.stats?.currentStreak || 0}
                  </div>
                  <div className="text-xs text-text-dim mt-1">Day Streak</div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default LearningPathsPage;
