import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faEye,
  faThumbsUp,
  faComment,
  faClock,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import PropTypes from "prop-types";
import CodeLearnnScore from "../common/CodeLearnnScore";

/**
 * VideoResourceCard - Displays a YouTube video resource with metrics
 * @param {Object} props - Component props
 */
const VideoResourceCard = ({ resource, onWatch, showDetails = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || "0";
  };

  // Get level badge color
  const getLevelColor = (level) => {
    switch (level) {
      case "beginner":
        return "bg-green/20 text-green";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400";
      case "advanced":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate/20 text-slate";
    }
  };

  const handleWatch = () => {
    if (onWatch) {
      onWatch(resource);
    } else {
      window.open(
        `https://www.youtube.com/watch?v=${resource.youtubeId}`,
        "_blank",
      );
    }
  };

  return (
    <>
      <motion.article
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className="card group h-full flex flex-col overflow-hidden"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-light-navy">
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-light-navy via-lightest-navy to-light-navy animate-pulse" />
          )}

          <img
            src={
              resource.thumbnail ||
              `https://img.youtube.com/vi/${resource.youtubeId}/maxresdefault.jpg`
            }
            alt={resource.title}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.src = `https://img.youtube.com/vi/${resource.youtubeId}/hqdefault.jpg`;
              setImageLoaded(true);
            }}
          />

          {/* Play overlay */}
          <motion.div
            className="absolute inset-0 bg-navy/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleWatch}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 rounded-full bg-green flex items-center justify-center"
            >
              <FontAwesomeIcon
                icon={faPlay}
                className="text-navy text-xl ml-1"
              />
            </motion.div>
          </motion.div>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-navy/90 px-2 py-1 rounded text-xs font-mono text-white">
            <FontAwesomeIcon icon={faClock} className="mr-1 text-green" />
            {resource.duration}
          </div>

          {/* Level badge */}
          {resource.level && (
            <div
              className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-mono capitalize ${getLevelColor(resource.level)}`}
            >
              {resource.level}
            </div>
          )}

          {/* Score badge */}
          <div className="absolute top-2 right-2">
            <CodeLearnnScore
              score={resource.codeLearnnScore}
              size="sm"
              showLabel={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Title */}
          <h3
            className="text-white font-heading font-semibold text-sm md:text-base mb-2 line-clamp-2 group-hover:text-green transition-colors cursor-pointer"
            onClick={handleWatch}
          >
            {resource.title}
          </h3>

          {/* Channel */}
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon
              icon={faYoutube}
              className="text-red-500 text-sm"
            />
            <span className="text-slate text-xs font-mono truncate">
              {resource.channelName}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs font-mono text-light-slate mt-auto">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faEye} className="text-green" />
              {formatNumber(resource.statistics?.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faThumbsUp} className="text-green" />
              {formatNumber(resource.statistics?.likeCount)}
            </span>
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faComment} className="text-green" />
              {formatNumber(resource.statistics?.commentCount)}
            </span>
          </div>

          {/* AI Summary - shown on hover or if showDetails */}
          {showDetails && resource.aiAnalysis?.summary && (
            <p className="text-slate text-xs mt-3 line-clamp-2">
              {resource.aiAnalysis.summary}
            </p>
          )}

          {/* Strengths */}
          {showDetails && resource.aiAnalysis?.strengths?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.aiAnalysis.strengths
                .slice(0, 2)
                .map((strength, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 bg-green/10 text-green rounded font-mono"
                  >
                    {strength}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-0">
          <motion.button
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWatch}
            className="w-full py-2 border border-green/30 rounded text-green text-xs font-mono hover:bg-green/10 transition-colors flex items-center justify-center gap-2"
          >
            Watch Now
            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
          </motion.button>
        </div>
      </motion.article>

      {/* Video Modal (optional) */}
      {showModal && (
        <div
          className="fixed inset-0 bg-navy/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl aspect-video bg-dark rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${resource.youtubeId}?autoplay=1`}
              title={resource.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </div>
      )}
    </>
  );
};

VideoResourceCard.propTypes = {
  resource: PropTypes.shape({
    _id: PropTypes.string,
    youtubeId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    channelName: PropTypes.string,
    duration: PropTypes.string,
    level: PropTypes.string,
    codeLearnnScore: PropTypes.number,
    statistics: PropTypes.shape({
      viewCount: PropTypes.number,
      likeCount: PropTypes.number,
      commentCount: PropTypes.number,
    }),
    aiAnalysis: PropTypes.shape({
      summary: PropTypes.string,
      strengths: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
  onWatch: PropTypes.func,
  showDetails: PropTypes.bool,
};

export default VideoResourceCard;
