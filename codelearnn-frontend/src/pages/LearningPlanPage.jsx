import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSpinner,
  faCheckCircle,
  faRocket,
  faBook,
  faCode,
  faDumbbell,
  faEye,
  faLaptopCode,
  faClock,
  faChevronDown,
  faChevronUp,
  faExternalLinkAlt,
  faBriefcase,
  faDollarSign,
  faUsers,
  faFire,
  faStar,
  faHashtag,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import {
  faReddit,
  faDiscord,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

import { careerAPI } from "../services/api";
import AIThinkingIndicator from "../components/AIThinkingIndicator";

// ─── Step type icons ───────────────────────────────────────
const STEP_ICONS = {
  learn: faBook,
  build: faCode,
  practice: faDumbbell,
  read: faEye,
  explore: faGlobe,
};

const STEP_COLORS = {
  learn: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  build: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  practice: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  read: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  explore: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
};

const DIFFICULTY_COLORS = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/30",
  intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  advanced: "bg-red-500/10 text-red-400 border-red-500/30",
};

// ─── Components ────────────────────────────────────────────

const PhaseCard = ({ phase, isExpanded, onToggle, phaseIndex }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: phaseIndex * 0.1 }}
      className="relative"
    >
      {/* Vertical timeline connector */}
      {phaseIndex > 0 && (
        <div className="absolute -top-6 left-6 w-0.5 h-6 bg-gradient-to-b from-primary/30 to-primary/60" />
      )}

      {/* Phase header */}
      <button
        onClick={onToggle}
        className={`w-full text-left rounded-xl border transition-all duration-300 group ${
          isExpanded
            ? "bg-bg-elevated border-primary/50 shadow-[0_0_30px_rgba(16,185,129,0.08)]"
            : "bg-bg-surface border-border hover:border-primary/30 hover:bg-bg-elevated"
        }`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Phase number circle */}
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg font-mono
                ${isExpanded ? "bg-primary text-bg-base shadow-lg shadow-primary/30" : "bg-primary/10 text-primary border border-primary/30"}`}
              >
                {phase.phase}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">
                  {phase.title}
                </h3>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-xs font-mono text-text-muted flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faClock} className="text-primary/60" />
                    {phase.duration}
                  </span>
                  <span className="text-xs font-mono text-text-dim">
                    {phase.steps?.length || 0} steps
                  </span>
                  <span className="text-xs font-mono text-text-dim">
                    {phase.projects?.length || 0} projects
                  </span>
                </div>
              </div>
            </div>

            <FontAwesomeIcon
              icon={isExpanded ? faChevronUp : faChevronDown}
              className={`text-sm mt-2 transition-colors ${isExpanded ? "text-primary" : "text-text-dim"}`}
            />
          </div>

          {/* Skills tags — always visible */}
          {phase.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 ml-16">
              {phase.skills.slice(0, 6).map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-secondary/10 text-secondary border border-secondary/20"
                >
                  {skill}
                </span>
              ))}
              {phase.skills.length > 6 && (
                <span className="text-[10px] text-text-dim font-mono">
                  +{phase.skills.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 ml-4 border-l-2 border-primary/20">
              {/* Objectives */}
              {phase.objectives?.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-mono text-text-dim uppercase tracking-wider mb-2">
                    Objectives
                  </h4>
                  <ul className="space-y-1.5">
                    {phase.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-primary/50 mt-0.5 text-xs" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              {phase.steps?.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">
                    Steps
                  </h4>
                  <div className="space-y-3">
                    {phase.steps.map((step, i) => (
                      <div
                        key={i}
                        className="p-3 bg-bg-base rounded-lg border border-border hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-lg border text-xs ${STEP_COLORS[step.type] || STEP_COLORS.learn}`}
                          >
                            <FontAwesomeIcon icon={STEP_ICONS[step.type] || faBook} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-medium text-text-main">
                                {step.title}
                              </h5>
                              <span className="text-[10px] font-mono text-text-dim whitespace-nowrap ml-2">
                                ~{step.estimatedHours}h
                              </span>
                            </div>
                            {step.description && (
                              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                {step.description}
                              </p>
                            )}
                            {step.resources?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {step.resources.map((res, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono rounded bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
                                  >
                                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[8px]" />
                                    {res.name}
                                    {res.isFree && (
                                      <span className="text-green-400 ml-0.5">FREE</span>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {phase.projects?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">
                    Build Projects
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {phase.projects.map((project, i) => (
                      <div
                        key={i}
                        className="p-4 bg-bg-base rounded-lg border border-border hover:border-accent/30 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-sm font-bold text-text-main group-hover:text-accent transition-colors">
                            <FontAwesomeIcon icon={faLaptopCode} className="text-accent/60 mr-2" />
                            {project.name}
                          </h5>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded border font-mono ${DIFFICULTY_COLORS[project.difficulty] || DIFFICULTY_COLORS.beginner}`}
                          >
                            {project.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mb-2 leading-relaxed">
                          {project.description}
                        </p>
                        {project.inspiration && (
                          <div className="text-[10px] text-accent/70 font-mono flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faFire} />
                            {project.inspiration}
                          </div>
                        )}
                        {project.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {project.skills.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.5 text-[10px] bg-bg-elevated text-text-dim rounded font-mono"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                          <span className="text-[10px] text-text-dim font-mono">
                            ~{project.estimatedHours}h
                          </span>
                          {project.referenceUrl && (
                            <a
                              href={project.referenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline font-mono flex items-center gap-1"
                            >
                              Reference <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {phase.milestones?.length > 0 && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="text-xs font-mono text-primary mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faStar} />
                    MILESTONES
                  </h4>
                  <ul className="space-y-1">
                    {phase.milestones.map((m, i) => (
                      <li key={i} className="text-xs text-text-muted flex items-center gap-2">
                        <span className="text-primary">✓</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Community Section ─────────────────────────────────────
const CommunitySection = ({ community }) => {
  if (!community) return null;

  const sections = [
    {
      title: "Subreddits",
      icon: faReddit,
      color: "text-orange-400",
      items: community.subreddits,
      keyField: "name",
      linkField: "url",
    },
    {
      title: "Discord Servers",
      icon: faDiscord,
      color: "text-indigo-400",
      items: community.discord,
      keyField: "name",
      linkField: "url",
    },
    {
      title: "X / Twitter",
      icon: faXTwitter,
      color: "text-text-main",
      items: community.twitterAccounts,
      keyField: "handle",
    },
    {
      title: "YouTube Channels",
      icon: faYoutube,
      color: "text-red-500",
      items: community.youtubeChannels,
      keyField: "name",
      linkField: "url",
    },
  ];

  return (
    <div className="bg-bg-surface rounded-xl border border-border p-6">
      <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faUsers} className="text-primary" />
        Community & Resources
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(
          (section) =>
            section.items?.length > 0 && (
              <div key={section.title} className="space-y-2">
                <h4 className="text-xs font-mono text-text-dim uppercase tracking-wider flex items-center gap-2">
                  <FontAwesomeIcon icon={section.icon} className={section.color} />
                  {section.title}
                </h4>
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-2 bg-bg-base rounded border border-border hover:border-primary/30 transition-all"
                  >
                    {section.linkField && item[section.linkField] ? (
                      <a
                        href={item[section.linkField]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {item[section.keyField]}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-text-main">
                        {item[section.keyField]}
                      </span>
                    )}
                    {item.description && (
                      <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ),
        )}
      </div>
    </div>
  );
};

// ─── Trending Section ──────────────────────────────────────
const TrendingSection = ({ trendingNow }) => {
  if (!trendingNow?.length) return null;

  return (
    <div className="bg-bg-surface rounded-xl border border-border p-6">
      <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faFire} className="text-orange-400" />
        Trending Right Now
      </h3>
      <div className="space-y-3">
        {trendingNow.map((item, i) => (
          <div key={i} className="p-3 bg-bg-base rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon icon={faHashtag} className="text-orange-400 text-xs" />
              <span className="text-sm font-bold text-text-main">{item.topic}</span>
            </div>
            {item.reason && <p className="text-xs text-text-muted ml-5">{item.reason}</p>}
            {item.relevance && (
              <p className="text-xs text-primary/70 ml-5 mt-0.5 font-mono">{item.relevance}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Job Market Snapshot ───────────────────────────────────
const JobMarketCard = ({ snapshot }) => {
  if (!snapshot) return null;

  const formatSalary = (val) => {
    if (!val) return "N/A";
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="bg-bg-surface rounded-xl border border-border p-6">
      <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faBriefcase} className="text-secondary" />
        Job Market Snapshot
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="p-3 bg-bg-base rounded-lg border border-border text-center">
          <div className="text-xl font-bold text-primary font-mono">
            {snapshot.totalJobs?.toLocaleString() || "N/A"}
          </div>
          <div className="text-[10px] text-text-dim font-mono uppercase">Active Jobs</div>
        </div>
        <div className="p-3 bg-bg-base rounded-lg border border-border text-center">
          <div className="text-xl font-bold text-secondary font-mono">
            {snapshot.topCompanies?.length || 0}+
          </div>
          <div className="text-[10px] text-text-dim font-mono uppercase">Top Companies</div>
        </div>
        <div className="p-3 bg-bg-base rounded-lg border border-border text-center col-span-2">
          <div className="text-xl font-bold text-accent font-mono flex items-center justify-center gap-1">
            <FontAwesomeIcon icon={faDollarSign} className="text-sm" />
            {formatSalary(snapshot.salaryRange?.min)} — {formatSalary(snapshot.salaryRange?.max)}
          </div>
          <div className="text-[10px] text-text-dim font-mono uppercase">Salary Range</div>
        </div>
      </div>

      {/* Top skills */}
      {snapshot.topSkills?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-mono text-text-dim mb-2">MOST IN-DEMAND SKILLS</h4>
          <div className="flex flex-wrap gap-2">
            {snapshot.topSkills.map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top companies */}
      {snapshot.topCompanies?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-mono text-text-dim mb-2">TOP HIRING COMPANIES</h4>
          <div className="flex flex-wrap gap-2">
            {snapshot.topCompanies.map((company, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-xs rounded-lg bg-secondary/10 text-secondary border border-secondary/20"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sample listings */}
      {snapshot.sampleListings?.length > 0 && (
        <div>
          <h4 className="text-xs font-mono text-text-dim mb-2">SAMPLE JOB LISTINGS</h4>
          <div className="space-y-2">
            {snapshot.sampleListings.slice(0, 4).map((job, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-bg-base rounded border border-border"
              >
                <div>
                  <span className="text-sm text-text-main font-medium">{job.title}</span>
                  <span className="text-xs text-text-muted ml-2">
                    at {job.company} · {job.location}
                  </span>
                </div>
                {job.salary && (
                  <span className="text-xs font-mono text-primary whitespace-nowrap">
                    {job.salary}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

const LearningPlanPage = () => {
  const { keyword } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(0); // expand first phase by default
  const [fromDB, setFromDB] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!keyword) return;
    setLoading(true);
    setError(null);

    try {
      const response = await careerAPI.getLearningPlan(keyword);
      if (response.data.success) {
        setPlan(response.data.data);
        setFromDB(response.data.fromDatabase || false);
      } else {
        setError(response.data.message || "Failed to generate plan");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to generate learning plan. Please try again.",
      );
      console.error("Learning plan error:", err);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return (
    <main className="min-h-screen pt-28 pb-16 bg-bg-base relative overflow-hidden text-text-main">
      <div className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-40 z-0" />

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate("/career")}
            className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors font-mono text-xs"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>BACK_TO_CAREER</span>
          </button>
        </motion.div>

        {/* Loading state */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-32"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FontAwesomeIcon icon={faRocket} className="text-primary text-2xl" />
                </div>
              </div>

              <div className="font-mono text-primary mb-4 text-lg">
                Generating AI Learning Plan
              </div>

              <AIThinkingIndicator
                messages={[
                  "Searching web data",
                  "Analyzing Reddit trends",
                  "Scanning X posts",
                  "Fetching job listings",
                  "Ranking skills",
                  "Building roadmap",
                  "Curating resources",
                  "Mapping career path",
                  "Personalizing plan",
                  "Almost there",
                ]}
                interval={2500}
              />

              <p className="text-[10px] text-text-dim font-mono mt-6">
                This may take 15-30 seconds on first generation
              </p>
            </motion.div>
          )}

          {/* Error state */}
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-red-400 text-lg font-mono mb-4">ERROR</div>
              <p className="text-text-muted mb-6">{error}</p>
              <button
                onClick={fetchPlan}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-bg-base font-bold rounded-lg transition-all"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* Plan Content */}
          {!loading && !error && plan && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Hero Header */}
              <div className="bg-bg-surface rounded-2xl border border-border p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -ml-16 -mb-16" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-mono rounded-md border border-primary/20">
                      AI-GENERATED
                    </span>
                    {fromDB && (
                      <span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] font-mono rounded border border-secondary/20">
                        CACHED
                      </span>
                    )}
                    {plan.generatedBy?.webContextUsed && (
                      <span className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-mono rounded border border-accent/20">
                        REAL-TIME DATA
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-3 leading-tight">
                    {plan.title || `Learning Plan: ${keyword}`}
                  </h1>

                  <p className="text-text-muted text-lg max-w-3xl leading-relaxed mb-4">
                    {plan.description}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-text-muted font-mono">
                      <FontAwesomeIcon icon={faClock} className="text-primary" />
                      <span>{plan.estimatedDuration || "6-8 months"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted font-mono">
                      <FontAwesomeIcon icon={faRocket} className="text-secondary" />
                      <span>{plan.phases?.length || 0} phases</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted font-mono">
                      <FontAwesomeIcon icon={faCode} className="text-accent" />
                      <span>
                        {plan.phases?.reduce((acc, p) => acc + (p.projects?.length || 0), 0) || 0} projects
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Market Snapshot */}
              <JobMarketCard snapshot={plan.jobMarketSnapshot} />

              {/* Trending Now */}
              <TrendingSection trendingNow={plan.trendingNow} />

              {/* Learning Phases */}
              <div>
                <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FontAwesomeIcon icon={faRocket} />
                  </div>
                  Learning Roadmap
                </h2>

                <div className="space-y-4">
                  {plan.phases?.map((phase, idx) => (
                    <PhaseCard
                      key={phase.phase || idx}
                      phase={phase}
                      phaseIndex={idx}
                      isExpanded={expandedPhase === idx}
                      onToggle={() =>
                        setExpandedPhase(expandedPhase === idx ? -1 : idx)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Community */}
              <CommunitySection community={plan.community} />

              {/* Footer CTA */}
              <div className="text-center py-8">
                <Link
                  to="/career"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-bg-base font-bold rounded-lg transition-all shadow-lg shadow-primary/20"
                >
                  <FontAwesomeIcon icon={faRocket} />
                  Explore More Careers
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
};

export default LearningPlanPage;
