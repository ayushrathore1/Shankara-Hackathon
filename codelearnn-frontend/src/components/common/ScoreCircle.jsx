import { motion } from "framer-motion";

/**
 * ScoreCircle - Animated circular score display for Analyzer
 *
 * @param {object} props
 * @param {number} props.score - Score value (0-100)
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 */
const ScoreCircle = ({ score = 0, size = "lg" }) => {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color based on score
  const getScoreColor = () => {
    if (clampedScore >= 70)
      return { main: "#10B981", glow: "rgba(16, 185, 129, 0.3)" };
    if (clampedScore >= 40)
      return { main: "#F59E0B", glow: "rgba(245, 158, 11, 0.3)" };
    return { main: "#EF4444", glow: "rgba(239, 68, 68, 0.3)" };
  };

  const colors = getScoreColor();

  // Size configurations
  const sizes = {
    sm: { container: 80, stroke: 6, fontSize: "text-xl" },
    md: { container: 120, stroke: 8, fontSize: "text-3xl" },
    lg: { container: 180, stroke: 10, fontSize: "text-5xl" },
  };

  const config = sizes[size] || sizes.lg;
  const radius = (config.container - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: config.container, height: config.container }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-full opacity-50 blur-xl"
        style={{ backgroundColor: colors.glow }}
      />

      {/* SVG Circle */}
      <svg
        width={config.container}
        height={config.container}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.container / 2}
          cy={config.container / 2}
          r={radius}
          fill="none"
          stroke="#233554"
          strokeWidth={config.stroke}
        />

        {/* Progress circle */}
        <motion.circle
          cx={config.container / 2}
          cy={config.container / 2}
          r={radius}
          fill="none"
          stroke={colors.main}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 8px ${colors.glow})`,
          }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`font-heading font-bold ${config.fontSize}`}
          style={{ color: colors.main }}
        >
          {clampedScore}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-text-dim text-sm font-mono"
        >
          / 100
        </motion.span>
      </div>
    </div>
  );
};

export default ScoreCircle;
