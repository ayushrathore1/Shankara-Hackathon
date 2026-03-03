import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faArrowRight,
  faBriefcase,
  faRoute,
  faChartLine,
  faSpinner,
  faBookmark,
  faLightbulb,
  faCheckCircle,
  faClock,
  faPlus,
  faFire,
  faBolt,
  faTrophy,
  faGraduationCap,
  faRocket,
  faStar,
  faBook,
  faCode,
  faLayerGroup,
  faCompass,
  faExclamationTriangle,
  faMicrochip,
  faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube as faYoutubeBrand } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useCareerJourney } from "../context/CareerJourneyContext";
import {
  journeyAPI,
  eventsAPI,
  recommendationsAPI,
  careerAPI,
  youtubeTrackerAPI,
  gamificationAPI,
} from "../services/api";
import AIThinkingIndicator from "../components/AIThinkingIndicator";
import SetPasswordModal from "../components/modals/SetPasswordModal";

/**
 * DashboardPage — Daily Control Surface
 *
 * KEY RULE: Never show an empty dashboard. New users get:
 * - Trending courses from ML recommendations
 * - Popular career paths to explore
 * - Onboarding CTAs
 * - Platform stats to show richness
 *
 * Authenticated users with active journeys get:
 * - Live journey progress ring
 * - Current phase & next actions
 * - Activity streak & heatmap minibar
 * - Personalized ML recommendations
 * - Recent activity feed
 */

