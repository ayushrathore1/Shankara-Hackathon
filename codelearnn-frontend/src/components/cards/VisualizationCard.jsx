import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faLock,
  faPlay,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

/**
 * VisualizationCard - Card for visualization gallery
 *
 * @param {object} props
 * @param {string} props.id - Visualization ID for linking
 * @param {string} props.title - Title
 * @param {string} props.thumbnail - Thumbnail image URL
 * @param {string} props.topic - Topic/category
 * @param {string} props.difficulty - 'Easy' | 'Medium' | 'Hard'
 * @param {number} props.duration - Duration in minutes
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {boolean} props.isPro - Is this Pro-only
 * @param {boolean} props.isCompleted - Is this completed
 */
const VisualizationCard = ({
  id,
  title,
  thumbnail,
  topic,
  difficulty = "Easy",
  duration = 10,
  progress = 0,
  isPro = false,
  isCompleted = false,
}) => {
  const difficultyColors = {
    Easy: "text-emerald",
    Medium: "text-amber",
    Hard: "text-red",
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        to={`/visualizations/${id}`}
        className="block rounded-xl bg-bg-surface border border-border hover:border-violet transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] group overflow-hidden relative"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-bg-elevated overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-violet/20 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faPlay}
                  className="text-2xl text-violet"
                />
              </div>
            </div>
          )}

          {/* Pro Badge */}
          {isPro && (
            <div className="absolute top-3 right-3 badge-pro">
              <FontAwesomeIcon icon={faLock} className="text-[10px]" />
              PRO
            </div>
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <div className="absolute top-3 left-3 bg-emerald text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
              <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
              Completed
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-bg-base/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-violet flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <FontAwesomeIcon
                icon={faPlay}
                className="text-xl text-white ml-1"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Topic */}
          <span className="text-xs text-violet font-medium uppercase tracking-wider">
            {topic}
          </span>

          {/* Title */}
          <h3 className="font-heading font-semibold text-text-primary mt-1 mb-3 group-hover:text-violet transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm">
            <span
              className={`font-mono ${difficultyColors[difficulty] || "text-text-dim"}`}
            >
              {difficulty}
            </span>
            <span className="text-text-dim flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClock} className="text-xs" />
              {duration}m
            </span>
          </div>

          {/* Progress Bar */}
          {progress > 0 && !isCompleted && (
            <div className="mt-3">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default VisualizationCard;
