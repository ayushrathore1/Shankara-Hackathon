import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faSpinner, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { useMedhaFlow } from '../../context/MedhaFlowContext';
import { medhaFlowAPI } from '../../services/api';

// Questions with dimension metadata — text-based (no MCQ)
const getQuestions = (degree) => {
  const isCommerce = ['commerce', 'management'].includes(degree);
  const isTech = ['engineering', 'cs-it'].includes(degree);
  const isCreative = ['design', 'arts'].includes(degree);
  const isScience = ['science', 'medical'].includes(degree);

  return [
    {
      id: 'q1',
      dimension: 'cognitive_style',
      question: "When you run into a tough problem, what do you usually do?",
      placeholder: isCommerce
        ? "Do you analyse the numbers, brainstorm with someone, just start trying things...?"
        : isTech
          ? "Do you debug step by step, search Stack Overflow, rethink the approach...?"
          : "Be specific — what's your actual process?",
      hint: "Think about a real problem you faced recently.",
    },
    {
      id: 'q2',
      dimension: 'engagement_driver',
      question: isCommerce
        ? "What kind of work — in business or beyond — makes you completely lose track of time?"
        : isTech
          ? "What kind of work — coding, building, or anything else — makes you lose track of time?"
          : isCreative
            ? "What kind of creative or other work makes you completely lose track of time?"
            : isScience
              ? "What kind of research, analysis, or other work makes you lose track of time?"
              : "What kind of work makes you completely lose track of time?",
      placeholder: "Think about when you forgot to check your phone...",
      hint: "It doesn't have to be related to your degree.",
    },
    {
      id: 'q3',
      dimension: 'work_environment',
      question: "What would your ideal work situation look like?",
      placeholder: "Structure? Freedom? Team? Solo? Describe your dream setup...",
      hint: "Think about when you do your best work.",
    },
    {
      id: 'q4',
      dimension: 'resilience_style',
      question: "When something you tried fails or doesn't go as planned, what happens?",
      placeholder: "Be honest — there's no wrong answer here...",
      hint: "Think about a real setback you experienced.",
    },
    {
      id: 'q5',
      dimension: 'perceived_identity',
      question: "What do people who know you well say about you?",
      placeholder: isCommerce
        ? "Are you the sharp one? The creative one? The reliable one?"
        : isCreative
          ? "Are you the one with the eye? The idea person? The finisher?"
          : "What's your honest answer — strengths and all...",
      hint: "What would your close friends say if asked?",
    },
  ];
};

const TOTAL_STEPS = 6; // 5 text + 1 self-description

const LOADING_TEXTS = [
  "Reading your answers...",
  "Finding what drives you...",
  "Matching your thinking style to real careers...",
  "Almost there...",
];

