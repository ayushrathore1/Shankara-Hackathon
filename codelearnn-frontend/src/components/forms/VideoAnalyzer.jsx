import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSpinner,
  faCheck,
  faTimes,
  faChartLine,
  faUserGraduate,
  faExternalLinkAlt,
  faExclamationTriangle,
  faThumbsUp,
  faThumbsDown,
  faInfoCircle,
  faList,
  faPlay,
  faEye,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import PropTypes from "prop-types";
import MedhaScore from "../common/MedhaScore";
import { freeResourcesAPI } from "../../services/api";

/**
 * VideoAnalyzer - Component for analyzing YouTube videos and playlists
 * Provides honest, critical quality assessments using AI
 */
const VideoAnalyzer = ({ onAnalysisComplete }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Validate YouTube URL (video or playlist)
  const isValidUrl = (inputUrl) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]+/,
      /[?&]list=[a-zA-Z0-9_-]+/,
      /youtube\.com\/playlist\?list=[a-zA-Z0-9_-]+/,
    ];
    return patterns.some((pattern) => pattern.test(inputUrl));
  };

  // Handle analysis
  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await freeResourcesAPI.analyzeVideo(url);
      setResult(response.data);

      if (onAnalysisComplete) {
        onAnalysisComplete(response.data);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to analyze video. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleAnalyze();
    }
  };

  // Clear results
  const handleClear = () => {
    setUrl("");
    setResult(null);
    setError(null);
  };

  // Get recommendation badge style
  const getRecommendationStyle = (recommendation) => {
    const styles = {
      strongly_recommend: {
        bg: "bg-green/20",
        text: "text-green",
        label: "✅ Strongly Recommended",
      },
      recommend: {
        bg: "bg-green/15",
        text: "text-green",
        label: "👍 Recommended",
      },
      neutral: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        label: "⚖️ Neutral",
      },
      caution: {
        bg: "bg-orange-500/20",
        text: "text-orange-400",
        label: "⚠️ Use with Caution",
      },
      avoid: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        label: "❌ Not Recommended",
      },
    };
    return styles[recommendation] || styles["neutral"];
  };

  // Get quality tier color
  const getQualityTierStyle = (tier) => {
    const styles = {
      excellent: "text-green",
      good: "text-green/80",
      average: "text-yellow-400",
      below_average: "text-orange-400",
      poor: "text-red-400",
      not_applicable: "text-slate",
    };
    return styles[tier] || "text-slate";
  };

  // Get confidence style
  const getConfidenceStyle = (confidence) => {
    switch (confidence) {
      case "high":
        return {
          bg: "bg-green/10",
          text: "text-green",
          border: "border-green/30",
          label: "High Confidence",
        };
      case "low":
        return {
          bg: "bg-red-500/10",
          text: "text-red-400",
          border: "border-red-500/30",
          label: "Low Confidence",
        };
      default:
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          border: "border-blue-500/30",
          label: "Medium Confidence",
        };
    }
  };

  // Get evaluation data from result
  const getEvaluationData = () => {
    if (!result) return null;
    if (result.isNew) return result.evaluation;
    return result.resource?.aiAnalysis;
  };

  const evaluation = getEvaluationData();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="relative">
        <div className="flex items-center gap-3 p-2 bg-light-navy rounded-lg border border-lightest-navy focus-within:border-green transition-colors">
          <FontAwesomeIcon
            icon={faYoutube}
            className="text-red-500 text-xl ml-2"
          />

          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Paste a YouTube video or playlist URL..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate font-mono text-sm py-2"
            disabled={loading}
          />

          {url && !loading && (
            <button
              onClick={handleClear}
              className="p-2 text-slate hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="px-6 py-2 bg-green text-navy font-mono font-semibold text-sm rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSearch} />
                Analyze
              </>
            )}
          </motion.button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-red-400 text-sm font-mono"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 p-6 bg-light-navy rounded-lg border border-lightest-navy"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-lightest-navy">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-green border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-heading font-semibold">
                  Analyzing Video Honestly
                </p>
                <p className="text-slate text-sm font-mono mt-1">
                  Reading comments, checking for issues, evaluating quality...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 space-y-4"
          >
            {/* Already exists message */}
            {!result.isNew && result.resource && (
              <div className="p-4 bg-green/10 border border-green/30 rounded-lg">
                <p className="text-green font-mono text-sm flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheck} />
                  {result.message}
                </p>
              </div>
            )}

            {/* Playlist Results */}
            {result.isPlaylist && result.playlistData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-light-navy rounded-lg border border-lightest-navy overflow-hidden"
              >
                {/* Playlist Header */}
                <div className="p-4 border-b border-lightest-navy">
                  <div className="flex items-start gap-4">
                    <div className="relative w-32 aspect-video rounded overflow-hidden flex-shrink-0">
                      <img
                        src={result.playlistData.thumbnail}
                        alt="Playlist thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faList}
                          className="text-white text-lg"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-green/20 text-green text-xs font-mono rounded">
                          PLAYLIST
                        </span>
                        {result.evaluation?.evaluationConfidence && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono border ${getConfidenceStyle(result.evaluation.evaluationConfidence).bg} ${getConfidenceStyle(result.evaluation.evaluationConfidence).text} ${getConfidenceStyle(result.evaluation.evaluationConfidence).border}`}
                          >
                            <FontAwesomeIcon
                              icon={faShieldAlt}
                              className="mr-1"
                            />
                            {
                              getConfidenceStyle(
                                result.evaluation.evaluationConfidence,
                              ).label
                            }
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-heading font-semibold text-lg line-clamp-2">
                        {result.playlistData.title}
                      </h3>
                      <p className="text-slate text-sm font-mono flex items-center gap-2 mt-1">
                        <FontAwesomeIcon
                          icon={faYoutube}
                          className="text-red-500"
                        />
                        {result.playlistData.channelName}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono text-light-slate">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faPlay} />
                          {result.playlistData.videoCount} videos
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faChartLine} />
                          {result.playlistData.analyzedCount} analyzed
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faEye} />
                          {result.aggregateStats?.totalViews?.toLocaleString()}{" "}
                          total views
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-center">
                      <MedhaScore
                        score={result.evaluation?.codeLearnnScore || 0}
                        size="lg"
                        showLabel={true}
                      />
                      <p className="text-xs font-mono text-slate mt-1">
                        Avg Score
                      </p>
                    </div>
                  </div>
                </div>

                {/* Playlist Summary */}
                <div className="p-4 border-b border-lightest-navy bg-navy/30">
                  <p className="text-light-slate text-sm">
                    <FontAwesomeIcon
                      icon={faInfoCircle}
                      className="text-green mr-2"
                    />
                    {result.evaluation?.summary}
                  </p>

                  {/* Non-programming warning */}
                  {result.aggregateStats?.nonProgrammingVideoCount > 0 && (
                    <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded text-xs">
                      <span className="text-orange-400">
                        ⚠️ {result.aggregateStats.nonProgrammingVideoCount} of{" "}
                        {result.playlistData.analyzedCount} analyzed videos are
                        not programming tutorials
                      </span>
                    </div>
                  )}
                </div>

                {/* Red Flags Warning */}
                {result.evaluation?.redFlags &&
                  result.evaluation.redFlags.length > 0 && (
                    <div className="border-t border-red-500/30 bg-red-500/5 p-4">
                      <h4 className="text-red-400 font-mono text-xs mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        RED FLAGS ACROSS VIDEOS
                      </h4>
                      <ul className="space-y-1">
                        {result.evaluation.redFlags.map((flag, idx) => (
                          <li
                            key={idx}
                            className="text-red-300 text-xs flex items-start gap-2"
                          >
                            <span className="text-red-500">⚠️</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Detailed Score Breakdown */}
                {result.evaluation?.breakdown && (
                  <div className="border-t border-lightest-navy p-4">
                    <h4 className="text-slate font-mono text-xs mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faChartLine} />
                      AVERAGE SCORE BREAKDOWN (across{" "}
                      {result.aggregateStats?.programmingVideoCount} programming
                      videos)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        {
                          label: "Content",
                          value: result.evaluation.breakdown.contentQuality,
                          max: 10,
                        },
                        {
                          label: "Teaching",
                          value: result.evaluation.breakdown.teachingClarity,
                          max: 10,
                        },
                        {
                          label: "Practical",
                          value: result.evaluation.breakdown.practicalValue,
                          max: 10,
                        },
                        {
                          label: "Up-to-Date",
                          value: result.evaluation.breakdown.upToDateScore,
                          max: 10,
                        },
                        {
                          label: "Sentiment",
                          value: result.evaluation.breakdown.commentSentiment,
                          max: 10,
                        },
                        {
                          label: "Engagement",
                          value: result.evaluation.breakdown.engagement,
                          max: 100,
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-lg font-mono font-bold text-white">
                            {item.value || 0}
                            <span className="text-slate text-xs">
                              /{item.max}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate font-mono">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div className="border-t border-lightest-navy p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div>
                    <h4 className="text-green font-mono text-xs mb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faThumbsUp} />
                      COMMON STRENGTHS
                    </h4>
                    <ul className="space-y-1">
                      {result.evaluation?.strengths?.map((strength, idx) => (
                        <li
                          key={idx}
                          className="text-light-slate text-xs flex items-start gap-2"
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-green mt-0.5 text-[10px]"
                          />
                          {strength}
                        </li>
                      ))}
                      {(!result.evaluation?.strengths ||
                        result.evaluation.strengths.length === 0) && (
                        <li className="text-slate text-xs italic">
                          No common strengths identified
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <h4 className="text-orange-400 font-mono text-xs mb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faThumbsDown} />
                      COMMON WEAKNESSES
                    </h4>
                    <ul className="space-y-1">
                      {result.evaluation?.weaknesses?.map((weakness, idx) => (
                        <li
                          key={idx}
                          className="text-light-slate text-xs flex items-start gap-2"
                        >
                          <FontAwesomeIcon
                            icon={faTimes}
                            className="text-orange-400 mt-0.5 text-[10px]"
                          />
                          {weakness}
                        </li>
                      ))}
                      {(!result.evaluation?.weaknesses ||
                        result.evaluation.weaknesses.length === 0) && (
                        <li className="text-slate text-xs italic">
                          No common weaknesses found
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Individual Video Results */}
                <div className="border-t border-lightest-navy p-4">
                  <h4 className="text-slate font-mono text-xs mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faPlay} />
                    ANALYZED VIDEOS (
                    {result.evaluation?.videoAnalyses?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {result.evaluation?.videoAnalyses?.map((video, idx) => (
                      <div
                        key={video.videoId}
                        className="flex items-center gap-3 p-2 bg-navy/50 rounded hover:bg-navy/70 transition-colors"
                      >
                        <span className="text-slate text-xs font-mono w-5">
                          {idx + 1}.
                        </span>
                        <div className="w-16 aspect-video rounded overflow-hidden flex-shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm line-clamp-1">
                            {video.title}
                          </p>
                          <p className="text-slate text-xs font-mono">
                            {video.duration}
                            {!video.isProgrammingTutorial && (
                              <span className="ml-2 text-orange-400">
                                • Not programming ({video.detectedCategory})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {video.isProgrammingTutorial ? (
                            <MedhaScore
                              score={video.score}
                              size="sm"
                              showLabel={false}
                            />
                          ) : (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-mono rounded">
                              N/A
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Playlist Actions */}
                <div className="border-t border-lightest-navy p-4 flex items-center justify-between gap-4">
                  <a
                    href={`https://www.youtube.com/playlist?list=${result.playlistData.playlistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm py-2 px-4"
                  >
                    <FontAwesomeIcon
                      icon={faExternalLinkAlt}
                      className="mr-2"
                    />
                    View Playlist on YouTube
                  </a>
                  <button
                    onClick={handleClear}
                    className="text-slate hover:text-white text-sm font-mono transition-colors"
                  >
                    Analyze Another
                  </button>
                </div>
              </motion.div>
            )}

            {/* Non-Programming Tutorial Warning (for single videos) */}
            {!result.isPlaylist &&
              evaluation &&
              evaluation.isProgrammingTutorial === false && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-orange-500/10 border-2 border-orange-500/50 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="text-2xl text-orange-400"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-orange-400 font-heading font-bold text-lg mb-2">
                        ⚠️ Not a Programming Tutorial
                      </h3>
                      <p className="text-light-slate text-sm mb-3">
                        This video doesn't appear to be about programming,
                        coding, or tech education.
                      </p>
                      <div className="bg-navy/50 rounded p-3 mb-3">
                        <p className="text-slate text-xs font-mono mb-1">
                          Detected Category:
                        </p>
                        <p className="text-white font-semibold capitalize">
                          {evaluation.detectedCategory ||
                            "Non-programming content"}
                        </p>
                      </div>
                      <p className="text-slate text-xs">{evaluation.summary}</p>
                      <div className="mt-4 flex gap-3">
                        <a
                          href={`https://www.youtube.com/watch?v=${
                            result.isNew
                              ? result.videoData?.youtubeId
                              : result.resource?.youtubeId
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate hover:text-white font-mono transition-colors"
                        >
                          <FontAwesomeIcon
                            icon={faExternalLinkAlt}
                            className="mr-1"
                          />
                          View on YouTube
                        </a>
                        <button
                          onClick={handleClear}
                          className="text-sm text-green hover:text-green/80 font-mono transition-colors"
                        >
                          Try Another Video
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            {/* Video Info Card - Only show for programming tutorials (single videos, not playlists) */}
            {!result.isPlaylist &&
              (!evaluation || evaluation.isProgrammingTutorial !== false) && (
                <div className="bg-light-navy rounded-lg border border-lightest-navy overflow-hidden">
                  {/* Video Header */}
                  <div className="flex flex-col md:flex-row gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="relative w-full md:w-64 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={
                          result.isNew
                            ? result.videoData?.thumbnail
                            : result.resource?.thumbnail
                        }
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-navy/90 px-2 py-1 rounded text-xs font-mono text-white">
                        {result.isNew
                          ? result.videoData?.duration
                          : result.resource?.duration}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-heading font-semibold text-lg mb-2 line-clamp-2">
                        {result.isNew
                          ? result.videoData?.title
                          : result.resource?.title}
                      </h3>
                      <p className="text-slate text-sm font-mono mb-3 flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faYoutube}
                          className="text-red-500"
                        />
                        {result.isNew
                          ? result.videoData?.channelName
                          : result.resource?.channelName}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 text-xs font-mono text-light-slate mb-3">
                        <span>
                          {(result.isNew
                            ? result.videoData?.statistics?.viewCount
                            : result.resource?.statistics?.viewCount
                          )?.toLocaleString()}{" "}
                          views
                        </span>
                        <span>
                          {(result.isNew
                            ? result.videoData?.statistics?.likeCount
                            : result.resource?.statistics?.likeCount
                          )?.toLocaleString()}{" "}
                          likes
                        </span>
                        <span>
                          {(result.isNew
                            ? result.videoData?.statistics?.commentCount
                            : result.resource?.statistics?.commentCount
                          )?.toLocaleString()}{" "}
                          comments
                        </span>
                      </div>

                      {/* Recommendation & Confidence Badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {evaluation?.recommendation && (
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-mono border ${getRecommendationStyle(evaluation.recommendation).bg} ${getRecommendationStyle(evaluation.recommendation).text} ${getRecommendationStyle(evaluation.recommendation).border}`}
                          >
                            {
                              getRecommendationStyle(evaluation.recommendation)
                                .label
                            }
                          </div>
                        )}
                        {evaluation?.evaluationConfidence && (
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-mono border ${getConfidenceStyle(evaluation.evaluationConfidence).bg} ${getConfidenceStyle(evaluation.evaluationConfidence).text} ${getConfidenceStyle(evaluation.evaluationConfidence).border}`}
                          >
                            <FontAwesomeIcon
                              icon={faShieldAlt}
                              className="text-xs"
                            />
                            {
                              getConfidenceStyle(
                                evaluation.evaluationConfidence,
                              ).label
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-center">
                      <MedhaScore
                        score={evaluation?.codeLearnnScore || 0}
                        size="lg"
                        breakdown={evaluation?.breakdown}
                      />
                      {evaluation?.qualityTier && (
                        <p
                          className={`text-xs font-mono mt-1 capitalize ${getQualityTierStyle(evaluation.qualityTier)}`}
                        >
                          {evaluation.qualityTier.replace("_", " ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AI Summary */}
                  {evaluation?.summary && (
                    <div className="border-t border-lightest-navy p-4">
                      <p className="text-light-slate text-sm leading-relaxed">
                        <FontAwesomeIcon
                          icon={faInfoCircle}
                          className="text-green mr-2"
                        />
                        {evaluation.summary}
                      </p>
                    </div>
                  )}

                  {/* Red Flags Warning */}
                  {evaluation?.redFlags && evaluation.redFlags.length > 0 && (
                    <div className="border-t border-red-500/30 bg-red-500/5 p-4">
                      <h4 className="text-red-400 font-mono text-xs mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        RED FLAGS - IMPORTANT CONCERNS
                      </h4>
                      <ul className="space-y-1">
                        {evaluation.redFlags.map((flag, idx) => (
                          <li
                            key={idx}
                            className="text-red-300 text-xs flex items-start gap-2"
                          >
                            <span className="text-red-500">⚠️</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  <div className="border-t border-lightest-navy p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div>
                      <h4 className="text-green font-mono text-xs mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faThumbsUp} />
                        STRENGTHS
                      </h4>
                      <ul className="space-y-1">
                        {evaluation?.strengths?.map((strength, idx) => (
                          <li
                            key={idx}
                            className="text-light-slate text-xs flex items-start gap-2"
                          >
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="text-green mt-0.5 text-[10px]"
                            />
                            {strength}
                          </li>
                        ))}
                        {(!evaluation?.strengths ||
                          evaluation.strengths.length === 0) && (
                          <li className="text-slate text-xs italic">
                            No specific strengths identified
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div>
                      <h4 className="text-orange-400 font-mono text-xs mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faThumbsDown} />
                        WEAKNESSES
                      </h4>
                      <ul className="space-y-1">
                        {evaluation?.weaknesses?.map((weakness, idx) => (
                          <li
                            key={idx}
                            className="text-light-slate text-xs flex items-start gap-2"
                          >
                            <FontAwesomeIcon
                              icon={faTimes}
                              className="text-orange-400 mt-0.5 text-[10px]"
                            />
                            {weakness}
                          </li>
                        ))}
                        {(!evaluation?.weaknesses ||
                          evaluation.weaknesses.length === 0) && (
                          <li className="text-slate text-xs italic">
                            No significant weaknesses found
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Audience Info */}
                  <div className="border-t border-lightest-navy p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recommended For */}
                    <div>
                      <h4 className="text-green font-mono text-xs mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faUserGraduate} />
                        RECOMMENDED FOR
                      </h4>
                      <p className="text-light-slate text-xs">
                        {evaluation?.recommendedFor || "General learners"}
                      </p>
                    </div>

                    {/* Not Recommended For */}
                    {evaluation?.notRecommendedFor && (
                      <div>
                        <h4 className="text-orange-400 font-mono text-xs mb-2 flex items-center gap-2">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          NOT IDEAL FOR
                        </h4>
                        <p className="text-light-slate text-xs">
                          {evaluation.notRecommendedFor}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Score Breakdown */}
                  {evaluation?.breakdown && (
                    <div className="border-t border-lightest-navy p-4">
                      <h4 className="text-slate font-mono text-xs mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faChartLine} />
                        DETAILED BREAKDOWN
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                          {
                            label: "Content",
                            value: evaluation.breakdown.contentQuality,
                            max: 10,
                          },
                          {
                            label: "Teaching",
                            value: evaluation.breakdown.teachingClarity,
                            max: 10,
                          },
                          {
                            label: "Practical",
                            value: evaluation.breakdown.practicalValue,
                            max: 10,
                          },
                          {
                            label: "Up-to-Date",
                            value: evaluation.breakdown.upToDateScore,
                            max: 10,
                          },
                          {
                            label: "Sentiment",
                            value: evaluation.breakdown.commentSentiment,
                            max: 10,
                          },
                          {
                            label: "Engagement",
                            value: evaluation.breakdown.engagement,
                            max: 100,
                          },
                        ].map((item, idx) => (
                          <div key={idx} className="text-center">
                            <div className="text-lg font-mono font-bold text-white">
                              {item.value || 0}
                              <span className="text-slate text-xs">
                                /{item.max}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate font-mono">
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Penalties */}
                      {(evaluation.penalties?.outdated > 0 ||
                        evaluation.penalties?.confusion > 0) && (
                        <div className="mt-3 pt-3 border-t border-lightest-navy flex gap-4 text-xs font-mono">
                          {evaluation.penalties?.outdated > 0 && (
                            <span className="text-orange-400">
                              ⚠️ Outdated penalty: -
                              {evaluation.penalties.outdated}
                            </span>
                          )}
                          {evaluation.penalties?.confusion > 0 && (
                            <span className="text-orange-400">
                              ⚠️ Confusion penalty: -
                              {evaluation.penalties.confusion}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comment Analysis */}
                  {evaluation?.commentAnalysis &&
                    evaluation.commentAnalysis.totalAnalyzed > 0 && (
                      <div className="border-t border-lightest-navy p-4">
                        <h4 className="text-slate font-mono text-xs mb-2">
                          📊 Analyzed {evaluation.commentAnalysis.totalAnalyzed}{" "}
                          comments - Sentiment:{" "}
                          <span
                            className={
                              evaluation.commentAnalysis.sentiment ===
                              "very_positive"
                                ? "text-green"
                                : evaluation.commentAnalysis.sentiment ===
                                    "positive"
                                  ? "text-green/80"
                                  : evaluation.commentAnalysis.sentiment ===
                                      "negative"
                                    ? "text-orange-400"
                                    : evaluation.commentAnalysis.sentiment ===
                                        "very_negative"
                                      ? "text-red-400"
                                      : "text-yellow-400"
                            }
                          >
                            {evaluation.commentAnalysis.sentiment
                              ?.replace("_", " ")
                              .toUpperCase()}
                          </span>
                        </h4>
                        {evaluation.commentAnalysis.concerns &&
                          evaluation.commentAnalysis.concerns.length > 0 && (
                            <div className="mt-2">
                              <p className="text-orange-400 text-[10px] font-mono mb-1">
                                Top concerns from comments:
                              </p>
                              {evaluation.commentAnalysis.concerns
                                .slice(0, 2)
                                .map((concern, idx) => (
                                  <p
                                    key={idx}
                                    className="text-slate text-[11px] italic line-clamp-1"
                                  >
                                    "{concern}"
                                  </p>
                                ))}
                            </div>
                          )}
                      </div>
                    )}

                  {/* Actions */}
                  <div className="border-t border-lightest-navy p-4 flex items-center justify-between gap-4">
                    <a
                      href={`https://www.youtube.com/watch?v=${
                        result.isNew
                          ? result.videoData?.youtubeId
                          : result.resource?.youtubeId
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm py-2 px-4"
                    >
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        className="mr-2"
                      />
                      Watch on YouTube
                    </a>

                    <button
                      onClick={handleClear}
                      className="text-slate hover:text-white text-sm font-mono transition-colors"
                    >
                      Analyze Another
                    </button>
                  </div>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder when no result */}
      {!result && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-8 bg-light-navy/50 rounded-lg border border-dashed border-lightest-navy text-center"
        >
          <FontAwesomeIcon
            icon={faChartLine}
            className="text-4xl text-green/30 mb-4"
          />
          <p className="text-slate text-sm font-mono">
            Paste any YouTube{" "}
            <span className="text-green">video or playlist</span> URL to get an
            honest quality assessment
          </p>
          <p className="text-text-tertiary text-xs font-mono mt-2">
            We analyze comments, detect outdated content, and provide critical
            feedback - not just praise
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs font-mono text-slate">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faPlay} className="text-green/50" />
              Single Videos
            </span>
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faList} className="text-green/50" />
              Playlists
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

VideoAnalyzer.propTypes = {
  onAnalysisComplete: PropTypes.func,
};

export default VideoAnalyzer;
