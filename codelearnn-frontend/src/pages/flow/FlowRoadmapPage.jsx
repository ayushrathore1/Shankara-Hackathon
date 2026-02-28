import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faChevronDown, faCheck, faFire, faCheckCircle,
  faArrowLeft, faPlay, faExternalLinkAlt, faTimes,
  faPaperPlane, faBrain, faLightbulb,
  faFlask, faBookOpen, faPen, faRedo, faEye,
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { useMedhaFlow } from '../../context/MedhaFlowContext';
import { medhaFlowAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MentorChat, { MentorTrigger } from '../../components/mentor/MentorChat';

const TYPE_META = {
  conceptual: { icon: faBookOpen, label: 'Conceptual', color: 'blue', time: '15-20 min' },
  applied: { icon: faFlask, label: 'Applied', color: 'purple', time: '30-45 min' },
  reflective: { icon: faPen, label: 'Reflective', color: 'amber', time: '10-15 min' },
};

const VERDICT_COLORS = {
  'Strong': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20' },
  'Adequate': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20' },
  'Needs Revision': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20' },
};

const FlowRoadmapPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    userName, selectedCareer, careerResults, quizAnswers,
    roadmapData, setRoadmapData, roadmapProgress,
    streakCount, exerciseData, storeExercises, recordSubmission, completeStepViaExercise,
  } = useMedhaFlow();

  const [loading, setLoading] = useState(!roadmapData);
  const [expandedStages, setExpandedStages] = useState(new Set(['stage-1']));
  const [error, setError] = useState('');
  const [mentorOpen, setMentorOpen] = useState(false);
  const [showMentorPulse, setShowMentorPulse] = useState(true);

  // Exercise panel state
  const [openExerciseStep, setOpenExerciseStep] = useState(null); // stepId with exercise panel open
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ex-1'); // which exercise tab is active
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hintText, setHintText] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [retrying, setRetrying] = useState(false); // user clicked "Try Again"

  const textareaRef = useRef(null);
  const career = selectedCareer || careerResults.find(c => c.slug === slug);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { navigate('/name', { replace: true }); return; }
    if (!userName || !career) { navigate('/results', { replace: true }); return; }
    if (!roadmapData) fetchRoadmap();
  }, [slug, authLoading]);

  // Stop mentor pulse after 30s
  useEffect(() => { const t = setTimeout(() => setShowMentorPulse(false), 30000); return () => clearTimeout(t); }, []);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await medhaFlowAPI.roadmap({ title: career.title, slug: career.slug });
      setRoadmapData(res.data?.data);
    } catch (err) {
      setError('Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  const toggleStage = (id) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build user profile from quiz answers for exercise personalization
  const getUserProfile = () => {
    const q1 = typeof quizAnswers?.q1 === 'object' ? quizAnswers.q1.text : (quizAnswers?.q1 || '');
    const q2 = typeof quizAnswers?.q2 === 'object' ? quizAnswers.q2.text : (quizAnswers?.q2 || '');
    const q3 = typeof quizAnswers?.q3 === 'object' ? quizAnswers.q3.text : (quizAnswers?.q3 || '');
    return {
      cognitive_style: q1.length > 10 ? q1.substring(0, 80) : 'analytical',
      motivation_source: q2.length > 10 ? q2.substring(0, 80) : 'growth',
      environment_preference: q3.length > 10 ? q3.substring(0, 80) : 'structured',
    };
  };

  // ─── Get Exercises ───
  const handleGetExercises = async (step) => {
    if (exerciseData[step.id]?.exercises?.length) {
      // Already generated — just toggle panel
      setOpenExerciseStep(prev => prev === step.id ? null : step.id);
      setActiveTab('ex-1');
      setResponseText('');
      setShowHint(false);
      setHintText('');
      setRetrying(false);
      return;
    }

    setOpenExerciseStep(step.id);
    setExerciseLoading(true);
    setActiveTab('ex-1');
    setResponseText('');
    setShowHint(false);
    setRetrying(false);

    try {
      const res = await medhaFlowAPI.getExercises({
        career: career.title,
        stage: 'Learning',
        step_skill: step.skill,
        step_description: step.description,
        youtube_search: step.youtube_search,
        user_name: userName,
        user_profile: getUserProfile(),
      });

      if (res.data?.success && res.data.data?.exercises) {
        storeExercises(step.id, res.data.data.exercises);
      } else {
        setError('Could not generate exercises. Try again in a moment.');
        setOpenExerciseStep(null);
      }
    } catch (err) {
      setError('Could not generate exercises. Try again in a moment.');
      setOpenExerciseStep(null);
    } finally {
      setExerciseLoading(false);
    }
  };

  // ─── Submit Exercise ───
  const handleSubmit = async (step, exercise) => {
    if (responseText.trim().length < 50) return;
    setSubmitting(true);

    try {
      const isRevision = (exerciseData[step.id]?.submissions?.[exercise.id]?.attempts || 0) > 0;
      const res = await medhaFlowAPI.validateExercise({
        career: career.title,
        step_skill: step.skill,
        exercise,
        user_response: responseText.trim(),
        user_name: userName,
      });

      let feedback = res.data?.data;
      // On revision attempt, always unlock
      if (isRevision && feedback) {
        feedback = { ...feedback, unlock: true, verdict: feedback.verdict === 'Needs Revision' ? 'Adequate' : feedback.verdict };
      }

      recordSubmission(step.id, exercise.id, responseText.trim(), feedback);

      // If unlock is true, complete the step
      if (feedback?.unlock) {
        completeStepViaExercise(step.id);
      }
    } catch (err) {
      // Fallback — never block progress
      const fallback = {
        verdict: 'Adequate', unlock: true,
        what_worked: 'Your response showed engagement.',
        what_was_missing: 'We could not fully evaluate right now.',
        one_thing_to_do: 'Review your response.',
        encouragement: 'Keep going!',
      };
      recordSubmission(step.id, exercise.id, responseText.trim(), fallback);
      completeStepViaExercise(step.id);
    } finally {
      setSubmitting(false);
      setRetrying(false);
    }
  };

  // ─── Get Hint ───
  const handleGetHint = async (step, exercise) => {
    if (hintLoading) return;
    setHintLoading(true);
    setShowHint(true);
    try {
      const res = await medhaFlowAPI.getHint({
        step_skill: step.skill,
        exercise,
        user_partial: responseText,
      });
      setHintText(res.data?.data?.hint || 'Think about the core concept. What would you explain to a friend?');
    } catch {
      setHintText('Think about the core concept. What would you explain to a friend?');
    } finally {
      setHintLoading(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-3xl mb-4" />
          <p className="text-text-muted text-lg">Building your personalized roadmap...</p>
        </motion.div>
      </main>
    );
  }

  if (error && !roadmapData) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchRoadmap} className="px-6 py-3 rounded-xl bg-primary text-bg-base font-bold">Retry</button>
        </div>
      </main>
    );
  }

  const allSteps = roadmapData?.stages?.flatMap(s => s.steps) || [];
  const completedCount = allSteps.filter(s => roadmapProgress[s.id]).length;
  const totalSteps = allSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <main className="min-h-screen bg-bg-base pt-10 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(`/preview/${slug}`)} className="text-text-dim text-sm hover:text-text-muted mb-6 inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to preview
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="text-primary font-mono text-xs">{roadmapData?.total_duration}</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-main mb-2">
            {userName}'s <span className="text-primary">{career?.title}</span> Roadmap
          </h1>
          <p className="text-text-muted">Complete exercises to verify each skill and unlock your progress.</p>
        </motion.div>

        {/* Progress & Streak */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-bg-surface border border-border rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-text-main font-bold text-sm">{completedCount} of {totalSteps} verified</span>
              <span className="text-text-dim text-sm ml-2">— {progressPct}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <FontAwesomeIcon icon={faFire} className={streakCount > 0 ? 'text-orange-400' : 'text-text-dim'} />
              <span className={streakCount > 0 ? 'text-orange-400 font-bold' : 'text-text-dim'}>
                Day {streakCount} {streakCount > 0 ? 'streak' : '— Start today'}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>

        {/* Stages */}
        <div className="space-y-4">
          {roadmapData?.stages?.map((stage, stageIdx) => {
            const isExpanded = expandedStages.has(stage.id);
            const stageSteps = stage.steps || [];
            const stageCompleted = stageSteps.filter(s => roadmapProgress[s.id]).length;
            const stageComplete = stageCompleted === stageSteps.length && stageSteps.length > 0;

            return (
              <motion.div key={stage.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stageIdx * 0.1 }}
                className="bg-bg-surface border border-border rounded-xl overflow-hidden">
                <button onClick={() => toggleStage(stage.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-bg-elevated transition-colors">
                  <div className="flex items-center gap-3">
                    {stageComplete ? (
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-primary" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-dim text-sm font-bold">
                        {stageIdx + 1}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-text-main text-sm">{stage.title}</h3>
                      <p className="text-text-dim text-xs">{stage.weeks} · {stageCompleted}/{stageSteps.length} verified</p>
                    </div>
                  </div>
                  <FontAwesomeIcon icon={faChevronDown}
                    className={`text-text-dim text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-3 border-t border-border pt-3">
                        {stageSteps.map((step) => {
                          const isComplete = roadmapProgress[step.id];
                          const stepExData = exerciseData[step.id];
                          const hasExercises = stepExData?.exercises?.length > 0;
                          const isPanelOpen = openExerciseStep === step.id;
                          const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(step.youtube_search || step.skill)}`;

                          return (
                            <div key={step.id} className={`rounded-xl border p-4 transition-all ${isComplete ? 'border-primary/30 bg-primary/5' : 'border-border bg-bg-elevated'}`}>
                              {/* Step header */}
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-primary border-primary' : 'border-border'}`}>
                                  {isComplete && <FontAwesomeIcon icon={faCheck} className="text-bg-base text-[8px]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-bold text-sm mb-1 ${isComplete ? 'text-primary' : 'text-text-main'}`}>{step.skill}</h4>
                                  <p className="text-text-dim text-xs leading-relaxed mb-3">{step.description}</p>

                                  {/* YouTube Card */}
                                  <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                                    className="block bg-bg-base rounded-lg p-3 mb-3 border border-border hover:border-red-500/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                                        <FontAwesomeIcon icon={faPlay} className="text-red-400 text-sm" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-text-main text-sm font-medium truncate group-hover:text-red-400 transition-colors">
                                          {step.video_title || step.skill + ' Tutorial'}
                                        </p>
                                        <p className="text-text-dim text-xs flex items-center gap-1">
                                          <FontAwesomeIcon icon={faYoutube} className="text-red-400 text-[10px]" />
                                          {step.video_channel || 'YouTube'} · ~{step.hours}h
                                        </p>
                                      </div>
                                      <FontAwesomeIcon icon={faExternalLinkAlt} className="text-text-dim text-xs" />
                                    </div>
                                  </a>

                                  {/* Milestone */}
                                  <div className="bg-bg-base rounded-lg p-3 border border-border mb-3">
                                    <p className="text-[10px] font-mono text-primary mb-1">YOUR MILESTONE</p>
                                    <p className="text-text-muted text-sm">{step.milestone}</p>
                                  </div>

                                  {/* Exercise Button / Completed State */}
                                  {isComplete ? (
                                    <button onClick={() => handleGetExercises(step)}
                                      className="w-full py-2.5 bg-primary/10 text-primary font-medium text-xs rounded-lg transition-all border border-primary/20 flex items-center justify-center gap-2">
                                      <FontAwesomeIcon icon={isPanelOpen ? faEye : faCheckCircle} />
                                      {isPanelOpen ? 'Hide Exercises ↑' : 'Completed ✓ — Review Exercises'}
                                    </button>
                                  ) : (
                                    <button onClick={() => handleGetExercises(step)}
                                      disabled={exerciseLoading && openExerciseStep === step.id}
                                      className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-xs rounded-lg transition-all border border-primary/20 hover:border-primary/40 flex items-center justify-center gap-2 disabled:opacity-50">
                                      {exerciseLoading && openExerciseStep === step.id ? (
                                        <><FontAwesomeIcon icon={faSpinner} spin /> Generating your exercises...</>
                                      ) : isPanelOpen ? (
                                        <>Hide Exercises ↑</>
                                      ) : (
                                        <><FontAwesomeIcon icon={faBrain} /> Get Exercises →</>
                                      )}
                                    </button>
                                  )}
                                  {!isComplete && !isPanelOpen && (
                                    <p className="text-text-dim text-[10px] text-center mt-1.5">Complete exercises to unlock this step</p>
                                  )}

                                  {/* ═══ EXERCISE PANEL ═══ */}
                                  <AnimatePresence>
                                    {isPanelOpen && hasExercises && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                        <div className="mt-4 border-t border-border pt-4">
                                          {/* Tabs */}
                                          <div className="flex gap-2 mb-4">
                                            {stepExData.exercises.map((ex) => {
                                              const meta = TYPE_META[ex.type] || TYPE_META.conceptual;
                                              const sub = stepExData.submissions?.[ex.id];
                                              const isDone = sub?.feedback?.unlock;
                                              return (
                                                <button key={ex.id} onClick={() => { setActiveTab(ex.id); setResponseText(sub?.response || ''); setShowHint(false); setHintText(''); setRetrying(false); }}
                                                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all border flex items-center justify-center gap-1.5 ${
                                                    activeTab === ex.id
                                                      ? `bg-${meta.color}-500/10 border-${meta.color}-500/30 text-${meta.color}-400`
                                                      : 'border-border text-text-dim hover:text-text-muted'
                                                  } ${isDone ? 'opacity-70' : ''}`}>
                                                  <FontAwesomeIcon icon={isDone ? faCheckCircle : meta.icon} className="text-[10px]" />
                                                  {meta.label}
                                                </button>
                                              );
                                            })}
                                          </div>

                                          {/* Active Exercise */}
                                          {stepExData.exercises.map((ex) => {
                                            if (ex.id !== activeTab) return null;
                                            const meta = TYPE_META[ex.type] || TYPE_META.conceptual;
                                            const sub = stepExData.submissions?.[ex.id];
                                            const hasFeedback = sub?.feedback;
                                            const isReadOnly = isComplete && !retrying;

                                            return (
                                              <motion.div key={ex.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                {/* Exercise Info */}
                                                <div className="mb-4">
                                                  <h5 className="font-bold text-text-main text-sm mb-1">{ex.title}</h5>
                                                  <p className="text-text-dim text-xs mb-2 italic">{ex.context}</p>
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-base border border-border text-text-dim text-[10px]">
                                                    ⏱ {ex.time_estimate}
                                                  </span>
                                                </div>

                                                {/* Instruction */}
                                                <div className="bg-bg-base rounded-lg p-3 border border-border mb-3">
                                                  <p className="text-text-muted text-sm leading-relaxed">{ex.instruction}</p>
                                                </div>

                                                {/* Output Format */}
                                                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 mb-4">
                                                  <p className="text-[10px] font-mono text-primary mb-1">WHAT TO PRODUCE</p>
                                                  <p className="text-text-main text-sm">{ex.output_format}</p>
                                                </div>

                                                {/* Feedback card (if submitted) */}
                                                {hasFeedback && !retrying ? (
                                                  <div className={`rounded-xl border p-4 mb-3 ${VERDICT_COLORS[hasFeedback.verdict]?.bg || 'bg-bg-base'} ${VERDICT_COLORS[hasFeedback.verdict]?.border || 'border-border'}`}>
                                                    {/* Verdict badge */}
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${VERDICT_COLORS[hasFeedback.verdict]?.badge || ''} ${VERDICT_COLORS[hasFeedback.verdict]?.text || 'text-text-main'}`}>
                                                      {hasFeedback.verdict === 'Strong' && '✓ '}
                                                      {hasFeedback.verdict}
                                                    </div>

                                                    <div className="space-y-3 text-sm">
                                                      <div>
                                                        <p className="text-text-dim text-[10px] font-mono mb-1">WHAT WORKED</p>
                                                        <p className="text-text-muted">{hasFeedback.what_worked}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-text-dim text-[10px] font-mono mb-1">WHAT WAS MISSING</p>
                                                        <p className="text-text-muted">{hasFeedback.what_was_missing}</p>
                                                      </div>
                                                      <div className="bg-bg-base rounded-lg p-3 border border-border">
                                                        <p className="text-text-dim text-[10px] font-mono mb-1">ONE THING TO DO</p>
                                                        <p className="text-text-main font-medium">{hasFeedback.one_thing_to_do}</p>
                                                      </div>
                                                      <p className="text-text-dim text-xs italic pt-1">{hasFeedback.encouragement}</p>
                                                    </div>

                                                    {/* Unlock banner */}
                                                    {hasFeedback.unlock ? (
                                                      <div className="mt-3 py-2 px-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faCheckCircle} /> Step Unlocked ✓
                                                      </div>
                                                    ) : (
                                                      <div className="mt-3 space-y-2">
                                                        <div className="py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                                                          Revise and resubmit
                                                        </div>
                                                        <button onClick={() => { setRetrying(true); setResponseText(sub.response || ''); }}
                                                          className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium border border-amber-500/20 flex items-center justify-center gap-2">
                                                          <FontAwesomeIcon icon={faRedo} /> Try Again →
                                                        </button>
                                                      </div>
                                                    )}

                                                    {/* Show submitted response (read-only) */}
                                                    <div className="mt-3 pt-3 border-t border-border/50">
                                                      <p className="text-text-dim text-[10px] font-mono mb-1">YOUR RESPONSE</p>
                                                      <p className="text-text-muted text-xs leading-relaxed whitespace-pre-wrap">{sub.response}</p>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  /* Textarea + submit */
                                                  <>
                                                    <textarea
                                                      ref={textareaRef}
                                                      value={responseText}
                                                      onChange={(e) => setResponseText(e.target.value)}
                                                      placeholder="Write your response here..."
                                                      rows={5}
                                                      disabled={isReadOnly && !retrying}
                                                      className="w-full px-4 py-3 bg-bg-base border border-border rounded-xl text-text-main text-sm placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none leading-relaxed transition-all min-h-[120px]"
                                                    />

                                                    <div className="flex items-center justify-between mt-2 mb-3">
                                                      {/* Hint button */}
                                                      <button onClick={() => handleGetHint(step, ex)}
                                                        disabled={hintLoading}
                                                        className="text-text-dim text-xs hover:text-text-muted transition-colors flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400/60 text-[10px]" />
                                                        {hintLoading ? 'Getting hint...' : "I'm stuck"}
                                                      </button>
                                                      <span className="text-text-dim text-[10px]">{responseText.length} chars{responseText.length < 50 ? ` · ${50 - responseText.length} more needed` : ''}</span>
                                                    </div>

                                                    {/* Hint area */}
                                                    <AnimatePresence>
                                                      {showHint && hintText && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                                                          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                                                            <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400 text-xs mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1">
                                                              <p className="text-text-muted text-xs leading-relaxed">{hintText}</p>
                                                            </div>
                                                            <button onClick={() => setShowHint(false)} className="text-text-dim text-xs hover:text-text-muted">
                                                              <FontAwesomeIcon icon={faTimes} />
                                                            </button>
                                                          </div>
                                                        </motion.div>
                                                      )}
                                                    </AnimatePresence>

                                                    {/* Submit button */}
                                                    <button onClick={() => handleSubmit(step, ex)}
                                                      disabled={responseText.trim().length < 50 || submitting}
                                                      className="w-full py-3 bg-primary hover:bg-primary/90 text-bg-base font-bold text-sm rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                                      {submitting ? (
                                                        <><FontAwesomeIcon icon={faSpinner} spin /> Evaluating...</>
                                                      ) : (
                                                        <><FontAwesomeIcon icon={faPaperPlane} /> Submit Response →</>
                                                      )}
                                                    </button>
                                                  </>
                                                )}
                                              </motion.div>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {stageComplete && (
                          <div className="text-center py-3 text-primary text-sm font-medium">
                            All skills verified — stage complete!
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Career Mentor */}
      {(() => {
        const career = selectedCareer || careerResults?.find(c => c.slug === slug) || { title: slug, slug };
        const userProfile = {
          name: userName || 'Student',
          cognitive_style: quizAnswers?.q1?.dimension || 'analytical',
          motivation_source: quizAnswers?.q2?.dimension || 'growth',
          environment_preference: quizAnswers?.q3?.dimension || 'structured',
          resilience_pattern: quizAnswers?.q4?.dimension || 'persistent',
          self_description: typeof quizAnswers?.q6 === 'string' ? quizAnswers.q6 : '',
        };
        return (
          <>
            <MentorTrigger onClick={() => setMentorOpen(!mentorOpen)} isOpen={mentorOpen} showPulse={showMentorPulse} />
            <MentorChat career={career} userProfile={userProfile} isOpen={mentorOpen} onClose={() => setMentorOpen(false)} />
          </>
        );
      })()}
    </main>
  );
};

export default FlowRoadmapPage;
