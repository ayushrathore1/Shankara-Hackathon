import { motion } from "framer-motion";
import PropTypes from "prop-types";

// ScoreCircle component - extracted outside to prevent re-creation during render
const ScoreCircle = ({
  config,
  colors,
  score,
  circumference,
  strokeDashoffset,
  animated,
}) => (
  <div
    className={`${config.container} relative flex items-center justify-center rounded-full`}
    style={{ backgroundColor: colors.bg }}
  >
    {/* SVG Ring */}
    <svg
      className="absolute inset-0 w-full h-full -rotate-90"
      viewBox="0 0 100 100"
    >
      {/* Background ring */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="rgba(100, 255, 218, 0.1)"
        strokeWidth={config.ring}
      />
      {/* Progress ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke={colors.ring}
        strokeWidth={config.ring}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={
          animated ? { strokeDashoffset: circumference } : { strokeDashoffset }
        }
        animate={{ strokeDashoffset }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>

    {/* Score number */}
    <motion.span
      className={`${config.text} font-bold font-mono z-10`}
      style={{ color: colors.text }}
      initial={animated ? { opacity: 0, scale: 0.5 } : {}}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      {score}
    </motion.span>
  </div>
);

ScoreCircle.propTypes = {
  config: PropTypes.object.isRequired,
  colors: PropTypes.object.isRequired,
  score: PropTypes.number.isRequired,
  circumference: PropTypes.number.isRequired,
  strokeDashoffset: PropTypes.number.isRequired,
  animated: PropTypes.bool,
};

/**
 * MedhaScore - Displays the quality score with visual indicators
 * Enhanced for honest assessments with color-coded quality tiers
 *
 * @param {Object} props - Component props
 * @param {number} props.score - Score from 0-100
 * @param {string} [props.size='md'] - Size variant (sm, md, lg)
 * @param {boolean} [props.showLabel=true] - Whether to show "Medha" label
 * @param {Object} [props.breakdown] - Score breakdown details
 * @param {boolean} [props.animated=true] - Enable animations
 */
const MedhaScore = ({
  score = 0,
  size = "md",
  showLabel = true,
  breakdown = null,
  animated = true,
}) => {
  // Determine color based on score - stricter thresholds for honest assessment
  const getScoreColor = (value) => {
    if (value >= 80)
      return {
        bg: "rgba(100, 255, 218, 0.15)",
        text: "#64ffda",
        ring: "#64ffda",
        label: "Excellent",
      };
    if (value >= 65)
      return {
        bg: "rgba(100, 255, 218, 0.10)",
        text: "#64ffda",
        ring: "#64ffda80",
        label: "Good",
      };
    if (value >= 50)
      return {
        bg: "rgba(255, 217, 61, 0.15)",
        text: "#ffd93d",
        ring: "#ffd93d",
        label: "Average",
      };
    if (value >= 35)
      return {
        bg: "rgba(255, 159, 67, 0.15)",
        text: "#ff9f43",
        ring: "#ff9f43",
        label: "Below Avg",
      };
    return {
      bg: "rgba(238, 82, 83, 0.15)",
      text: "#ee5253",
      ring: "#ee5253",
      label: "Poor",
    };
  };

  // Get emoji indicator
  const getScoreEmoji = (value) => {
    if (value >= 80) return "🌟";
    if (value >= 65) return "✅";
    if (value >= 50) return "⚖️";
    if (value >= 35) return "⚠️";
    return "❌";
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "w-12 h-12",
      text: "text-sm",
      label: "text-[10px]",
      ring: 3,
    },
    md: { container: "w-16 h-16", text: "text-lg", label: "text-xs", ring: 5 },
    lg: { container: "w-24 h-24", text: "text-2xl", label: "text-sm", ring: 6 },
  };

  const colors = getScoreColor(score);
  const config = sizeConfig[size] || sizeConfig.md;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Simple badge variant for compact display
  if (size === "sm" && !breakdown) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-xs"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <span>{getScoreEmoji(score)}</span>
        <span className="font-bold">{score}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <ScoreCircle
        config={config}
        colors={colors}
        score={score}
        circumference={circumference}
        strokeDashoffset={strokeDashoffset}
        animated={animated}
      />

      {showLabel && (
        <div className="text-center">
          <p className={`${config.label} font-mono text-light-slate`}>
            Medha Score
          </p>
          <p
            className={`${config.label} font-semibold flex items-center justify-center gap-1`}
            style={{ color: colors.text }}
          >
            <span>{getScoreEmoji(score)}</span>
            {colors.label}
          </p>
        </div>
      )}

      {/* Breakdown details (hover/expand) */}
      {breakdown && size === "lg" && (
        <div className="mt-2 p-3 bg-light-navy rounded text-xs font-mono space-y-2 w-full max-w-[200px]">
          <div className="text-slate text-[10px] mb-2 text-center">
            Score Breakdown
          </div>

          {/* Individual scores */}
          {[
            {
              label: "Content Quality",
              value: breakdown.contentQuality,
              max: 10,
            },
            {
              label: "Teaching Clarity",
              value: breakdown.teachingClarity,
              max: 10,
            },
            {
              label: "Practical Value",
              value: breakdown.practicalValue,
              max: 10,
            },
            { label: "Up-to-Date", value: breakdown.upToDateScore, max: 10 },
            {
              label: "Comment Sentiment",
              value: breakdown.commentSentiment,
              max: 10,
            },
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center gap-2">
              <span className="text-slate text-[10px]">{item.label}</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-lightest-navy rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${((item.value || 0) / item.max) * 100}%`,
                      backgroundColor:
                        item.value >= 7
                          ? "#64ffda"
                          : item.value >= 5
                            ? "#ffd93d"
                            : "#ee5253",
                    }}
                  />
                </div>
                <span className="text-white text-[10px] w-6 text-right">
                  {item.value || 0}
                </span>
              </div>
            </div>
          ))}

          {/* Engagement (different scale) */}
          <div className="flex justify-between items-center gap-2 pt-1 border-t border-lightest-navy">
            <span className="text-slate text-[10px]">Engagement</span>
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-lightest-navy rounded overflow-hidden">
                <div
                  className="h-full bg-green rounded transition-all"
                  style={{ width: `${breakdown.engagement || 0}%` }}
                />
              </div>
              <span className="text-white text-[10px] w-6 text-right">
                {breakdown.engagement || 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MedhaScore.propTypes = {
  score: PropTypes.number,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  showLabel: PropTypes.bool,
  breakdown: PropTypes.shape({
    engagement: PropTypes.number,
    contentQuality: PropTypes.number,
    teachingClarity: PropTypes.number,
    practicalValue: PropTypes.number,
    upToDateScore: PropTypes.number,
    commentSentiment: PropTypes.number,
  }),
  animated: PropTypes.bool,
};

export default MedhaScore;
