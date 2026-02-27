import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faHistory,
  faBookmark,
  faExternalLinkAlt,
  faCheckCircle,
  faExclamationTriangle,
  faLightbulb,
  faList,
  faGraduationCap,
  faUser,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import ScoreCircle from "../components/common/ScoreCircle";
import InsightCard from "../components/cards/InsightCard";
import { freeResourcesAPI, progressAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const AnalyzerPage = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch recent analyses from database
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Get recent analyzed videos from the database
        const response = await freeResourcesAPI.getAll({
          limit: 5,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        setHistory(response.data.data || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [result]); // Refetch when new analysis is done

  const handleAnalyze = async () => {
    if (!url) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await freeResourcesAPI.analyzeVideo(url);

      if (response.data.success) {
        // The analyze endpoint returns videoData and evaluation at the top level
        const analysisData = response.data;
        const videoInfo = analysisData.videoData || {};
        const evaluation = analysisData.evaluation || {};

        setResult({
          title: videoInfo.title || "Unknown Title",
          channel:
            videoInfo.channelName ||
            videoInfo.channelTitle ||
            "Unknown Channel",
          score: evaluation.codeLearnnScore || evaluation.overallScore || 0,
          thumbnail: videoInfo.thumbnail || videoInfo.thumbnails?.high?.url,
          videoUrl: videoInfo.youtubeId
            ? `https://www.youtube.com/watch?v=${videoInfo.youtubeId}`
            : url,
          qualityTier: evaluation.qualityTier || "average",
          recommendation: evaluation.recommendation || "neutral",
          insights: {
            // Strengths as what you'll learn
            strengths: evaluation.strengths || [],
            // Weaknesses as areas not covered well
            weaknesses: evaluation.weaknesses || [],
            // Red flags if any
            redFlags: evaluation.redFlags || [],
            // Experience level derived from recommendedFor
            level: evaluation.recommendedFor
              ? evaluation.recommendedFor.toLowerCase().includes("beginner")
                ? "Beginner"
                : evaluation.recommendedFor.toLowerCase().includes("advanced")
                  ? "Advanced"
                  : evaluation.recommendedFor
                        .toLowerCase()
                        .includes("intermediate")
                    ? "Intermediate"
                    : "General"
              : "General",
            // Full summary/verdict
            verdict: evaluation.summary || "",
            // Who should watch
            recommendedFor: evaluation.recommendedFor || "",
            // Who should avoid
            notRecommendedFor: evaluation.notRecommendedFor || "",
            // Category detected
            category: evaluation.detectedCategory || videoInfo.category || "",
            // Score breakdown
            breakdown: evaluation.breakdown || {},
          },
        });
      } else {
        setError(response.data.message || "Analysis failed");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to analyze video. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const _getScoreVariant = (score) => {
    if (score >= 70) return "good";
    if (score >= 40) return "ok";
    return "bad";
  };

  const handleSaveToLibrary = async () => {
    if (!user) {
      setError("Please log in to save resources to your library");
      return;
    }

    setIsSaving(true);
    try {
      // First, add the resource to the vault if it doesn't exist
      const resourceResponse = await freeResourcesAPI.addFromAnalysis(
        result,
        result.insights.category || "programming",
        {
          domain: "frontend", // Default domain
          topic: result.insights.category || "JavaScript",
          level: result.insights.level?.toLowerCase() || "beginner",
        },
      );

      // Then save/bookmark it to user's progress
      if (resourceResponse.data.success && resourceResponse.data.data?._id) {
        await progressAPI.saveResource(resourceResponse.data.data._id);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save to library. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-mono uppercase tracking-wider mb-4">
            <FontAwesomeIcon icon={faYoutube} className="mr-2" />
            Tutorial Analyzer
          </span>
          <h1 className="text-h1 text-text-main mb-4">YouTube Analyzer</h1>
          <p className="text-body-lg text-text-muted max-w-2xl mx-auto">
            Evaluate any tutorial before you watch. Know exactly what you'll
            learn.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="card-bento p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <div className="relative flex-1 group">
                <FontAwesomeIcon
                  icon={faYoutube}
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-red transition-colors text-xl"
                />
                <input
                  type="text"
                  placeholder="Paste YouTube video URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-xl pl-16 py-4 text-lg text-text-main placeholder:text-text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!url || isAnalyzing}
                className="btn-primary px-10 py-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/40"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-3">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Analyzing...
                  </span>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSearch} className="mr-2" />
                    Analyze
                  </>
                )}
              </button>
            </div>

            {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
          </div>
        </motion.div>

        {/* Result Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            {/* Score Header */}
            <div className="card-bento p-8 mb-8 bg-gradient-to-b from-bg-elevated to-bg-surface">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Thumbnail */}
                {result.thumbnail && (
                  <div className="w-full md:w-64 flex-shrink-0">
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-full rounded-xl shadow-lg border border-border"
                    />
                  </div>
                )}

                {/* Score and Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-6 flex justify-center md:justify-start">
                    <ScoreCircle score={result.score} size="lg" />
                  </div>
                  <h2 className="text-h3 text-text-main mb-2">
                    {result.title}
                  </h2>
                  <p className="text-text-muted mb-6">
                    Channel:{" "}
                    <span className="text-text-main font-medium">
                      {result.channel}
                    </span>
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <button
                      onClick={handleSaveToLibrary}
                      disabled={isSaving || saveSuccess}
                      className={`btn-secondary flex items-center gap-2 ${saveSuccess ? "bg-primary/20 border-primary text-primary" : ""}`}
                    >
                      <FontAwesomeIcon
                        icon={saveSuccess ? faCheckCircle : faBookmark}
                      />
                      {isSaving
                        ? "Saving..."
                        : saveSuccess
                          ? "Saved!"
                          : "Save to Library"}
                    </button>
                    <a
                      href={result.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faExternalLinkAlt} />
                      Watch Video
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Verdict Summary */}
            {result.insights.verdict && (
              <div className="card-bento p-6 mb-6 border-l-4 border-primary bg-gradient-to-r from-primary/5 to-transparent">
                <p className="text-text-main leading-relaxed">
                  {result.insights.verdict}
                </p>
              </div>
            )}

            {/* Insights Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.insights.strengths.length > 0 && (
                <InsightCard
                  icon={faLightbulb}
                  title="Strengths"
                  variant="good"
                  content={
                    <ul className="space-y-2">
                      {result.insights.strengths.slice(0, 5).map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-text-muted"
                        >
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-primary mt-1 flex-shrink-0"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  }
                />
              )}

              {result.insights.weaknesses.length > 0 && (
                <InsightCard
                  icon={faExclamationTriangle}
                  title="Weaknesses"
                  variant="warning"
                  content={
                    <ul className="space-y-2">
                      {result.insights.weaknesses.slice(0, 4).map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-text-muted"
                        >
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="text-secondary mt-1 flex-shrink-0"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  }
                />
              )}

              {result.insights.redFlags &&
                result.insights.redFlags.length > 0 && (
                  <InsightCard
                    icon={faExclamationTriangle}
                    title="Red Flags"
                    variant="bad"
                    content={
                      <ul className="space-y-2">
                        {result.insights.redFlags.slice(0, 3).map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm text-red-400"
                          >
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              className="text-red-400 mt-1 flex-shrink-0"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    }
                  />
                )}

              <InsightCard
                icon={faGraduationCap}
                title="Experience Level"
                variant="default"
                content={
                  <p className="text-lg font-bold text-text-main">
                    {result.insights.level}
                  </p>
                }
              />

              {result.insights.recommendedFor && (
                <InsightCard
                  icon={faUser}
                  title="Best For"
                  variant="default"
                  content={
                    <p className="text-sm text-text-muted leading-relaxed">
                      {result.insights.recommendedFor}
                    </p>
                  }
                />
              )}

              {result.insights.notRecommendedFor && (
                <InsightCard
                  icon={faUser}
                  title="Not Recommended For"
                  variant="warning"
                  content={
                    <p className="text-sm text-text-muted leading-relaxed">
                      {result.insights.notRecommendedFor}
                    </p>
                  }
                />
              )}

              {result.insights.category && (
                <InsightCard
                  icon={faList}
                  title="Category"
                  variant="default"
                  content={
                    <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium capitalize">
                      {result.insights.category}
                    </span>
                  }
                />
              )}

              {/* Medha Score Breakdown */}
              {result.insights.breakdown &&
                Object.keys(result.insights.breakdown).length > 0 && (
                  <InsightCard
                    icon={faList}
                    title="Medha Score Breakdown"
                    variant="default"
                    content={
                      <div className="space-y-2">
                        {Object.entries(result.insights.breakdown).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-text-muted capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                              <span
                                className={`font-mono font-bold ${value >= 7 ? "text-primary" : value >= 5 ? "text-secondary" : "text-red-400"}`}
                              >
                                {value}/10
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    }
                  />
                )}
            </div>
          </motion.div>
        )}

        {/* History Section */}
        {!result && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faHistory} className="text-text-dim" />
              <h3 className="text-xl font-heading font-semibold text-text-main">
                Recent Analyses
              </h3>
            </div>

            {loadingHistory ? (
              <div className="text-center py-12">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="text-xl text-primary animate-spin"
                />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <p>
                  No analyzed videos yet. Paste a YouTube URL above to get
                  started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="group bg-bg-surface border border-border rounded-xl p-5 flex items-center justify-between hover:border-primary/30 hover:bg-bg-elevated transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`
                        w-12 h-12 rounded-xl flex items-center justify-center font-heading font-bold text-lg shadow-inner
                        ${(item.codeLearnnScore || 0) >= 70 ? "bg-primary/10 text-primary border border-primary/20" : (item.codeLearnnScore || 0) >= 40 ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-red/10 text-red border border-red/20"}
                      `}
                      >
                        {item.codeLearnnScore || 0}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-main group-hover:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-text-dim mt-1 flex items-center gap-2">
                          <span>{item.channelTitle || item.channel?.name}</span>
                        </p>
                      </div>
                    </div>
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-bg-base flex items-center justify-center text-text-dim opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        className="text-xs"
                      />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default AnalyzerPage;
