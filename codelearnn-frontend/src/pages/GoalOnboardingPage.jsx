import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowLeft,
  faRocket,
  faBullseye,
  faClock,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { authAPI, careerAPI, gamificationAPI } from '../services/api';

const EXPERIENCE_LEVELS = [
  { value: 'absolute-beginner', label: 'Complete Beginner', desc: 'Never coded before', icon: '🌱' },
  { value: 'beginner', label: 'Beginner', desc: 'Know basics, building first projects', icon: '🌿' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-2 years, comfortable with a stack', icon: '🌲' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years, looking to specialize', icon: '🏔️' },
];

const WEEKLY_HOURS = [
  { value: 5,  label: '5 hrs/week', desc: 'Casual learner', icon: '🐢' },
  { value: 10, label: '10 hrs/week', desc: 'Steady pace', icon: '🚶' },
  { value: 20, label: '20 hrs/week', desc: 'Serious commitment', icon: '🏃' },
  { value: 40, label: '40 hrs/week', desc: 'Full-time grind', icon: '🚀' },
];

const POPULAR_GOALS = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Mobile App Developer',
  'DevOps Engineer',
  'Cloud Architect',
  'Cybersecurity Analyst',
  'Game Developer',
  'UI/UX Designer',
  'Blockchain Developer',
];

const GoalOnboardingPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [goalTitle, setGoalTitle] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(10);

  const STEPS = [
    { title: 'Your Dream Role', icon: faBullseye },
    { title: 'Experience Level', icon: faGraduationCap },
    { title: 'Time Commitment', icon: faClock },
    { title: 'Launch', icon: faRocket },
  ];

  const selectedGoal = goalTitle || customGoal;

  const canProceed = () => {
    switch (step) {
      case 0: return selectedGoal.trim().length >= 2;
      case 1: return experienceLevel !== '';
      case 2: return weeklyHours > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1 && canProceed()) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Update user profile with career goal and preferences
      await authAPI.updateDetails({
        careerGoal: {
          title: selectedGoal,
          targetRole: selectedGoal
        },
        learningPreferences: {
          experienceLevel: experienceLevel
        },
        onboarding: {
          completed: true,
          currentStep: 4,
          completedAt: new Date().toISOString()
        }
      });

      // 2. Record activity for streak
      try {
        await gamificationAPI.heartbeat();
      } catch (e) {
        // Non-critical
      }

      // 3. Update local user state
      updateUser({
        ...user,
        careerGoal: { title: selectedGoal, targetRole: selectedGoal },
        learningPreferences: { ...user?.learningPreferences, experienceLevel },
        onboarding: { completed: true }
      });

      // Navigate to career explorer to start their journey
      navigate('/career-explorer', { 
        state: { fromOnboarding: true, keyword: selectedGoal }
      });
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await authAPI.updateDetails({
        onboarding: { completed: true, currentStep: 0, completedAt: new Date().toISOString() }
      });
      updateUser({ ...user, onboarding: { completed: true } });
    } catch (e) {
      // Non-critical
    }
    navigate('/dashboard');
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -200 : 200, opacity: 0 })
  };

  return (
    <main className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 py-8 selection:bg-primary selection:text-black">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-tech-auth" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="font-heading font-bold text-3xl text-text-main">
            <span className="text-primary">&lt;</span>
            Medha
            <span className="text-secondary">/&gt;</span>
          </h2>
          <p className="text-text-muted mt-1">Let's personalize your journey</p>
        </motion.div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step
                    ? 'bg-gradient-to-r from-primary to-secondary'
                    : 'bg-bg-surface border border-border'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step indicator */}
        <div className="text-center mb-6">
          <span className="text-text-dim text-sm">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="bg-bg-surface border border-border rounded-2xl p-8 shadow-xl"
        >
          <AnimatePresence mode="wait" custom={1}>
            {/* STEP 0: Dream Role */}
            {step === 0 && (
              <motion.div
                key="step0"
                variants={slideVariants}
                custom={1}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary text-xl mb-3">
                    <FontAwesomeIcon icon={faBullseye} />
                  </div>
                  <h3 className="text-h3 text-text-main">What's your dream role?</h3>
                  <p className="text-text-muted text-sm mt-1">Pick one or type your own goal</p>
                </div>

                {/* Popular goals grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {POPULAR_GOALS.map(goal => (
                    <button
                      key={goal}
                      onClick={() => { setGoalTitle(goal); setCustomGoal(''); }}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                        goalTitle === goal
                          ? 'bg-primary text-black shadow-lg shadow-primary/20'
                          : 'bg-bg-elevated text-text-muted hover:text-text-main hover:bg-bg-base border border-border'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div className="relative mt-4">
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => { setCustomGoal(e.target.value); setGoalTitle(''); }}
                    placeholder="Or type your own career goal..."
                    className="w-full px-4 py-3 bg-bg-base border border-border rounded-xl text-text-main placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 1: Experience Level */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                custom={1}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary text-xl mb-3">
                    <FontAwesomeIcon icon={faGraduationCap} />
                  </div>
                  <h3 className="text-h3 text-text-main">What's your current level?</h3>
                  <p className="text-text-muted text-sm mt-1">We'll tailor content to match your skills</p>
                </div>

                <div className="space-y-3">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setExperienceLevel(level.value)}
                      className={`w-full px-5 py-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                        experienceLevel === level.value
                          ? 'bg-primary/10 border-2 border-primary shadow-lg shadow-primary/10'
                          : 'bg-bg-base border border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="text-2xl">{level.icon}</span>
                      <div>
                        <div className="font-semibold text-text-main">{level.label}</div>
                        <div className="text-sm text-text-muted">{level.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Weekly Hours */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                custom={1}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary text-xl mb-3">
                    <FontAwesomeIcon icon={faClock} />
                  </div>
                  <h3 className="text-h3 text-text-main">How much time can you invest?</h3>
                  <p className="text-text-muted text-sm mt-1">Be realistic — consistency beats intensity</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {WEEKLY_HOURS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setWeeklyHours(opt.value)}
                      className={`px-5 py-5 rounded-xl text-center transition-all ${
                        weeklyHours === opt.value
                          ? 'bg-primary/10 border-2 border-primary shadow-lg shadow-primary/10'
                          : 'bg-bg-base border border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{opt.icon}</span>
                      <div className="font-semibold text-text-main text-lg">{opt.label}</div>
                      <div className="text-sm text-text-muted">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Summary & Launch */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                custom={1}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary text-xl mb-3">
                    <FontAwesomeIcon icon={faRocket} />
                  </div>
                  <h3 className="text-h3 text-text-main">Ready to launch!</h3>
                  <p className="text-text-muted text-sm mt-1">Here's your personalized plan</p>
                </div>

                {/* Summary cards */}
                <div className="space-y-3 mb-6">
                  <div className="bg-bg-base border border-border rounded-xl p-4 flex items-center gap-4">
                    <span className="text-xl">🎯</span>
                    <div>
                      <div className="text-xs text-text-dim uppercase tracking-wider">Goal</div>
                      <div className="text-text-main font-semibold">{selectedGoal}</div>
                    </div>
                  </div>
                  <div className="bg-bg-base border border-border rounded-xl p-4 flex items-center gap-4">
                    <span className="text-xl">
                      {EXPERIENCE_LEVELS.find(l => l.value === experienceLevel)?.icon || '🌱'}
                    </span>
                    <div>
                      <div className="text-xs text-text-dim uppercase tracking-wider">Level</div>
                      <div className="text-text-main font-semibold">
                        {EXPERIENCE_LEVELS.find(l => l.value === experienceLevel)?.label || 'Beginner'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-bg-base border border-border rounded-xl p-4 flex items-center gap-4">
                    <span className="text-xl">
                      {WEEKLY_HOURS.find(h => h.value === weeklyHours)?.icon || '🚶'}
                    </span>
                    <div>
                      <div className="text-xs text-text-dim uppercase tracking-wider">Commitment</div>
                      <div className="text-text-main font-semibold">{weeklyHours} hours/week</div>
                    </div>
                  </div>
                </div>

                {/* What happens next */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-text-muted">
                  <p className="font-semibold text-primary mb-1">What happens next?</p>
                  <p>We'll take you to the Career Explorer where AI will generate a personalized roadmap for <span className="text-text-main font-medium">{selectedGoal}</span> based on your level and pace.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-lg mt-4"
            >
              {error}
            </motion.div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <div>
              {step > 0 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-text-muted hover:text-text-main transition-colors text-sm"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="text-text-dim hover:text-text-muted transition-colors text-sm"
                >
                  Skip for now
                </button>
              )}
            </div>

            <div>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="btn-primary px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_var(--primary-glow)] hover:shadow-[0_0_30px_-5px_var(--primary-glow)]"
                >
                  Continue
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="btn-primary px-8 py-3 disabled:opacity-50 shadow-[0_0_20px_-5px_var(--primary-glow)] hover:shadow-[0_0_30px_-5px_var(--primary-glow)]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Setting up...
                    </span>
                  ) : (
                    <>
                      Launch My Journey
                      <FontAwesomeIcon icon={faRocket} className="ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Step labels */}
        <div className="flex justify-between mt-4 px-2">
          {STEPS.map((s, i) => (
            <div key={i} className={`text-xs text-center transition-colors ${i <= step ? 'text-primary' : 'text-text-dim'}`}>
              <FontAwesomeIcon icon={s.icon} className="block mx-auto mb-0.5" />
              {s.title}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default GoalOnboardingPage;
