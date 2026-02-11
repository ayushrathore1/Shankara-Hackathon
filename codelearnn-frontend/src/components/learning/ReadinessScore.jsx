import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faCheckCircle,
  faExclamationTriangle,
  faLightbulb,
  faChartLine,
  faCodeBranch,
  faBullseye,
  faVideo,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

/**
 * ReadinessScore Component
 *
 * Displays career readiness score with:
 * - Animated circular progress
 * - Score breakdown by category
 * - Skills coverage summary
 * - Personalized recommendations
 */

const ReadinessScore = ({ readiness, skillsGap, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin text-2xl text-primary mb-3"
        />
        <p className="text-text-muted">Calculating readiness...</p>
      </div>
    );
  }

  if (!readiness || readiness.score === undefined) {
    return (
      <div className="p-6 text-center rounded-xl bg-bg-surface border border-border">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-bg-elevated flex items-center justify-center">
          <FontAwesomeIcon
            icon={faGraduationCap}
            className="text-xl text-text-dim"
          />
        </div>
        <p className="text-text-muted">No readiness data yet</p>
        <p className="text-sm text-text-dim mt-1">
          Select a career and start learning to track progress
        </p>
      </div>
    );
  }

  const getLevelColor = (color) => {
    const colors = {
      emerald: "text-emerald-400",
      green: "text-green-400",
      yellow: "text-yellow-400",
      orange: "text-orange-400",
      gray: "text-gray-400",
    };
    return colors[color] || "text-primary";
  };

  const getProgressColor = (value) => {
    if (value >= 75) return "bg-green-500";
    if (value >= 50) return "bg-yellow-500";
    if (value >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-blue-400";
      default:
        return "text-text-muted";
    }
  };

  // Calculate stroke-dashoffset for circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (readiness.score / 100) * circumference;

  return (
    <div className="readiness-score">
      {/* Main Score Card */}
      <div className="bg-bg-surface border border-border rounded-xl p-6 mb-4">
        <div className="flex items-start gap-6">
          {/* Circular Progress */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-bg-elevated"
              />
              {/* Progress circle */}
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeDasharray={circumference}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-accent)" />
                </linearGradient>
              </defs>
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-bold text-text-main"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                {readiness.score}
              </motion.span>
              <span className="text-xs text-text-dim">/ 100</span>
            </div>
          </div>

          {/* Level and Career */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-lg font-semibold ${getLevelColor(readiness.level?.color)}`}
              >
                {readiness.level?.name}
              </span>
            </div>
            <p className="text-sm text-text-muted mb-3">
              {readiness.level?.description}
            </p>
            {readiness.careerId && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
                <FontAwesomeIcon icon={faBullseye} className="text-xs" />
                {readiness.careerId}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {Object.entries(readiness.breakdown || {}).map(([key, value]) => {
          const labels = {
            pathProgress: { label: "Path Progress", icon: faChartLine },
            skillsCoverage: { label: "Skills Coverage", icon: faCodeBranch },
            careerAlignment: { label: "Career Alignment", icon: faBullseye },
            videosCompleted: { label: "Videos Completed", icon: faVideo },
          };

          const item = labels[key];
          if (!item) return null;

          return (
            <div
              key={key}
              className="p-3 rounded-lg bg-bg-surface border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon
                  icon={item.icon}
                  className="text-xs text-text-dim"
                />
                <span className="text-xs text-text-muted">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${getProgressColor(value)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <span className="text-sm font-medium text-text-main w-10 text-right">
                  {value}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skills Gap Section */}
      {skillsGap && (
        <div className="bg-bg-surface border border-border rounded-xl p-4 mb-4">
          <h4 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faCodeBranch} className="text-purple-400" />
            Skills Overview
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Covered Skills */}
            <div>
              <p className="text-xs text-text-dim mb-2 flex items-center gap-1">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-400"
                />
                Covered ({skillsGap.covered?.length || 0})
              </p>
              <div className="flex flex-wrap gap-1">
                {(skillsGap.covered || []).slice(0, 6).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400"
                  >
                    {skill}
                  </span>
                ))}
                {(skillsGap.covered?.length || 0) > 6 && (
                  <span className="px-2 py-0.5 rounded text-xs bg-bg-elevated text-text-dim">
                    +{skillsGap.covered.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div>
              <p className="text-xs text-text-dim mb-2 flex items-center gap-1">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-orange-400"
                />
                To Learn ({skillsGap.missing?.length || 0})
              </p>
              <div className="flex flex-wrap gap-1">
                {(skillsGap.suggested || skillsGap.missing || [])
                  .slice(0, 6)
                  .map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400"
                    >
                      {skill}
                    </span>
                  ))}
                {(skillsGap.missing?.length || 0) > 6 && (
                  <span className="px-2 py-0.5 rounded text-xs bg-bg-elevated text-text-dim">
                    +{skillsGap.missing.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {readiness.recommendations?.length > 0 && (
        <div className="bg-bg-surface border border-border rounded-xl p-4">
          <h4 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400" />
            Recommendations
          </h4>

          <div className="space-y-2">
            {readiness.recommendations.slice(0, 3).map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-elevated flex items-start gap-3"
              >
                <span
                  className={`text-xs mt-0.5 ${getPriorityColor(rec.priority)}`}
                >
                  ●
                </span>
                <div>
                  <p className="text-sm text-text-main">{rec.message}</p>
                  <p className="text-xs text-text-dim mt-1">{rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      {readiness.stats && (
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-text-dim">
          <span>{readiness.stats.totalPaths} paths</span>
          <span>•</span>
          <span>
            {readiness.stats.completedVideos}/{readiness.stats.totalVideos}{" "}
            videos
          </span>
          <span>•</span>
          <span>{readiness.stats.completedPaths} completed</span>
        </div>
      )}
    </div>
  );
};

export default ReadinessScore;