const DashboardPage = () => {
  const { user, isAuthenticated, needsPassword } = useAuth();
  const { journey } = useCareerJourney();
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Data states
  const [journeyOverview, setJourneyOverview] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [learningStats, setLearningStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [trendingCareers, setTrendingCareers] = useState([]);
  const [learningPlan, setLearningPlan] = useState(null);

  // YouTube Activity state
  const [ytStats, setYtStats] = useState(null);
  const [ytRecentVideos, setYtRecentVideos] = useState([]);
  const [ytNowWatching, setYtNowWatching] = useState(null);
  const [ytSseConnected, setYtSseConnected] = useState(false);
  const sseRef = useRef(null);

  // Gamification state
  const [gamProfile, setGamProfile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [isAuthenticated]);

  // Show password setup modal for users without a password (once per session)
  useEffect(() => {
    if (needsPassword && !sessionStorage.getItem('passwordPromptDismissed')) {
      setShowPasswordModal(true);
    }
  }, [needsPassword]);

  // SSE connection for real-time YouTube activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const connect = () => {
      const es = youtubeTrackerAPI.subscribeLive();
      if (!es) return;
      sseRef.current = es;

      es.onopen = () => setYtSseConnected(true);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT') {
            setYtStats(data.stats);
            setYtRecentVideos(data.recentVideos || []);
          } else if (data.type === 'VIDEO_UPDATE') {
            setYtStats(data.stats);
            // Update recent videos — prepend new ones
            if (data.videos?.length > 0) {
              setYtNowWatching(data.videos[0]);
              setYtRecentVideos(prev => {
                const updated = [...data.videos, ...prev];
                // De-dup by videoId, keep first (newest)
                const seen = new Set();
                return updated.filter(v => {
                  if (seen.has(v.videoId)) return false;
                  seen.add(v.videoId);
                  return true;
                }).slice(0, 10);
              });
              // Clear "now watching" after 30s
              setTimeout(() => setYtNowWatching(null), 30000);
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setYtSseConnected(false);
        es.close();
        // Reconnect after 5s
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const promises = [];

      if (isAuthenticated) {
        // Authenticated user — fetch personalized data
        promises.push(
          journeyAPI
            .getOverview()
            .then((r) => setJourneyOverview(r.data?.data || null))
            .catch(() => setJourneyOverview(null)),
          eventsAPI
            .getRecent(5)
            .then((r) => setRecentActivity(r.data?.data || []))
            .catch(() => setRecentActivity([])),
          eventsAPI
            .getLearningStats()
            .then((r) => setLearningStats(r.data?.data || null))
            .catch(() => setLearningStats(null)),
          recommendationsAPI
            .get(5)
            .then((r) => setRecommendations(r.data?.data || []))
            .catch(() => setRecommendations([])),
          eventsAPI
            .getHeatmap(7)
            .then((r) => setHeatmapData(r.data?.data || []))
            .catch(() => setHeatmapData([])),
          // YouTube tracker — fetch initial stats & recent videos so the section
          // doesn't rely solely on the SSE stream
          youtubeTrackerAPI
            .getProgress()
            .then((r) => {
              if (r.data?.data?.stats) setYtStats(r.data.data.stats);
            })
            .catch(() => {}),
          youtubeTrackerAPI
            .getAutoTracked(1, 10)
            .then((r) => {
              const videos = r.data?.data?.videos || [];
              if (videos.length > 0) setYtRecentVideos(videos);
            })
            .catch(() => {}),
          // Gamification profile + heartbeat
          gamificationAPI
            .heartbeat()
            .catch(() => {}),
          gamificationAPI
            .getProfile()
            .then((r) => setGamProfile(r.data?.data || null))
            .catch(() => setGamProfile(null))
        );

        // Fetch learning plan if user has an active career
        const careerKeyword = journey?.career?.name || journey?.career?.title || user?.careerGoal?.name;
        if (careerKeyword) {
          promises.push(
            careerAPI
              .getLearningPlan(careerKeyword)
              .then((r) => setLearningPlan(r.data?.data || null))
              .catch(() => setLearningPlan(null))
          );
        }
      } else {
        // Anonymous / new user — show trending
        promises.push(
          recommendationsAPI
            .getTrending(5)
            .then((r) => setRecommendations(r.data?.data || []))
            .catch(() => setRecommendations([]))
        );
      }

      // Always fetch trending careers
      promises.push(
        careerAPI
          .getTrending()
          .then((r) => setTrendingCareers((r.data?.data || []).slice(0, 4)))
          .catch(() => setTrendingCareers([]))
      );

      await Promise.all(promises);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  // ──────────── Sub Components ────────────

  const SectionHeader = ({ icon, title, link, linkText, badge }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center border border-border">
          <FontAwesomeIcon icon={icon} className="text-primary text-sm" />
        </span>
        <span className="text-sm font-mono text-text-muted uppercase tracking-wider">
          {title}
        </span>
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary uppercase">
            {badge}
          </span>
        )}
      </h2>
      {link && (
        <Link
          to={link}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {linkText}
          <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
        </Link>
      )}
    </div>
  );

  // Activity type → icon/color mapping
  const activityStyle = (type) => {
    const map = {
      resource_started: { icon: faPlay, bg: "bg-blue-500/10", text: "text-blue-400" },
      resource_completed: { icon: faCheckCircle, bg: "bg-green-500/10", text: "text-green-400" },
      path_enrolled: { icon: faRoute, bg: "bg-purple-500/10", text: "text-purple-400" },
      skill_updated: { icon: faChartLine, bg: "bg-yellow-500/10", text: "text-yellow-400" },
      quiz_completed: { icon: faTrophy, bg: "bg-orange-500/10", text: "text-orange-400" },
      daily_login: { icon: faFire, bg: "bg-red-500/10", text: "text-red-400" },
      xp_earned: { icon: faBolt, bg: "bg-primary/10", text: "text-primary" },
    };
    return map[type] || { icon: faCheckCircle, bg: "bg-bg-elevated", text: "text-text-dim" };
  };

  // ──────────── Circular Progress Ring ────────────

  const ProgressRing = ({ progress, size = 100, stroke = 8 }) => {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const dashOffset = circ - (progress / 100) * circ;

    return (
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ}
          strokeLinecap="round"
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-secondary)" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // ──────────── Mini Heatmap (last 7 days) ────────────

  const MiniHeatmap = ({ data }) => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const match = data.find((h) => h._id === key);
      days.push({ date: key, count: match?.count || 0, day: d.toLocaleDateString("en", { weekday: "short" }).charAt(0) });
    }
    const maxCount = Math.max(...days.map((d) => d.count), 1);

    return (
      <div className="flex items-end gap-1">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-5 rounded-sm transition-all"
              style={{
                height: `${Math.max(4, (d.count / maxCount) * 28)}px`,
                backgroundColor:
                  d.count === 0
                    ? "var(--color-border)"
                    : `color-mix(in srgb, var(--color-primary) ${Math.max(30, (d.count / maxCount) * 100)}%, transparent)`,
              }}
            />
            <span className="text-[9px] text-text-dim font-mono">{d.day}</span>
          </div>
        ))}
      </div>
    );
  };

  // ──────────── Loading State ────────────

  if (loading) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
        <div className="container mx-auto max-w-5xl flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AIThinkingIndicator
            messages={[
              "Loading dashboard",
              "Fetching progress",
              "Getting recommendations",
              "Syncing data",
            ]}
            interval={1800}
          />
        </div>
      </main>
    );
  }

  // ──────────── Compute derived values ────────────

  const hasJourney = !!journeyOverview || !!journey;

  // Journey progress %
  const journeyProgress = journeyOverview
    ? Math.round(
        ((journeyOverview.stats?.phasesCompleted || 0) /
          Math.max(journeyOverview.totalPhases || 1, 1)) *
          100
      )
    : journey
      ? Math.round(
          (journey.roadmap?.phases?.filter((p) => p.progress === 100).length /
            Math.max(journey.roadmap?.phases?.length || 1, 1)) *
            100
        )
      : 0;

  const currentPhase = journeyOverview?.currentPhase ||
    (journey?.roadmap?.phases?.find((p) => p.progress < 100)) ||
    null;

  const nextActions = journeyOverview?.nextActions || [];

  const streak = gamProfile?.streak?.current || learningStats?.currentStreak || 0;
  const totalXP = gamProfile?.totalXP || learningStats?.totalXP || 0;
  const completedResources = learningStats?.completedResources || 0;
  const careerRank = gamProfile?.rank || null;

  const careerName =
    journeyOverview?.career?.name ||
    journey?.career?.name ||
    user?.careerGoal?.name ||
    null;

  // ── Motivational message by progress ──
  const getMotivationalMessage = (pct) => {
    if (pct === 0) return "Day 1. Every expert was here once.";
    if (pct <= 20) return "You're moving. Most people never start.";
    if (pct <= 50) return "You're in the top 30% of developers who started this week.";
    if (pct <= 80) return "You're closer than you think.";
    return "You're almost there. Don't stop now.";
  };

  const rankTitle = careerRank?.title || 'Intern';
  const nextRankTitle = careerRank?.nextRank?.title || 'Junior Developer';
  const xpToNext = careerRank?.nextRank?.xpNeeded || 495;

  // ──────────── Render ────────────

  return (
    <>
      {showPasswordModal && (
        <SetPasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      <main className="min-h-screen pt-28 pb-16 px-6 relative overflow-hidden" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Ambient cyan glow — top right */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.03) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 bg-tech-dashboard pointer-events-none z-0" />

      <div className="container mx-auto max-w-6xl flex gap-6">
        {/* ═══ MAIN COLUMN ═══ */}
        <div className="flex-1 min-w-0">

        {/* ─── Welcome Header ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: '"Fraunces", serif', color: '#fff' }}>
            Welcome back,{" "}
            <span style={{ color: '#39FF14' }}>
              {user?.name || "Developer"}
            </span>
          </h1>
          <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {hasJourney
              ? getMotivationalMessage(journeyProgress)
              : isAuthenticated
                ? "Day 1. Every expert was here once."
                : "Explore what's trending on Medha"}
          </p>
          <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {rankTitle} · {totalXP} XP · {xpToNext} XP to {nextRankTitle}
          </p>
        </motion.div>

        {/* ─── Stat Cards — 2×2 Hierarchical Grid ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {/* XP + Rank — Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-5 relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: '2px solid #39FF14',
              background: 'linear-gradient(135deg, rgba(57,255,20,0.04) 0%, rgba(255,255,255,0.02) 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Career Rank</p>
                <p className="text-2xl font-bold text-white">{rankTitle}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(57,255,20,0.1)' }}>
                <FontAwesomeIcon icon={faBolt} style={{ color: '#39FF14' }} />
              </div>
            </div>
            {/* Progress to next rank */}
            <div className="mb-1.5">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${careerRank?.progress || 1}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#39FF14' }}
                />
              </div>
            </div>
            <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {xpToNext} XP to {nextRankTitle} →
            </p>
          </motion.div>

          {/* Day Streak — Amber */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl p-5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: '2px solid #F5A623',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Day Streak</p>
                <p className="text-2xl font-bold text-white">{streak || 0}</p>
              </div>
              <span className="text-3xl">🔥</span>
            </div>
            <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {streak > 0 && gamProfile?.streak?.longest
                ? `Longest: ${gamProfile.streak.longest}d 🔥 — beat it today.`
                : streak > 0
                  ? 'Keep it going!'
                  : 'Start learning to build your streak'}
            </p>
          </motion.div>

          {/* Career Goal — Cyan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: '2px solid #00D4FF',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Career Goal</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0,212,255,0.1)' }}>
                <FontAwesomeIcon icon={faGraduationCap} style={{ color: '#00D4FF' }} className="text-sm" />
              </div>
            </div>
            {careerName ? (
              <p className="text-sm font-semibold text-white truncate">{careerName}</p>
            ) : (
              <Link to="/career" className="text-sm font-medium flex items-center gap-1" style={{ color: '#00D4FF' }}>
                Set your career goal →
              </Link>
            )}
          </motion.div>

          {/* Completed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl p-5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: '2px solid #22C55E',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Completed</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#22C55E' }} className="text-sm" />
              </div>
            </div>
            {completedResources > 0 ? (
              <p className="text-xl font-bold text-white">{completedResources}</p>
            ) : (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                0 checkpoints ·{' '}
                <Link to="/learning-paths" style={{ color: '#00D4FF' }}>Your first one is 12 min away →</Link>
              </p>
            )}
          </motion.div>
        </motion.div>

        {/* ─── Rank & Achievements Card ─── */}
        {careerRank && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.08 }}
            className="mb-8"
          >
            <div className="card-bento p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{careerRank.icon || '🌱'}</span>
                  <div>
                    <div className="text-text-main font-bold">{careerRank.title || 'Intern'}</div>
                    <div className="text-[11px] text-text-dim">Career Rank</div>
                  </div>
                </div>
                {careerRank.nextRank && (
                  <div className="text-right">
                    <div className="text-xs text-text-dim">Next: {careerRank.nextRank.icon} {careerRank.nextRank.title}</div>
                    <div className="text-[10px] text-primary font-mono">{careerRank.nextRank.xpNeeded?.toLocaleString()} XP needed</div>
                  </div>
                )}
              </div>
              {careerRank.nextRank && (
                <div className="h-2 bg-bg-base rounded-full overflow-hidden border border-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${careerRank.progress || 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  />
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <Link
                  to="/achievements"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faTrophy} className="text-[10px]" />
                  View All Achievements
                  <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                </Link>
                {gamProfile?.streak?.longest > 0 && (
                  <span className="text-[10px] text-text-dim">
                    Longest streak: {gamProfile.streak.longest}d 🔥
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}


        {/* ─── Learning Plan Preview ─── */}
        {learningPlan && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <SectionHeader
              icon={faRoute}
              title="Your Learning Plan"
              link={`/career/learning-plan/${encodeURIComponent(careerName || learningPlan.keyword || '')}`}
              linkText="View Full Plan"
              badge="AI-GENERATED"
            />

            <Link
              to={`/career/learning-plan/${encodeURIComponent(careerName || learningPlan.keyword || '')}`}
              className="block card-bento p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-all group"
            >
              {/* Title & Description */}
              <h3 className="text-xl font-bold text-text-main mb-2 group-hover:text-primary transition-colors">
                {learningPlan.title || `Learning Plan: ${careerName}`}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-2">
                {learningPlan.description}
              </p>

              {/* Meta stats */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                  <FontAwesomeIcon icon={faClock} className="text-primary" />
                  {learningPlan.estimatedDuration || "6-8 months"}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                  <FontAwesomeIcon icon={faRocket} className="text-secondary" />
                  {learningPlan.phases?.length || 0} phases
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                  <FontAwesomeIcon icon={faCode} className="text-accent" />
                  {learningPlan.phases?.reduce((acc, p) => acc + (p.projects?.length || 0), 0) || 0} projects
                </div>
              </div>

              {/* In-demand skills */}
              {learningPlan.jobMarketSnapshot?.inDemandSkills?.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-dim font-mono uppercase mb-2">Most In-Demand Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {learningPlan.jobMarketSnapshot.inDemandSkills.slice(0, 5).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Salary hint */}
              {learningPlan.jobMarketSnapshot?.salaryRange && (
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-3 text-xs text-text-dim">
                  <FontAwesomeIcon icon={faBriefcase} className="text-text-dim" />
                  <span>Salary range: <span className="text-text-muted font-medium">{
                    typeof learningPlan.jobMarketSnapshot.salaryRange === 'string'
                      ? learningPlan.jobMarketSnapshot.salaryRange
                      : `${learningPlan.jobMarketSnapshot.salaryRange.currency || '₹'}${learningPlan.jobMarketSnapshot.salaryRange.min} — ${learningPlan.jobMarketSnapshot.salaryRange.currency || '₹'}${learningPlan.jobMarketSnapshot.salaryRange.max}`
                  }</span></span>
                  {learningPlan.jobMarketSnapshot?.activeJobs && (
                    <span className="ml-auto text-primary font-mono">{String(learningPlan.jobMarketSnapshot.activeJobs)}+ active jobs</span>
                  )}
                </div>
              )}
            </Link>
          </motion.section>
        )}

        {/* ─── No Learning Plan CTA ─── */}
        {!hasJourney && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="card-bento p-6 text-center border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <FontAwesomeIcon icon={faRoute} className="text-3xl text-primary/50 mb-3" />
              <h3 className="text-lg font-semibold text-text-main mb-1">Generate Your Learning Plan</h3>
              <p className="text-sm text-text-muted mb-4 max-w-md mx-auto">
                Get an AI-powered learning plan built from Groq, the internet, Twitter and Reddit — tailored to your goals.
              </p>
              <Link
                to="/career"
                className="btn-primary inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlay} />
                Get Started
              </Link>
            </div>
          </motion.section>
        )}

        {/* ─── Two Column Grid ─── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Activity & Streak */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.15 }}
          >
            <SectionHeader icon={faFire} title="Activity" />

            <div className="card-bento p-5">
              {/* Streak + Heatmap */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faFire}
                      className={`${streak > 0 ? "text-orange-400" : "text-text-dim"}`}
                    />
                    <span className="font-bold text-text-main text-lg">
                      {streak > 0 ? `${streak} day streak` : "No streak yet"}
                    </span>
                  </div>
                  <p className="text-xs text-text-dim mt-0.5">
                    {streak > 0
                      ? "Keep it going!"
                      : isAuthenticated
                        ? "Start learning to build your streak"
                        : "Sign in to track your streak"}
                  </p>
                </div>
                <MiniHeatmap data={heatmapData} />
              </div>

              {/* Recent Activity */}
              {recentActivity.length > 0 ? (
                <div className="space-y-2 pt-3 border-t border-border/50">
                  {recentActivity.slice(0, 4).map((event, i) => {
                    const style = activityStyle(event.eventType);
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${style.bg}`}
                        >
                          <FontAwesomeIcon
                            icon={style.icon}
                            className={`text-xs ${style.text}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-main truncate text-xs">
                            {event.data?.title ||
                              event.data?.resourceTitle ||
                              event.eventType?.replace(/_/g, " ")}
                          </p>
                        </div>
                        <span className="text-[10px] text-text-dim whitespace-nowrap">
                          {event.timestamp
                            ? new Date(event.timestamp).toLocaleDateString("en", {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-3 border-t border-border/50 text-center">
                  <p className="text-xs text-text-muted py-2">
                    {isAuthenticated
                      ? "Your activity will appear here as you learn"
                      : "Sign in to track your activity"}
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          {/* ML Recommendations */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            <SectionHeader
              icon={faLightbulb}
              title={isAuthenticated ? "For You" : "Trending"}
              link="/vault"
              linkText="Browse All"
              badge="AI"
            />

            <div className="card-bento p-5">
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.slice(0, 4).map((rec, i) => (
                    <Link
                      key={i}
                      to={`/vault?course=${rec.courseId}`}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-elevated/50 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-sm flex-shrink-0">
                        <FontAwesomeIcon
                          icon={
                            rec.category === "web-dev"
                              ? faCode
                              : rec.category === "python"
                                ? faBook
                                : rec.category === "data-science"
                                  ? faChartLine
                                  : faLayerGroup
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main truncate group-hover:text-primary transition-colors">
                          {rec.courseName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-primary font-mono">
                            {Math.round(rec.confidence * 100)}% match
                          </span>
                          <span className="text-[10px] text-text-dim">
                            {rec.reason}
                          </span>
                        </div>
                      </div>
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="text-xs text-text-dim group-hover:text-primary transition-colors"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="text-2xl text-text-dim mb-2"
                  />
                  <p className="text-xs text-text-muted">
                    Recommendations loading...
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* ─── YouTube Activity (Real-Time) ─── */}
        {isAuthenticated && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.22 }}
            className="mb-8"
          >
            <SectionHeader
              icon={faYoutubeBrand}
              title="YouTube Activity"
              link="/youtube-tracker"
              linkText="Full History"
              badge={ytSseConnected ? "LIVE" : null}
            />

            <div className="card-bento p-5">
              {/* Now Watching */}
              <AnimatePresence>
                {ytNowWatching && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider mb-0.5">Now Watching</p>
                        <p className="text-sm font-medium text-text-main truncate">{ytNowWatching.title}</p>
                        <p className="text-xs text-text-dim truncate">{ytNowWatching.channelTitle}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full ${
                        ytNowWatching.category === 'programming' ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                        ytNowWatching.category === 'tech' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        ytNowWatching.category === 'distraction' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                        'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                      }`}>
                        {ytNowWatching.category}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Category Breakdown Bar */}
              {ytStats?.categoryBreakdown && (() => {
                const cb = ytStats.categoryBreakdown;
                const total = (cb.programming || 0) + (cb.tech || 0) + (cb.distraction || 0) + (cb.other || 0);
                if (total === 0) return (
                  <div className="text-center py-6">
                    <FontAwesomeIcon icon={faYoutubeBrand} className="text-3xl text-text-dim mb-2" />
                    <p className="text-sm text-text-muted">Install the Medha extension and watch YouTube videos to see your activity here.</p>
                    <p className="text-xs text-text-dim mt-1">The extension tracks what you watch and classifies it automatically.</p>
                  </div>
                );
                const pct = (n) => Math.round((n / total) * 100);
                const cats = [
                  { key: 'programming', label: 'Programming', count: cb.programming, pct: pct(cb.programming), color: 'bg-green-500', text: 'text-green-400', icon: faCode },
                  { key: 'tech', label: 'Tech', count: cb.tech, pct: pct(cb.tech), color: 'bg-blue-500', text: 'text-blue-400', icon: faMicrochip },
                  { key: 'distraction', label: 'Distraction', count: cb.distraction, pct: pct(cb.distraction), color: 'bg-red-500', text: 'text-red-400', icon: faExclamationTriangle },
                  { key: 'other', label: 'Other', count: cb.other, pct: pct(cb.other), color: 'bg-gray-500', text: 'text-gray-400', icon: faEllipsisH },
                ];

                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-text-dim uppercase">Watch Category Breakdown</span>
                      <span className="text-xs text-text-dim">{total} videos tracked</span>
                    </div>

                    {/* Stacked bar */}
                    <div className="h-3 rounded-full overflow-hidden flex bg-bg-elevated/50 mb-3">
                      {cats.filter(c => c.count > 0).map(c => (
                        <div
                          key={c.key}
                          className={`${c.color} transition-all duration-500`}
                          style={{ width: `${c.pct}%`, minWidth: c.count > 0 ? '4px' : '0' }}
                          title={`${c.label}: ${c.count} (${c.pct}%)`}
                        />
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {cats.map(c => (
                        <div key={c.key} className="flex items-center gap-2 text-xs">
                          <div className={`w-2.5 h-2.5 rounded-sm ${c.color}`} />
                          <span className="text-text-muted">{c.label}</span>
                          <span className={`font-mono ${c.text}`}>{c.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Recent Videos */}
              {ytRecentVideos.length > 0 && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-[10px] text-text-dim font-mono uppercase mb-2">Recent Videos</p>
                  <div className="space-y-2">
                    {ytRecentVideos.slice(0, 5).map((video, i) => (
                      <div key={video.videoId || i} className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 bg-bg-elevated">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faPlay} className="text-[8px] text-text-dim" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-main truncate">{video.title}</p>
                          <p className="text-[10px] text-text-dim truncate">{video.channelTitle}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
                          video.category === 'programming' ? 'bg-green-500/15 text-green-400' :
                          video.category === 'tech' ? 'bg-blue-500/15 text-blue-400' :
                          video.category === 'distraction' ? 'bg-red-500/15 text-red-400' :
                          'bg-gray-500/15 text-gray-400'
                        }`}>
                          {video.category || 'other'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No data state */}
              {!ytStats?.categoryBreakdown && ytRecentVideos.length === 0 && (
                <div className="text-center py-6">
                  <FontAwesomeIcon icon={faYoutubeBrand} className="text-3xl text-text-dim mb-2" />
                  <p className="text-sm text-text-muted">Install the Medha extension to track your YouTube activity.</p>
                  <p className="text-xs text-text-dim mt-1">Auto-detect programming tutorials, tech content, and distractions.</p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ─── Explore Careers (always visible — makes platform feel rich) ─── */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <SectionHeader
            icon={faCompass}
            title="Explore Careers"
            link="/career"
            linkText="View All"
          />

          <div className="grid md:grid-cols-4 gap-4">
            {(trendingCareers.length > 0
              ? trendingCareers
              : [
                  { name: "Full Stack Developer", category: "web-dev", slug: "full-stack-developer" },
                  { name: "Data Scientist", category: "data-science", slug: "data-scientist" },
                  { name: "Mobile Developer", category: "mobile", slug: "mobile-developer" },
                  { name: "DevOps Engineer", category: "devops", slug: "devops-engineer" },
                ]
            ).map((career, i) => {
              const colors = [
                "from-primary/20 to-primary/5 border-primary/20 text-primary",
                "from-secondary/20 to-secondary/5 border-secondary/20 text-secondary",
                "from-accent/20 to-accent/5 border-accent/20 text-accent",
                "from-green-500/20 to-green-500/5 border-green-500/20 text-green-400",
              ];
              return (
                <Link
                  key={i}
                  to={`/career/${career.slug || career.keyword || career.name?.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`card-bento p-4 bg-gradient-to-br ${colors[i % 4]} hover:scale-[1.02] transition-transform group`}
                >
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="text-lg mb-2 opacity-70"
                  />
                  <h4 className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
                    {career.name || career.keyword}
                  </h4>
                  <p className="text-[10px] text-text-dim mt-1">
                    {career.category || "Explore →"}
                  </p>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* ─── Onboarding CTA (if no journey) ─── */}
        {!hasJourney && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="card-bento p-8 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 border-primary/20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faRocket}
                  className="text-2xl text-primary"
                />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">
                Start Your Learning Journey
              </h3>
              <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
                Choose a career path and let our AI build a personalized
                roadmap with curated resources, projects, and milestones.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/career"
                  className="btn-primary flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faRocket} />
                  Choose a Career
                </Link>
                <Link
                  to="/vault"
                  className="btn-secondary flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faBookmark} />
                  Browse Vault
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* ─── Quick Actions (always visible) ─── */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-sm font-mono text-text-dim uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/analyzer"
              className="card-bento p-5 hover:border-primary/50 group block"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                <FontAwesomeIcon icon={faPlus} />
              </div>
              <h4 className="font-medium text-text-main group-hover:text-primary transition-colors mb-1">
                Analyze Video
              </h4>
              <p className="text-xs text-text-muted">
                Get AI insights on any YouTube tutorial
              </p>
            </Link>

            <Link
              to="/learning-paths"
              className="card-bento p-5 hover:border-secondary/50 group block"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-3">
                <FontAwesomeIcon icon={faRoute} />
              </div>
              <h4 className="font-medium text-text-main group-hover:text-secondary transition-colors mb-1">
                Learning Paths
              </h4>
              <p className="text-xs text-text-muted">
                Create or browse learning paths
              </p>
            </Link>

            <Link
              to="/career"
              className="card-bento p-5 hover:border-accent/50 group block"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-3">
                <FontAwesomeIcon icon={faBriefcase} />
              </div>
              <h4 className="font-medium text-text-main group-hover:text-accent transition-colors mb-1">
                Explore Careers
              </h4>
              <p className="text-xs text-text-muted">
                Discover paths aligned with your goals
              </p>
            </Link>
          </div>
        </motion.section>

        </div>{/* END main column */}

        {/* ═══ RIGHT SIDEBAR (280px) ═══ */}
        <aside className="hidden xl:block w-[280px] flex-shrink-0 pt-1 space-y-6">

          {/* Mini Leaderboard */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>This Week</p>
            <div className="space-y-2">
              {/* Person above */}
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <span className="font-mono text-xs w-5 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>#4</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>A</div>
                <span className="text-xs text-white flex-1 truncate">Ankit_dev</span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>210 XP</span>
              </div>
              {/* Current user — highlighted */}
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.15)' }}>
                <span className="font-mono text-xs w-5 text-center" style={{ color: '#39FF14' }}>#5</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'rgba(57,255,20,0.15)', color: '#39FF14' }}>
                  {(user?.name || 'Y')[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium flex-1 truncate" style={{ color: '#39FF14' }}>{user?.name || 'You'}</span>
                <span className="font-mono text-[10px]" style={{ color: '#39FF14' }}>{totalXP} XP</span>
              </div>
              {/* Person below */}
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <span className="font-mono text-xs w-5 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>#6</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>R</div>
                <span className="text-xs text-white flex-1 truncate">Riya_codes</span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>180 XP</span>
              </div>
            </div>
            <Link to="/leaderboard" className="font-mono text-[10px] mt-3 block text-center" style={{ color: '#00D4FF' }}>
              View full leaderboard →
            </Link>
          </div>

          {/* Today's Actions */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Today's Actions</p>
            <div className="space-y-2">
              {[
                { text: "Review someone's code", xp: 30, icon: faCode, color: '#00D4FF', link: '/charcha' },
                { text: "Complete Phase 1 checkpoint", xp: 50, icon: faCheckCircle, color: '#39FF14', link: '/learning-paths' },
                { text: "Post in Charcha forum", xp: 10, icon: faLightbulb, color: '#F5A623', link: '/charcha' },
              ].map((action, i) => (
                <Link key={i} to={action.link} className="flex items-center gap-2.5 p-2 rounded-lg transition-all group"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                >
                  <FontAwesomeIcon icon={action.icon} className="text-xs" style={{ color: action.color }} />
                  <span className="text-xs text-white flex-1 leading-tight">{action.text}</span>
                  <span className="font-mono text-[10px] font-bold" style={{ color: '#39FF14' }}>+{action.xp}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 7-Day Streak Calendar */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>This Week</p>
            <div className="flex gap-1 justify-between">
              {(() => {
                const days = [];
                const today = new Date();
                const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                for (let i = 6; i >= 0; i--) {
                  const d = new Date(today);
                  d.setDate(d.getDate() - i);
                  const key = d.toISOString().split('T')[0];
                  const isToday = i === 0;
                  const wasActive = heatmapData.find(h => h._id === key)?.count > 0;
                  days.push(
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {dayNames[d.getDay()]}
                      </span>
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono"
                        style={{
                          backgroundColor: isToday
                            ? 'rgba(0,212,255,0.15)'
                            : wasActive
                              ? 'rgba(57,255,20,0.12)'
                              : 'rgba(255,255,255,0.04)',
                          border: isToday ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                          color: isToday ? '#00D4FF' : wasActive ? '#39FF14' : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {d.getDate()}
                      </div>
                    </div>
                  );
                }
                return days;
              })()}
            </div>
          </div>
        </aside>

      </div>{/* END flex container */}
    </main>
    </>
  );
};

export default DashboardPage;
