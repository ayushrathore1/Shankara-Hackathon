import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRocket,
  faTimes,
  faCheck,
  faClock,
  faGraduationCap,
  faSpinner,
  faCalendarAlt,
  faBolt,
  faBook,
} from "@fortawesome/free-solid-svg-icons";
import { useCareerJourney } from "../context/CareerJourneyContext";
import AIThinkingIndicator from "./AIThinkingIndicator";

const StartJourneyModal = ({ isOpen, onClose, career }) => {
  const { startJourney, hasActiveJourney, journey } = useCareerJourney();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Confirm, 2: Preferences, 3: Loading, 4: Success
  const [_isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preferences state
  const [preferences, setPreferences] = useState({
    weeklyHours: 10,
    experienceLevel: "beginner",
    learningStyle: "mixed",
  });

  const weeklyHoursOptions = [
    {
      value: 5,
      label: "5 hrs/week",
      description: "Casual pace",
      estimatedWeeks: 40,
    },
    {
      value: 10,
      label: "10 hrs/week",
      description: "Recommended",
      estimatedWeeks: 20,
    },
    {
      value: 15,
      label: "15 hrs/week",
      description: "Intensive",
      estimatedWeeks: 14,
    },
    {
      value: 20,
      label: "20+ hrs/week",
      description: "Full-time learner",
      estimatedWeeks: 10,
    },
  ];

  const experienceLevels = [
    {
      value: "beginner",
      label: "Complete Beginner",
      description: "New to programming",
    },
    {
      value: "some_experience",
      label: "Some Experience",
      description: "1-6 months of coding",
    },
    {
      value: "intermediate",
      label: "Intermediate",
      description: "6+ months, know basics",
    },
  ];

  const learningStyles = [
    { value: "videos", label: "Video Courses", icon: "🎬" },
    { value: "reading", label: "Articles & Docs", icon: "📚" },
    { value: "projects", label: "Project-Based", icon: "🛠️" },
    { value: "mixed", label: "Mixed (Recommended)", icon: "⚡" },
  ];

  const handleStartJourney = async () => {
    setStep(3);
    setIsLoading(true);
    setError(null);

    try {


      await startJourney(career, preferences);

      setStep(4);

      // Auto-navigate after success
      setTimeout(() => {
        navigate("/my-career-journey");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to start journey");
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Calculate estimate based on selection
  const selectedHoursOption = weeklyHoursOptions.find(
    (o) => o.value === preferences.weeklyHours,
  );
  const estimatedWeeks = selectedHoursOption?.estimatedWeeks || 20;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Step 1: Confirmation */}
          {step === 1 && (
            <>
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{career?.icon || "🎯"}</span>
                    <div>
                      <h2 className="text-xl font-bold text-text-main">
                        Start Your Journey?
                      </h2>
                      <p className="text-sm text-text-muted">
                        {career?.name || career?.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Existing journey warning */}
                {hasActiveJourney() && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-400">⚠️</span>
                      <div>
                        <p className="text-sm font-medium text-yellow-400">
                          You have an active journey
                        </p>
                        <p className="text-xs text-yellow-400/80 mt-1">
                          You're currently working on {journey?.career?.title}.
                          Starting a new journey will pause your current
                          progress.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-text-muted mb-6">
                  This will create your personalized learning roadmap for
                  becoming a {career?.name || career?.title}.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faCheck} className="text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-main">
                        Personalized roadmap
                      </p>
                      <p className="text-xs text-text-muted">
                        Generated based on your skill level and goals
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faCheck} className="text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-main">
                        Progress tracking
                      </p>
                      <p className="text-xs text-text-muted">
                        Track every video, article, and project
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faCheck} className="text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-main">
                        Weekly recommendations
                      </p>
                      <p className="text-xs text-text-muted">
                        Get personalized suggestions on what to learn next
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faCheck} className="text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-main">
                        Guided projects
                      </p>
                      <p className="text-xs text-text-muted">
                        Build portfolio-worthy projects with step-by-step guides
                      </p>
                    </div>
                  </div>
                </div>

                {/* Career info summary */}
                <div className="bg-bg-elevated rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">
                        ${career?.avgSalaryUSD?.toLocaleString() || "N/A"}
                      </div>
                      <div className="text-xs text-text-muted">Avg. Salary</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-secondary">
                        {career?.growthRate || "High"}
                      </div>
                      <div className="text-xs text-text-muted">Growth Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 border border-border rounded-lg text-text-muted hover:text-text-main hover:border-text-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-primary text-bg-base rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faRocket} />
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <>
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text-main">
                      Customize Your Journey
                    </h2>
                    <p className="text-sm text-text-muted">
                      Help us create the perfect roadmap for you
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Weekly Hours */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-primary" />
                    How much time can you dedicate?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {weeklyHoursOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setPreferences((p) => ({
                            ...p,
                            weeklyHours: option.value,
                          }))
                        }
                        className={`
                          p-3 rounded-lg border text-left transition-all
                          ${
                            preferences.weeklyHours === option.value
                              ? "border-primary bg-primary/10"
                              : "border-border bg-bg-elevated hover:border-text-muted"
                          }
                        `}
                      >
                        <div
                          className={`font-bold ${preferences.weeklyHours === option.value ? "text-primary" : "text-text-main"}`}
                        >
                          {option.label}
                        </div>
                        <div className="text-xs text-text-muted">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-3 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                      className="text-secondary"
                    />
                    What's your experience level?
                  </label>
                  <div className="space-y-2">
                    {experienceLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() =>
                          setPreferences((p) => ({
                            ...p,
                            experienceLevel: level.value,
                          }))
                        }
                        className={`
                          w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between
                          ${
                            preferences.experienceLevel === level.value
                              ? "border-secondary bg-secondary/10"
                              : "border-border bg-bg-elevated hover:border-text-muted"
                          }
                        `}
                      >
                        <div>
                          <div
                            className={`font-medium ${preferences.experienceLevel === level.value ? "text-secondary" : "text-text-main"}`}
                          >
                            {level.label}
                          </div>
                          <div className="text-xs text-text-muted">
                            {level.description}
                          </div>
                        </div>
                        {preferences.experienceLevel === level.value && (
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-secondary"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Learning Style */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBook} className="text-accent" />
                    Preferred learning style?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {learningStyles.map((style) => (
                      <button
                        key={style.value}
                        onClick={() =>
                          setPreferences((p) => ({
                            ...p,
                            learningStyle: style.value,
                          }))
                        }
                        className={`
                          p-3 rounded-lg border text-center transition-all
                          ${
                            preferences.learningStyle === style.value
                              ? "border-accent bg-accent/10"
                              : "border-border bg-bg-elevated hover:border-text-muted"
                          }
                        `}
                      >
                        <div className="text-2xl mb-1">{style.icon}</div>
                        <div
                          className={`text-sm font-medium ${preferences.learningStyle === style.value ? "text-accent" : "text-text-main"}`}
                        >
                          {style.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated Timeline */}
                <div className="bg-bg-elevated rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span className="text-sm">Estimated timeline</span>
                    </div>
                    <div className="text-lg font-bold text-text-main">
                      ~{estimatedWeeks} weeks
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-border rounded-lg text-text-muted hover:text-text-main hover:border-text-muted transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleStartJourney}
                  className="flex-1 py-3 bg-primary text-bg-base rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faBolt} />
                  Start My Journey
                </button>
              </div>
            </>
          )}

          {/* Step 3: Loading — AI generating roadmap */}
          {step === 3 && (
            <div className="p-12 text-center">
              <motion.div
                className="w-20 h-20 mx-auto mb-6 relative"
              >
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FontAwesomeIcon icon={faRocket} className="text-primary text-2xl" />
                </div>
              </motion.div>

              <h2 className="text-xl font-bold text-text-main mb-2">
                AI is Crafting Your Roadmap
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Personalized learning path for {career?.name}
              </p>

              <AIThinkingIndicator
                messages={[
                  "Scanning web data",
                  "Analyzing job market",
                  "Curating resources",
                  "Mapping skill gaps",
                  "Building phases",
                  "Personalizing path",
                  "Ranking projects",
                  "Structuring roadmap",
                  "Almost ready",
                ]}
                interval={2000}
              />

              <p className="text-[10px] text-text-dim font-mono mt-6">
                This may take 15-30 seconds on first generation
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-20 h-20 mx-auto mb-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faCheck} className="text-4xl" />
              </motion.div>

              <h2 className="text-2xl font-bold text-text-main mb-2">
                Journey Started! 🎉
              </h2>
              <p className="text-text-muted mb-4">
                Your roadmap to becoming a {career?.name} is ready!
              </p>
              <p className="text-sm text-primary">
                Redirecting to your journey...
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StartJourneyModal;
