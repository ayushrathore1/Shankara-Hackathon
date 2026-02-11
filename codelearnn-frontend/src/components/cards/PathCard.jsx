import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faLock, faPlay } from "@fortawesome/free-solid-svg-icons";

/**
 * PathCard - Learning path card for Vault grid
 *
 * @param {object} props
 * @param {string} props.id - Path ID for linking
 * @param {string} props.title - Path title
 * @param {string[]} props.tags - Technology/topic tags
 * @param {string} props.level - 'Beginner' | 'Intermediate' | 'Advanced'
 * @param {number} props.hours - Estimated hours
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {boolean} props.isPro - Is this a Pro-only path
 * @param {boolean} props.isEnrolled - Has user enrolled in this path
 */
const PathCard = ({
  id,
  title,
  tags = [],
  level = "Beginner",
  hours = 0,
  progress = 0,
  isPro = false,
  isEnrolled = false,
}) => {
  const levelColors = {
    Beginner: "tag-emerald",
    Intermediate: "tag",
    Advanced: "tag-violet",
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        to={`/vault/${id}`}
        className="block p-5 rounded-xl bg-bg-surface border border-border hover:border-cyan transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] group relative"
      >
        {/* Pro Badge */}
        {isPro && (
          <div className="absolute top-4 right-4 badge-pro">
            <FontAwesomeIcon icon={faLock} className="text-[10px]" />
            PRO
          </div>
        )}

        {/* Title */}
        <h3 className="font-heading font-semibold text-lg text-text-primary mb-3 pr-16 group-hover:text-cyan transition-colors">
          {title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="text-xs text-text-dim bg-bg-elevated px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Level & Time */}
        <div className="flex items-center justify-between mb-4">
          <span className={`${levelColors[level] || "tag"}`}>{level}</span>
          <span className="text-text-dim text-sm flex items-center gap-1.5">
            <FontAwesomeIcon icon={faClock} className="text-xs" />
            {hours}h
          </span>
        </div>

        {/* Progress Bar (if enrolled) */}
        {isEnrolled && progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-text-dim mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          className={`
          w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200
          ${
            isEnrolled
              ? "bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20"
              : "bg-bg-elevated text-text-secondary hover:bg-bg-highlight hover:text-text-primary"
          }
          flex items-center justify-center gap-2
        `}
        >
          {isEnrolled ? (
            <>
              <FontAwesomeIcon icon={faPlay} className="text-xs" />
              Continue
            </>
          ) : (
            "Start Learning"
          )}
        </button>
      </Link>
    </motion.div>
  );
};

export default PathCard;
