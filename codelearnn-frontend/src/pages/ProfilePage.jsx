import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCog,
  faSignOutAlt,
  faCamera,
  faEnvelope,
  faShieldAlt,
  faChartLine,
  faAward,
  faFire,
  faHistory,
  faBookOpen,
  faCheckCircle,
  faLock,
  faEye,
  faEyeSlash,
  faCode,
  faTrophy,
  faSpinner,
  faCalendarAlt,
  faRoute,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useCareerJourney } from "../context/CareerJourneyContext";
import { authAPI, progressAPI } from "../services/api";

// Security Tab Component with Password Management
const SecurityTab = ({ user }) => {
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasPassword = user?.hasPassword;
  const isOAuthUser = !!(user?.googleId || user?.githubId);

  const resetForm = () => {
    setShowForm(false);
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.setPassword(newPassword);
      setSuccess("Password set successfully! You can now log in with email and password.");
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.updatePassword({
        currentPassword,
        newPassword,
      });
      setSuccess("Password updated successfully!");
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await authAPI.forgotPassword(user.email);
      setSuccess("Password reset link sent to your email!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-bento p-8"
    >
      <h3 className="text-xl font-bold text-text-main mb-6">
        Security Settings
      </h3>

      {/* Status Badge */}
      <div className={`text-sm p-4 rounded-lg mb-6 ${
        hasPassword
          ? "bg-green-500/10 border border-green-500/30 text-green-400"
          : "bg-blue-500/10 border border-blue-500/30 text-blue-400"
      }`}>
        <FontAwesomeIcon icon={hasPassword ? faCheckCircle : faShieldAlt} className="mr-2" />
        {hasPassword
          ? "Password is set. You can log in with email and password."
          : isOAuthUser
            ? `You signed in with ${user?.googleId ? "Google" : "GitHub"}. Set a password to also log in with email.`
            : "No password set yet. Set one to enable email + password login."
        }
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Success / Error Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded-lg">
            {success}
          </div>
        )}

        {!showForm ? (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
              className="btn-secondary px-6 py-2"
            >
              <FontAwesomeIcon icon={faLock} className="mr-2" />
              {hasPassword ? "Change Password" : "Set Password"}
            </button>

            {hasPassword && (
              <button
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-sm text-primary hover:text-primary-glow transition-colors px-4 py-2 disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Forgot Password?"}
              </button>
            )}
          </div>
        ) : hasPassword ? (
          /* ─── Change Password Form (needs current password) ─── */
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 pr-12 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main"
                >
                  <FontAwesomeIcon
                    icon={showCurrentPassword ? faEyeSlash : faEye}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-xs text-primary hover:text-primary-glow mt-1 disabled:opacity-50"
              >
                Forgot your password?
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 pr-12 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main"
                >
                  <FontAwesomeIcon
                    icon={showNewPassword ? faEyeSlash : faEye}
                  />
                </button>
              </div>
              <p className="text-xs text-text-dim mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* ─── Set Password Form (no current password needed) ─── */
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 pr-12 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main"
                >
                  <FontAwesomeIcon
                    icon={showNewPassword ? faEyeSlash : faEye}
                  />
                </button>
              </div>
              <p className="text-xs text-text-dim mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {isLoading ? "Setting..." : "Set Password"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
};

// Skills Card Component
const SkillsCard = ({ skills, isLoading }) => {
  if (isLoading) {
    return (
      <motion.div className="card-bento p-6">
        <div className="flex items-center justify-center h-32">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-2xl text-primary animate-spin"
          />
        </div>
      </motion.div>
    );
  }

  if (!skills || skills.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-bento p-6"
      >
        <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faCode} className="text-primary" />
          Skills
        </h3>
        <p className="text-sm text-text-muted text-center py-8">
          Complete courses and resources to build your skill profile!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-bento p-6"
    >
      <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faCode} className="text-primary" />
        Top Skills
      </h3>
      <div className="space-y-3">
        {skills.slice(0, 5).map((skill, i) => (
          <div key={skill.skillName || i}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-text-main">
                {skill.displayName || skill.skillName}
              </span>
              <span className="text-xs text-primary capitalize">
                {skill.level}
              </span>
            </div>
            <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                style={{ width: `${skill.score || 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Progress Card Component
const ProgressCard = ({ inProgress, isLoading }) => {
  if (isLoading) {
    return (
      <motion.div className="card-bento p-6">
        <div className="flex items-center justify-center h-32">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-2xl text-primary animate-spin"
          />
        </div>
      </motion.div>
    );
  }

  if (!inProgress || inProgress.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-bento p-6"
      >
        <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faBookOpen} className="text-primary" />
          Current Progress
        </h3>
        <p className="text-sm text-text-muted text-center py-8">
          Start learning to see your progress here!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card-bento p-6"
    >
      <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
        <FontAwesomeIcon icon={faBookOpen} className="text-primary" />
        Current Progress
      </h3>

      <div className="space-y-6">
        {inProgress.slice(0, 3).map((item, i) => {
          const resource = item.resource || {};
          const progressPercent = item.progress || 0;

          return (
            <div key={item._id || i}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-text-main truncate pr-4">
                  {resource.title || "Learning Resource"}
                </span>
                <span className="text-xs text-primary flex-shrink-0">
                  {progressPercent}% Complete
                </span>
              </div>
              <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    i % 2 === 0 ? "bg-primary" : "bg-secondary"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { journey } = useCareerJourney();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(null);
  const [skills, setSkills] = useState([]);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch progress stats
        const [statsRes, progressRes] = await Promise.all([
          progressAPI.getStats().catch(() => ({ data: { data: null } })),
          progressAPI.getMyProgress().catch(() => ({ data: { data: null } })),
        ]);

        setStats(statsRes.data?.data);
        setProgress(progressRes.data?.data);

        // Try to fetch skills (new API)
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/skills/top?limit=5`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            },
          );
          if (response.ok) {
            const skillsData = await response.json();
            setSkills(skillsData.data || []);
          }
        } catch (_skillErr) {
          console.log("Skills API not available yet");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Format join date
  const formatJoinDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Calculate hours from minutes
  const formatHours = (minutes) => {
    if (!minutes) return 0;
    return Math.round(minutes / 60);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: faChartLine },
    { id: "settings", label: "Settings", icon: faCog },
    { id: "security", label: "Security", icon: faShieldAlt },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Use real data or defaults
  const displayStats = {
    xp: stats?.xp || progress?.stats?.xp || 0,
    streak: stats?.currentStreak || progress?.stats?.currentStreak || 0,
    completedLessons:
      stats?.totalCompleted ||
      progress?.stats?.totalCompleted ||
      progress?.completedResources?.length ||
      0,
    hoursLearning: formatHours(
      stats?.totalTimeSpent || progress?.stats?.totalTimeSpent || 0,
    ),
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid lg:grid-cols-4 gap-8"
        >
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="card-bento p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-secondary/20"></div>

              <div className="relative z-10 mt-8">
                <div className="w-24 h-24 rounded-full bg-bg-elevated border-4 border-bg-base mx-auto mb-4 flex items-center justify-center relative group cursor-pointer">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-3xl text-text-dim"
                    />
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <FontAwesomeIcon icon={faCamera} className="text-white" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-text-main mb-1">
                  {user?.name || "User"}
                </h2>
                <p className="text-sm text-text-muted mb-4">
                  {user?.email || ""}
                </p>

                <div className="flex items-center justify-center gap-2 text-xs text-text-dim mb-6">
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    className="text-primary"
                  />
                  <span>Joined {formatJoinDate(user?.createdAt)}</span>
                </div>

                <div className="w-full h-px bg-border mb-6"></div>

                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                        activeTab === tab.id
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-text-muted hover:text-text-main hover:bg-bg-elevated"
                      }`}
                    >
                      <FontAwesomeIcon icon={tab.icon} />
                      {tab.label}
                    </button>
                  ))}

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red hover:bg-red/10 border border-transparent hover:border-red/20 transition-all mt-4"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    Sign Out
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total XP",
                      value: displayStats.xp,
                      icon: faAward,
                      color: "text-yellow-400",
                      bg: "bg-yellow-400/10",
                    },
                    {
                      label: "Day Streak",
                      value: displayStats.streak,
                      icon: faFire,
                      color: "text-orange-500",
                      bg: "bg-orange-500/10",
                    },
                    {
                      label: "Completed",
                      value: displayStats.completedLessons,
                      icon: faCheckCircle,
                      color: "text-primary",
                      bg: "bg-primary/10",
                    },
                    {
                      label: "Hours",
                      value: displayStats.hoursLearning,
                      icon: faHistory,
                      color: "text-secondary",
                      bg: "bg-secondary/10",
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="card-bento p-4 flex items-center gap-4"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl`}
                      >
                        <FontAwesomeIcon icon={stat.icon} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-text-main">
                          {isLoading ? (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="text-lg animate-spin"
                            />
                          ) : (
                            stat.value
                          )}
                        </div>
                        <div className="text-xs text-text-muted uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* ─── Learning Plan ─── */}
                {journey && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="card-bento p-6"
                  >
                    <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faRoute} className="text-primary" />
                      Learning Plan
                    </h3>

                    <div className="flex items-center gap-5">
                      {/* Progress Ring (small) */}
                      <div className="relative flex-shrink-0">
                        <svg width="72" height="72" viewBox="0 0 72 72" className="transform -rotate-90">
                          <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
                          <circle
                            cx="36" cy="36" r="30" fill="none"
                            stroke="var(--primary)" strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 30}`}
                            strokeDashoffset={`${2 * Math.PI * 30 * (1 - (journey.stats?.overallProgress || 0) / 100)}`}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-text-main">
                            {journey.stats?.overallProgress || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-text-main truncate">
                          {journey.career?.title || journey.career?.name || "My Learning Plan"}
                        </h4>
                        <p className="text-xs text-text-dim mt-0.5">
                          Phase {journey.roadmap?.currentPhaseNumber || 1} of {journey.roadmap?.phases?.length || "—"}
                          {" · "}
                          {journey.stats?.resourcesCompleted || 0} resources completed
                        </p>
                        <p className="text-xs text-text-dim">
                          Started {journey.startedAt ? new Date(journey.startedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "recently"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* Skills Card */}
                <SkillsCard skills={skills} isLoading={isLoading} />

                {/* Progress Card */}
                <ProgressCard
                  inProgress={progress?.inProgressResources}
                  isLoading={isLoading}
                />

                {/* Recent Activity */}
                {progress?.completedResources?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card-bento p-6"
                  >
                    <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faTrophy}
                        className="text-yellow-400"
                      />
                      Recently Completed
                    </h3>
                    <div className="space-y-3">
                      {progress.completedResources
                        .slice(0, 5)
                        .map((item, i) => {
                          const resource = item.resource || {};
                          return (
                            <div
                              key={item._id || i}
                              className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg"
                            >
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FontAwesomeIcon
                                  icon={faCheckCircle}
                                  className="text-primary"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-main truncate">
                                  {resource.title || "Completed Resource"}
                                </p>
                                <p className="text-xs text-text-muted">
                                  {item.completedAt
                                    ? new Date(
                                        item.completedAt,
                                      ).toLocaleDateString()
                                    : "Recently"}
                                </p>
                              </div>
                              {item.rating && (
                                <div className="text-yellow-400 text-sm">
                                  {"★".repeat(item.rating)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-bento p-8"
              >
                <h3 className="text-xl font-bold text-text-main mb-6">
                  Account Settings
                </h3>
                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name || ""}
                      className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      Email Address
                    </label>
                    <div className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-text-dim flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-text-dim"
                      />
                      <span>{user?.email || ""}</span>
                      <span className="ml-auto text-xs text-text-dim bg-bg-base px-2 py-1 rounded">
                        Cannot be changed
                      </span>
                    </div>
                    <p className="text-xs text-text-dim mt-1">
                      Email address cannot be changed for security reasons.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button className="btn-primary px-6 py-2">
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "security" && <SecurityTab user={user} />}
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default ProfilePage;