const FlowQuizPage = () => {
  const navigate = useNavigate();
  const { userName, userDegree, quizAnswers, setQuizAnswers, setCareerResults, setCareerDomains } = useMedhaFlow();
  const [step, setStep] = useState(0); // 0-4 = text questions, 5 = Q6
  const [answerText, setAnswerText] = useState('');
  const [q6Text, setQ6Text] = useState('');
  const [q6Error, setQ6Error] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState(0);

  // Follow-up state
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupData, setFollowupData] = useState(null); // { followup, placeholder }
  const [followupText, setFollowupText] = useState('');
  const [followupLoading, setFollowupLoading] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false); // true after clicking Next on main answer

  const textareaRef = useRef(null);
  const followupRef = useRef(null);
  const timeoutRef = useRef(null);

  const QUESTIONS = getQuestions(userDegree?.degree);

  useEffect(() => {
    if (!userName) navigate('/name', { replace: true });
  }, [userName, navigate]);

  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => setLoadingText(p => (p + 1) % LOADING_TEXTS.length), 900);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // Auto-focus textarea on step change
  useEffect(() => {
    if (step < 5 && !answerSubmitted) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [step, answerSubmitted]);

  const resetStepState = () => {
    setAnswerText('');
    setShowFollowup(false);
    setFollowupData(null);
    setFollowupText('');
    setFollowupLoading(false);
    setAnswerSubmitted(false);
    setError('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Called when user clicks "Next →" on main answer
  const handleAnswerSubmit = useCallback(() => {
    if (answerText.trim().length < 15) {
      setError('Tell us a bit more — this helps us match you better');
      return;
    }
    setError('');
    setAnswerSubmitted(true);

    const q = QUESTIONS[step];

    // Store the main answer immediately
    setQuizAnswers(prev => ({
      ...prev,
      [q.id]: {
        ...prev[q.id],
        text: answerText.trim(),
        dimension: q.dimension,
      },
    }));

    // Fire follow-up API in background
    setFollowupLoading(true);
    const startTime = Date.now();

    medhaFlowAPI.quizFollowup({
      dimension: q.dimension,
      answer_text: answerText.trim(),
      question_number: step + 1,
    }).then(res => {
      const data = res.data?.data;
      if (data?.followup) {
        setFollowupData(data);
        setShowFollowup(true);
        setFollowupLoading(false);
        setTimeout(() => followupRef.current?.focus(), 200);
      } else {
        // No useful data — auto-advance
        advanceToNext('');
      }
    }).catch(() => {
      // Timeout or error — auto-advance silently
      advanceToNext('');
    });

    // Hard 2s timeout — if API hasn't resolved, advance
    timeoutRef.current = setTimeout(() => {
      if (!followupData) {
        advanceToNext('');
      }
    }, 2000);
  }, [answerText, step, QUESTIONS, setQuizAnswers]);

  // Advance to the next question
  const advanceToNext = useCallback((followupAnswer) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const q = QUESTIONS[step];
    // Store follow-up data if available
    setQuizAnswers(prev => ({
      ...prev,
      [q.id]: {
        ...prev[q.id],
        text: prev[q.id]?.text || answerText.trim(),
        dimension: q.dimension,
        followup_q: followupData?.followup || '',
        followup_a: followupAnswer || '',
      },
    }));

    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
      resetStepState();
    } else {
      // Go to Q6
      setStep(5);
      resetStepState();
    }
  }, [step, answerText, followupData, QUESTIONS, setQuizAnswers]);

  const handleFollowupSkip = () => {
    advanceToNext('');
  };

  const handleFollowupContinue = () => {
    advanceToNext(followupText.trim());
  };

  const handleQ6Submit = () => {
    if (q6Text.trim().length < 30) {
      setQ6Error('A little more detail helps us a lot ↑');
      return;
    }
    const finalAnswers = {
      ...quizAnswers,
      q6: q6Text.trim(),
    };
    setQuizAnswers(finalAnswers);
    submitToAI(finalAnswers);
  };

  const submitToAI = async (answers) => {
    setIsSubmitting(true);
    const startTime = Date.now();
    try {
      const enrichedAnswers = {
        ...answers,
        _degree: userDegree?.degreeLabel || '',
        _year: userDegree?.year || '',
      };
      const res = await medhaFlowAPI.recommend(enrichedAnswers);
      setCareerResults(res.data?.data?.careers || []);
      setCareerDomains(res.data?.data?.domains || null);
      const elapsed = Date.now() - startTime;
      setTimeout(() => navigate('/results'), Math.max(0, 4000 - elapsed));
    } catch (err) {
      console.error('Recommend failed:', err);
      setIsSubmitting(false);
      setError('Something went wrong. Please try again.');
    }
  };

  // ─── Loading Screen ───
  if (isSubmitting) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
          </div>
          <AnimatePresence mode="wait">
            <motion.p key={loadingText} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-text-muted text-lg">
              {LOADING_TEXTS[loadingText]}
            </motion.p>
          </AnimatePresence>
          <div className="mt-8 w-64 h-1.5 bg-bg-elevated rounded-full mx-auto overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 4, ease: 'easeInOut' }} />
          </div>
        </motion.div>
      </main>
    );
  }

  // ─── Question 6 — Self Description ───
  if (step === 5) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-primary">Question 6 of 6</span>
            <div className="flex items-center gap-4">
              <button onClick={() => { setStep(4); resetStepState(); }} className="text-text-dim text-sm hover:text-text-muted inline-flex items-center gap-2 transition-colors">
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
              <span className="text-xs text-text-dim">{userName}</span>
            </div>
            </div>
            <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" animate={{ width: '100%' }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
            <h2 className="text-2xl font-heading font-bold text-text-main mb-2 leading-snug">
              Last one — describe yourself in 2-3 sentences.
            </h2>
            <p className="text-text-muted text-base mb-8 leading-relaxed">
              Who are you, what's your background, and what matters most to you in life?
            </p>

            <textarea
              value={q6Text}
              onChange={(e) => { setQ6Text(e.target.value); setQ6Error(''); }}
              autoFocus
              placeholder="Be honest — this is the most important question we ask."
              rows={4}
              className="w-full px-5 py-4 bg-bg-surface border border-border rounded-xl text-text-main placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none text-sm leading-relaxed transition-all"
            />

            <div className="flex items-center justify-between mt-2 mb-4">
              <div>
                {q6Error && (
                  <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-yellow-400 text-xs">
                    {q6Error}
                  </motion.p>
                )}
              </div>
              <span className="text-xs text-text-dim">{q6Text.length} chars</span>
            </div>

            <button
              onClick={handleQ6Submit}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-bg-base font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              Find My Path → <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Questions 1-5 — Text Input + AI Follow-up ───
  const q = QUESTIONS[step];

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => step > 0 ? setStep(s => s - 1) || resetStepState() : navigate('/name')} className="text-text-dim text-sm hover:text-text-muted inline-flex items-center gap-2 transition-colors">
              <FontAwesomeIcon icon={faArrowLeft} /> Back
            </button>
            <span className="text-xs text-text-dim">{userName}</span>
          </div>
          <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
            <h2 className="text-2xl font-heading font-bold text-text-main mb-3 leading-snug">{q.question}</h2>
            <p className="text-text-dim text-xs mb-6">{q.hint}</p>

            {/* Main answer textarea */}
            <textarea
              ref={textareaRef}
              value={answerText}
              onChange={(e) => { setAnswerText(e.target.value); setError(''); }}
              placeholder={q.placeholder}
              rows={3}
              disabled={answerSubmitted}
              className={`w-full px-5 py-4 bg-bg-surface border rounded-xl text-text-main placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none text-sm leading-relaxed transition-all ${
                answerSubmitted ? 'border-primary/30 bg-primary/5 opacity-80' : 'border-border'
              }`}
            />

            <div className="flex items-center justify-between mt-2 mb-3">
              <div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                {!error && !answerSubmitted && answerText.length > 0 && answerText.length < 15 && (
                  <p className="text-text-dim text-xs">{15 - answerText.length} more characters needed</p>
                )}
              </div>
              <span className="text-xs text-text-dim">{answerText.length} chars</span>
            </div>

            {/* Next button — only when answer not yet submitted */}
            {!answerSubmitted && (
              <button
                onClick={handleAnswerSubmit}
                disabled={answerText.trim().length < 15}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-bg-base font-bold text-sm rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                Next <FontAwesomeIcon icon={faArrowRight} />
              </button>
            )}

            {/* Brief loading state while waiting for follow-up */}
            <AnimatePresence>
              {answerSubmitted && !showFollowup && followupLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-center gap-2 text-text-dim text-xs"
                >
                  <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-[10px]" />
                  <span>Just a moment...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── AI Follow-up Card ─── */}
            <AnimatePresence>
              {showFollowup && followupData && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-5"
                >
                  <div className="border-l-2 border-primary/30 pl-4 ml-1">
                    {/* Follow-up question */}
                    <div className="flex items-start gap-2 mb-3">
                      <FontAwesomeIcon icon={faCommentDots} className="text-primary/50 text-xs mt-1 flex-shrink-0" />
                      <p className="text-text-muted text-sm italic leading-relaxed">
                        {followupData.followup}
                      </p>
                    </div>

                    {/* Follow-up textarea */}
                    <textarea
                      ref={followupRef}
                      value={followupText}
                      onChange={(e) => setFollowupText(e.target.value.slice(0, 200))}
                      placeholder={followupData.placeholder}
                      rows={2}
                      className="w-full px-4 py-3 bg-transparent border-0 border-b border-border/40 text-text-main placeholder:text-text-dim/50 focus:border-primary/40 outline-none resize-none text-sm leading-relaxed transition-all"
                    />

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2">
                      {/* Continue button — appears after 10 chars */}
                      <div>
                        <AnimatePresence>
                          {followupText.length >= 10 && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              onClick={handleFollowupContinue}
                              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-xs rounded-lg transition-all border border-primary/20 flex items-center gap-1.5"
                            >
                              Continue <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Skip link */}
                      <button
                        onClick={handleFollowupSkip}
                        className="text-text-dim text-xs hover:text-text-muted transition-colors"
                      >
                        Skip →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};

export default FlowQuizPage;
