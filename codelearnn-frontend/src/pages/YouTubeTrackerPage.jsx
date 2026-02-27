import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
  faShieldAlt,
  faCheckCircle,
  faPlay,
  faPlus,
  faList,
  faTrash,
  faTimes,
  faSpinner,
  faFire,
  faClock,
  faTrophy,
  faChevronDown,
  faChevronUp,
  faExternalLinkAlt,
  faVideo,
  faCircleCheck,
  faCircle,
  faChartLine,
  faEye,
  faEyeSlash,
  faExclamationTriangle,
  faPuzzlePiece,
  faDownload,
  faRobot,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  faChrome,
} from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../context/AuthContext";
import { youtubeTrackerAPI } from "../services/api";
import AIThinkingIndicator from "../components/AIThinkingIndicator";

const YouTubeTrackerPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [consentGranted, setConsentGranted] = useState(false);

  // Input states
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Expanded playlist detail
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [playlistDetail, setPlaylistDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Consent action loading
  const [consentLoading, setConsentLoading] = useState(false);

  // Revoke modal
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  // Auto-tracked (from Chrome extension)
  const [autoTracked, setAutoTracked] = useState([]);
  const [autoTrackedPagination, setAutoTrackedPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loadingAutoTracked, setLoadingAutoTracked] = useState(false);

  useEffect(() => {
    fetchProgress();
    fetchAutoTracked(1);
  }, []);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await youtubeTrackerAPI.getProgress();
      setData(res.data?.data || null);
      setConsentGranted(res.data?.data?.consentGranted || false);
    } catch (err) {
      console.error("Failed to fetch tracker data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = async () => {
    setConsentLoading(true);
    try {
      await youtubeTrackerAPI.grantConsent();
      setConsentGranted(true);
      await fetchProgress();
      setSuccessMsg("Tracking enabled! Start adding playlists and videos.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to grant consent");
      setTimeout(() => setError(""), 4000);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleRevokeConsent = async (clearData = false) => {
    setConsentLoading(true);
    try {
      await youtubeTrackerAPI.revokeConsent(clearData);
      setConsentGranted(false);
      setShowRevokeModal(false);
      if (clearData) {
        setData(null);
      }
      await fetchProgress();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to revoke consent");
      setTimeout(() => setError(""), 4000);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleAddPlaylist = async (e) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;
    setAddingPlaylist(true);
    setError("");
    try {
      await youtubeTrackerAPI.addPlaylist(playlistUrl.trim());
      setPlaylistUrl("");
      setSuccessMsg("Playlist added successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchProgress();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add playlist");
      setTimeout(() => setError(""), 5000);
    } finally {
      setAddingPlaylist(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setAddingVideo(true);
    setError("");
    try {
      await youtubeTrackerAPI.addVideo(videoUrl.trim());
      setVideoUrl("");
      setSuccessMsg("Video added successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchProgress();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add video");
      setTimeout(() => setError(""), 5000);
    } finally {
      setAddingVideo(false);
    }
  };

  const handleToggleVideo = async (videoId, currentlyWatched) => {
    try {
      if (currentlyWatched) {
        await youtubeTrackerAPI.unwatchVideo(videoId);
      } else {
        await youtubeTrackerAPI.updateVideoProgress(videoId, 100);
      }
      // Refresh data silently
      await fetchProgress();
      // Also refresh playlist detail if open
      if (expandedPlaylist && playlistDetail) {
        const res = await youtubeTrackerAPI.getPlaylistProgress(expandedPlaylist);
        setPlaylistDetail(res.data?.data || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update video");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleRemovePlaylist = async (playlistId) => {
    try {
      await youtubeTrackerAPI.removePlaylist(playlistId);
      setSuccessMsg("Playlist removed");
      setTimeout(() => setSuccessMsg(""), 3000);
      if (expandedPlaylist === playlistId) {
        setExpandedPlaylist(null);
        setPlaylistDetail(null);
      }
      await fetchProgress();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove playlist");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      await youtubeTrackerAPI.removeVideo(videoId);
      setSuccessMsg("Video removed");
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchProgress();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove video");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleExpandPlaylist = async (playlistId) => {
    if (expandedPlaylist === playlistId) {
      setExpandedPlaylist(null);
      setPlaylistDetail(null);
      return;
    }
    setExpandedPlaylist(playlistId);
    setLoadingDetail(true);
    try {
      const res = await youtubeTrackerAPI.getPlaylistProgress(playlistId);
      setPlaylistDetail(res.data?.data || null);
    } catch (err) {
      setError("Failed to load playlist details");
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchAutoTracked = async (page = 1) => {
    setLoadingAutoTracked(true);
    try {
      const res = await youtubeTrackerAPI.getAutoTracked(page, 12);
      const d = res.data?.data || {};
      setAutoTracked(d.videos || []);
      setAutoTrackedPagination(d.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch auto-tracked:', err);
    } finally {
      setLoadingAutoTracked(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  // ──────────── Loading ────────────
  if (loading) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
        <div className="container mx-auto max-w-5xl flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AIThinkingIndicator
            messages={[
              "Loading tracker",
              "Fetching your history",
              "Calculating progress",
            ]}
            interval={1500}
          />
        </div>
      </main>
    );
  }

  // ──────────── Consent Screen ────────────
  if (!consentGranted) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base relative overflow-hidden">
        <div className="absolute inset-0 bg-tech-dashboard pointer-events-none z-0" />
        <div className="container mx-auto max-w-3xl relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center border border-red-500/20">
              <FontAwesomeIcon
                icon={faYoutube}
                className="text-3xl text-red-500"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-main mb-3">
              YouTube{" "}
              <span className="text-gradient-primary">Watch Tracker</span>
            </h1>
            <p className="text-text-muted max-w-lg mx-auto">
              Track your YouTube learning progress. Add playlists as courses,
              mark lectures as completed, and monitor your journey.
            </p>
          </motion.div>

          {/* Consent Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-bento p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon
                  icon={faShieldAlt}
                  className="text-primary text-lg"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main mb-1">
                  Your Privacy Matters
                </h2>
                <p className="text-sm text-text-muted">
                  We need your consent before tracking any YouTube activity.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                {
                  icon: faCheckCircle,
                  text: "You manually add playlists and videos you want to track",
                },
                {
                  icon: faCheckCircle,
                  text: "We only fetch public video metadata (title, duration) from YouTube",
                },
                {
                  icon: faCheckCircle,
                  text: "You control what's tracked — mark videos as watched at your own pace",
                },
                {
                  icon: faCheckCircle,
                  text: "You can revoke consent and delete all data at any time",
                },
                {
                  icon: faCheckCircle,
                  text: "No YouTube account access required — works with any public playlist",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-start gap-3"
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="text-green-400 mt-0.5 text-sm"
                  />
                  <span className="text-sm text-text-muted">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGrantConsent}
              disabled={consentLoading}
              className="btn-primary w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2"
            >
              {consentLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faPlay} />
              )}
              {consentLoading ? "Enabling..." : "Enable Tracking & Get Started"}
            </motion.button>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    );
  }

  // ──────────── Main Tracker Dashboard ────────────
  const stats = data?.stats || {};
  const playlists = data?.trackedPlaylists || [];
  const videos = data?.trackedVideos || [];

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base relative overflow-hidden">
      <div className="absolute inset-0 bg-tech-dashboard pointer-events-none z-0" />
      <div className="container mx-auto max-w-5xl relative z-10">
        {/* ─── Header ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-main mb-1">
                <FontAwesomeIcon
                  icon={faYoutube}
                  className="text-red-500 mr-3"
                />
                YouTube{" "}
                <span className="text-gradient-primary">Watch Tracker</span>
              </h1>
              <p className="text-text-muted text-sm">
                Track your learning progress across YouTube playlists & videos
              </p>
            </div>
            <button
              onClick={() => setShowRevokeModal(true)}
              className="text-xs text-text-dim hover:text-red-400 transition-colors flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5"
            >
              <FontAwesomeIcon icon={faEyeSlash} />
              Manage Consent
            </button>
          </div>
        </motion.div>

        {/* ─── Alerts ─── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {error}
              <button
                onClick={() => setError("")}
                className="ml-auto hover:text-red-300"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCheckCircle} />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Stats Bar ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          {[
            {
              icon: faList,
              label: "Playlists",
              value: stats.totalPlaylists || 0,
              sub: `${stats.completedPlaylists || 0} completed`,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
            {
              icon: faVideo,
              label: "Videos Tracked",
              value: stats.totalVideos || 0,
              sub: `${stats.videosWatched || 0} watched`,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              icon: faClock,
              label: "Watch Time",
              value: stats.totalWatchTimeMinutes
                ? `${Math.round(stats.totalWatchTimeMinutes / 60)}h ${stats.totalWatchTimeMinutes % 60}m`
                : "0m",
              sub: "estimated",
              color: "text-green-400",
              bg: "bg-green-500/10",
            },
            {
              icon: faRobot,
              label: "Auto-Tracked",
              value: stats.autoTrackedCount || 0,
              sub: "via extension",
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
            },
            {
              icon: faFire,
              label: "Streak",
              value: stats.currentStreak || 0,
              sub: `best: ${stats.longestStreak || 0}`,
              color: "text-orange-400",
              bg: "bg-orange-500/10",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="card-bento p-4 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
              >
                <FontAwesomeIcon icon={stat.icon} className={stat.color} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-lg text-text-main">
                  {stat.value}
                </div>
                <div className="text-[11px] text-text-dim">{stat.label}</div>
                <div className="text-[10px] text-text-dim">{stat.sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Add Playlist ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faList} className="text-primary text-xs" />
            Add Playlist (Course)
          </h2>
          <form
            onSubmit={handleAddPlaylist}
            className="flex gap-3"
          >
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="Paste YouTube playlist URL..."
              className="flex-1 px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-main placeholder-text-dim text-sm focus:border-primary/50 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={addingPlaylist || !playlistUrl.trim()}
              className="btn-primary px-5 py-3 flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50"
            >
              {addingPlaylist ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faPlus} />
              )}
              {addingPlaylist ? "Adding..." : "Add Playlist"}
            </button>
          </form>
        </motion.div>

        {/* ─── Add Standalone Video ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.12 }}
          className="mb-8"
        >
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faVideo} className="text-secondary text-xs" />
            Add Standalone Video
          </h2>
          <form
            onSubmit={handleAddVideo}
            className="flex gap-3"
          >
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube video URL..."
              className="flex-1 px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-main placeholder-text-dim text-sm focus:border-secondary/50 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={addingVideo || !videoUrl.trim()}
              className="btn-secondary px-5 py-3 flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50"
            >
              {addingVideo ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faPlus} />
              )}
              {addingVideo ? "Adding..." : "Add Video"}
            </button>
          </form>
        </motion.div>

        {/* ─── Tracked Playlists ─── */}
        {playlists.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faTrophy} className="text-primary text-xs" />
              Tracked Playlists ({playlists.length})
            </h2>

            <div className="space-y-4">
              {playlists.map((pl) => (
                <div key={pl.playlistId} className="card-bento overflow-hidden">
                  {/* Playlist header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-bg-elevated/30 transition-colors"
                    onClick={() => handleExpandPlaylist(pl.playlistId)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      {pl.thumbnailUrl && (
                        <img
                          src={pl.thumbnailUrl}
                          alt={pl.title}
                          className="w-28 h-16 rounded-lg object-cover flex-shrink-0 border border-border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text-main truncate">
                            {pl.title}
                          </h3>
                          {pl.isCompleted && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/20 text-green-400 uppercase whitespace-nowrap">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-dim mb-2">
                          {pl.channelTitle} • {pl.totalVideos} videos
                        </p>

                        {/* Progress bar */}
                        <div className="w-full bg-bg-elevated rounded-full h-2 mb-1">
                          <motion.div
                            className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${pl.completionPercentage || 0}%`,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-text-dim">
                          <span>
                            {pl.videosWatched || 0}/{pl.totalVideos} watched
                          </span>
                          <span>{pl.completionPercentage || 0}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlaylist(pl.playlistId);
                          }}
                          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                          title="Remove playlist"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                        <FontAwesomeIcon
                          icon={
                            expandedPlaylist === pl.playlistId
                              ? faChevronUp
                              : faChevronDown
                          }
                          className="text-text-dim text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded: video list */}
                  <AnimatePresence>
                    {expandedPlaylist === pl.playlistId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border px-5 py-4">
                          {loadingDetail ? (
                            <div className="flex items-center justify-center py-6 text-text-dim text-sm">
                              <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                className="mr-2"
                              />
                              Loading videos...
                            </div>
                          ) : playlistDetail?.videos?.length > 0 ? (
                            <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                              {playlistDetail.videos.map((vid, idx) => (
                                <div
                                  key={vid.videoId || idx}
                                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                                    vid.watched
                                      ? "bg-green-500/5 border border-green-500/10"
                                      : "hover:bg-bg-elevated/50"
                                  }`}
                                >
                                  {/* Checkbox */}
                                  <button
                                    onClick={() =>
                                      handleToggleVideo(
                                        vid.videoId,
                                        vid.watched
                                      )
                                    }
                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                                      vid.watched
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-bg-elevated text-text-dim hover:text-primary hover:bg-primary/10"
                                    }`}
                                  >
                                    <FontAwesomeIcon
                                      icon={
                                        vid.watched
                                          ? faCircleCheck
                                          : faCircle
                                      }
                                      className="text-xs"
                                    />
                                  </button>

                                  {/* Position */}
                                  <span className="text-[10px] font-mono text-text-dim w-5 text-center flex-shrink-0">
                                    {idx + 1}
                                  </span>

                                  {/* Title */}
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm truncate ${
                                        vid.watched
                                          ? "text-text-dim line-through"
                                          : "text-text-main"
                                      }`}
                                    >
                                      {vid.title}
                                    </p>
                                    {vid.duration && (
                                      <span className="text-[10px] text-text-dim">
                                        {vid.duration}
                                      </span>
                                    )}
                                  </div>

                                  {/* Open in YT */}
                                  <a
                                    href={`https://www.youtube.com/watch?v=${vid.videoId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-7 h-7 rounded-md bg-bg-elevated text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center flex-shrink-0"
                                    title="Watch on YouTube"
                                  >
                                    <FontAwesomeIcon
                                      icon={faExternalLinkAlt}
                                      className="text-[10px]"
                                    />
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-sm text-text-dim py-4">
                              No videos found in this playlist
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── Standalone Videos ─── */}
        {videos.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faVideo}
                className="text-secondary text-xs"
              />
              Standalone Videos ({videos.length})
            </h2>

            <div className="card-bento p-5">
              <div className="space-y-2">
                {videos.map((vid) => (
                  <div
                    key={vid.videoId}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      vid.watched
                        ? "bg-green-500/5 border border-green-500/10"
                        : "hover:bg-bg-elevated/50 border border-transparent"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() =>
                        handleToggleVideo(vid.videoId, vid.watched)
                      }
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        vid.watched
                          ? "bg-green-500/20 text-green-400"
                          : "bg-bg-elevated text-text-dim hover:text-primary hover:bg-primary/10"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={vid.watched ? faCircleCheck : faCircle}
                        className="text-sm"
                      />
                    </button>

                    {/* Thumbnail */}
                    {vid.thumbnailUrl && (
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        className="w-16 h-10 rounded-md object-cover flex-shrink-0 border border-border"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          vid.watched
                            ? "text-text-dim line-through"
                            : "text-text-main"
                        }`}
                      >
                        {vid.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-text-dim">
                        {vid.channelTitle && <span>{vid.channelTitle}</span>}
                        {vid.duration && <span>• {vid.duration}</span>}
                        {vid.watchedAt && (
                          <span>
                            • Watched{" "}
                            {new Date(vid.watchedAt).toLocaleDateString(
                              "en",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`https://www.youtube.com/watch?v=${vid.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-md bg-bg-elevated text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                        title="Watch on YouTube"
                      >
                        <FontAwesomeIcon
                          icon={faExternalLinkAlt}
                          className="text-[10px]"
                        />
                      </a>
                      <button
                        onClick={() => handleRemoveVideo(vid.videoId)}
                        className="w-7 h-7 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                        title="Remove video"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ─── Auto-Tracked History (Chrome Extension) ─── */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.22 }}
          className="mb-8"
        >
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faRobot} className="text-cyan-400 text-xs" />
            Auto-Tracked History
            {autoTrackedPagination.total > 0 && (
              <span className="text-cyan-400">({autoTrackedPagination.total})</span>
            )}
          </h2>

          {/* Extension Install CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-bento p-5 mb-5 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 border-cyan-500/15"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faPuzzlePiece} className="text-cyan-400 text-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-main mb-1">
                  Medha Chrome Extension
                </h3>
                <p className="text-xs text-text-muted mb-3">
                  Install our Chrome extension to automatically track every YouTube video you watch — across any device using Chrome. No manual URL pasting needed.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                    <FontAwesomeIcon icon={faChrome} />
                    Load via chrome://extensions (Developer Mode)
                  </span>
                  <span className="text-[10px] text-text-dim">
                    Extension folder: <code className="text-cyan-400/70">medha-extension/</code>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Auto-tracked video list */}
          {loadingAutoTracked ? (
            <div className="card-bento p-8 flex items-center justify-center text-text-dim text-sm">
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Loading auto-tracked history...
            </div>
          ) : autoTracked.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {autoTracked.map((vid) => (
                  <motion.div
                    key={vid.videoId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-bento overflow-hidden group"
                  >
                    {/* Thumbnail */}
                    <div className="relative">
                      <img
                        src={vid.thumbnailUrl || `https://i.ytimg.com/vi/${vid.videoId}/mqdefault.jpg`}
                        alt={vid.title}
                        className="w-full h-32 object-cover"
                      />
                      {/* Progress overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-base/50">
                        <div
                          className="h-full bg-cyan-400 transition-all"
                          style={{ width: `${vid.watchProgress || 0}%` }}
                        />
                      </div>
                      {/* Duration badge */}
                      {vid.duration && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/80 text-white">
                          {vid.duration}
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <a
                        href={`https://www.youtube.com/watch?v=${vid.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-text-main hover:text-cyan-400 transition-colors line-clamp-2 mb-1"
                      >
                        {vid.title}
                      </a>
                      {vid.channelTitle && (
                        <p className="text-[11px] text-text-dim mb-2">{vid.channelTitle}</p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-text-dim">
                        <span>{vid.watchProgress || 0}% watched</span>
                        <span>
                          {vid.lastUpdatedAt
                            ? new Date(vid.lastUpdatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {autoTrackedPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => fetchAutoTracked(autoTrackedPagination.page - 1)}
                    disabled={autoTrackedPagination.page <= 1}
                    className="w-9 h-9 rounded-lg bg-bg-elevated border border-border text-text-dim hover:text-text-main hover:border-primary/50 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                  </button>
                  <span className="text-xs text-text-muted">
                    Page {autoTrackedPagination.page} of {autoTrackedPagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchAutoTracked(autoTrackedPagination.page + 1)}
                    disabled={autoTrackedPagination.page >= autoTrackedPagination.totalPages}
                    className="w-9 h-9 rounded-lg bg-bg-elevated border border-border text-text-dim hover:text-text-main hover:border-primary/50 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card-bento p-8 text-center border-dashed border-2 border-cyan-500/15">
              <FontAwesomeIcon icon={faRobot} className="text-3xl text-cyan-500/30 mb-3" />
              <p className="text-sm text-text-muted">
                No auto-tracked videos yet. Install the Chrome extension and start watching YouTube!
              </p>
            </div>
          )}
        </motion.section>

        {/* ─── Empty State ─── */}
        {playlists.length === 0 && videos.length === 0 && autoTracked.length === 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.15 }}
            className="card-bento p-10 text-center border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
          >
            <FontAwesomeIcon
              icon={faYoutube}
              className="text-4xl text-red-500/40 mb-4"
            />
            <h3 className="text-lg font-semibold text-text-main mb-2">
              No Playlists or Videos Yet
            </h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              Paste a YouTube playlist URL above to start tracking it as a
              course, add individual videos, or install the Chrome extension for automatic tracking.
            </p>
          </motion.div>
        )}

        {/* ─── Revoke Consent Modal ─── */}
        <AnimatePresence>
          {showRevokeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowRevokeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="card-bento p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="text-red-400"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-text-main">
                    Manage Tracking Consent
                  </h3>
                </div>

                <p className="text-sm text-text-muted mb-6">
                  You can disable tracking while keeping your data, or disable
                  tracking and delete all your tracked playlists and videos.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleRevokeConsent(false)}
                    disabled={consentLoading}
                    className="w-full py-3 px-4 rounded-xl border border-border bg-bg-elevated text-text-main text-sm hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEyeSlash} />
                    Disable Tracking (Keep Data)
                  </button>
                  <button
                    onClick={() => handleRevokeConsent(true)}
                    disabled={consentLoading}
                    className="w-full py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Disable & Delete All Data
                  </button>
                  <button
                    onClick={() => setShowRevokeModal(false)}
                    className="w-full py-2.5 text-sm text-text-dim hover:text-text-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default YouTubeTrackerPage;
