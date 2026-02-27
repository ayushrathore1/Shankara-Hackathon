import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faClock,
  faExternalLinkAlt,
  faCheckCircle,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import PropTypes from "prop-types";

/**
 * VaultTutorialCard - Premium card for cached tutorials with glassmorphic hover overlay
 * Shows thumbnail, title, channel, duration, Medha score
 * On hover: reveals detailed AI analysis with glassmorphic effect
 */
const VaultTutorialCard = ({ tutorial, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  // Get score background
  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green/20 border-green/40";
    if (score >= 60) return "bg-yellow-400/20 border-yellow-400/40";
    if (score >= 40) return "bg-orange-400/20 border-orange-400/40";
    return "bg-red-400/20 border-red-400/40";
  };

  // Get quality label
  const getQualityLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Below Average";
  };

  const handleWatch = () => {
    if (onClick) {
      onClick(tutorial);
    } else {
      window.open(
        `https://www.youtube.com/watch?v=${tutorial.youtubeId}`,
        "_blank",
      );
    }
  };

  const score =
    tutorial.analysisData?.evaluation?.codeLearnnScore ||
    tutorial.codeLearnnScore ||
    0;
  const evaluation = tutorial.analysisData?.evaluation || {};

  return (
    <>
      <motion.article
        className="relative group h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-light-navy to-navy border border-lightest-navy/30 shadow-lg h-full flex flex-col">
          {/* Thumbnail Section */}
          <div className="relative aspect-video overflow-hidden">
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-light-navy via-lightest-navy to-light-navy animate-pulse" />
            )}

            <img
              src={
                tutorial.thumbnail ||
                `https://img.youtube.com/vi/${tutorial.youtubeId}/maxresdefault.jpg`
              }
              alt={tutorial.title}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${tutorial.youtubeId}/hqdefault.jpg`;
                setImageLoaded(true);
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-60" />

            {/* Duration badge */}
            <div className="absolute bottom-3 left-3 bg-navy/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-mono text-white flex items-center gap-1.5 border border-white/10">
              <FontAwesomeIcon
                icon={faClock}
                className="text-green text-[10px]"
              />
              {tutorial.duration}
            </div>

            {/* Score badge - Premium style */}
            <div
              className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-sm font-bold font-mono border backdrop-blur-sm ${getScoreBg(score)} ${getScoreColor(score)}`}
            >
              {score}
            </div>

            {/* Category tag */}
            {tutorial.category && (
              <div className="absolute top-3 left-3 bg-green/20 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-mono text-green uppercase tracking-wider border border-green/30">
                {tutorial.category}
              </div>
            )}

            {/* Play button overlay */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              onClick={handleWatch}
            >
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-green/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-green/30"
              >
                <FontAwesomeIcon
                  icon={faPlay}
                  className="text-navy text-lg ml-1"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Content Section */}
          <div className="p-4 flex flex-col flex-1">
            {/* Title */}
            <h3
              className="text-white font-heading font-semibold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-green transition-colors cursor-pointer"
              onClick={handleWatch}
            >
              {tutorial.title}
            </h3>

            {/* Channel */}
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon
                icon={faYoutube}
                className="text-red-500 text-sm"
              />
              <span className="text-slate text-xs font-mono truncate">
                {tutorial.channelName}
              </span>
            </div>

            {/* Quality indicator */}
            <div className="mt-auto flex items-center justify-between">
              <span className={`text-xs font-mono ${getScoreColor(score)}`}>
                {getQualityLabel(score)}
              </span>
              <button
                onClick={() => setShowDetailModal(true)}
                className="text-xs font-mono text-slate hover:text-green transition-colors underline underline-offset-2"
              >
                View Analysis
              </button>
            </div>
          </div>

          {/* Glassmorphic Hover Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-navy/80 backdrop-blur-md rounded-xl p-4 flex flex-col justify-between border border-green/20"
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-2xl font-bold font-mono ${getScoreColor(score)}`}
                    >
                      {score}/100
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono ${getScoreBg(score)} ${getScoreColor(score)}`}
                    >
                      {getQualityLabel(score)}
                    </span>
                  </div>

                  <h4 className="text-white font-heading font-semibold text-sm line-clamp-2 mb-3">
                    {tutorial.title}
                  </h4>
                </div>

                {/* Analysis Details */}
                <div className="space-y-2 flex-1 overflow-hidden">
                  {/* Strengths */}
                  {evaluation.strengths?.length > 0 && (
                    <div>
                      <p className="text-green text-[10px] font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                        <FontAwesomeIcon icon={faCheckCircle} /> Strengths
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {evaluation.strengths.slice(0, 2).map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 bg-green/10 text-green rounded-full font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {evaluation.weaknesses?.length > 0 && (
                    <div>
                      <p className="text-yellow-400 text-[10px] font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> Caution
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {evaluation.weaknesses.slice(0, 2).map((w, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded-full font-mono"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {evaluation.summary && (
                    <p className="text-slate text-[11px] line-clamp-2 italic">
                      "{evaluation.summary}"
                    </p>
                  )}
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWatch}
                  className="w-full py-2.5 bg-green text-navy font-semibold text-sm rounded-lg flex items-center justify-center gap-2 mt-3"
                >
                  Watch Now
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    className="text-xs"
                  />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Glow effect on hover */}
        <div
          className={`absolute -inset-1 bg-gradient-to-r from-green/20 via-green/10 to-green/20 rounded-xl blur-xl transition-opacity duration-300 -z-10 ${isHovered ? "opacity-100" : "opacity-0"}`}
        />
      </motion.article>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-light-navy rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-lightest-navy"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white font-heading font-bold text-lg">
                  {tutorial.title}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Score breakdown */}
                <div className="flex items-center gap-4 p-4 bg-navy rounded-lg">
                  <div
                    className={`text-4xl font-bold font-mono ${getScoreColor(score)}`}
                  >
                    {score}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {getQualityLabel(score)}
                    </p>
                    <p className="text-slate text-sm">Medha Score</p>
                  </div>
                </div>

                {/* Breakdown bars */}
                {evaluation.breakdown && (
                  <div className="space-y-2">
                    {Object.entries(evaluation.breakdown).map(
                      ([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-slate text-xs font-mono w-32 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <div className="flex-1 h-2 bg-navy rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              className="h-full bg-green rounded-full"
                            />
                          </div>
                          <span className="text-white text-xs font-mono w-8">
                            {value}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Summary */}
                {evaluation.summary && (
                  <div>
                    <p className="text-green text-xs font-mono uppercase mb-2">
                      AI Summary
                    </p>
                    <p className="text-light-slate text-sm">
                      {evaluation.summary}
                    </p>
                  </div>
                )}

                {/* Watch button */}
                <button
                  onClick={handleWatch}
                  className="w-full py-3 bg-green text-navy font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  Watch on YouTube
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

VaultTutorialCard.propTypes = {
  tutorial: PropTypes.shape({
    youtubeId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    channelName: PropTypes.string,
    duration: PropTypes.string,
    category: PropTypes.string,
    subcategory: PropTypes.string,
    codeLearnnScore: PropTypes.number,
    analysisData: PropTypes.shape({
      evaluation: PropTypes.shape({
        codeLearnnScore: PropTypes.number,
        strengths: PropTypes.arrayOf(PropTypes.string),
        weaknesses: PropTypes.arrayOf(PropTypes.string),
        summary: PropTypes.string,
        breakdown: PropTypes.object,
      }),
    }),
  }).isRequired,
  onClick: PropTypes.func,
};

export default VaultTutorialCard;
