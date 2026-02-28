import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faChevronDown, faCheck, faFire, faCheckCircle,
  faArrowLeft, faPlay, faExternalLinkAlt, faTimes,
  faThumbsUp, faExclamationCircle, faCode, faQuestionCircle,
  faPaperPlane, faBrain, faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { useMedhaFlow } from '../../context/MedhaFlowContext';
import { medhaFlowAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LABELS = ['A', 'B', 'C', 'D'];

const FlowRoadmapPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { userName, selectedCareer, careerResults, roadmapData, setRoadmapData, roadmapProgress, setRoadmapProgress, streakCount } = useMedhaFlow();
  const [loading, setLoading] = useState(!roadmapData);
  const [expandedStages, setExpandedStages] = useState(new Set(['stage-1']));
  const [error, setError] = useState('');

  // Challenge state
  const [challengeStep, setChallengeStep] = useState(null); // stepId being challenged
  const [challengeQuestions, setChallengeQuestions] = useState([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeAnswers, setChallengeAnswers] = useState({ q1: null, q2: '', q3: '' });
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  const [challengeResults, setChallengeResults] = useState({}); // { stepId: { passed, results, overall_feedback } }

  const career = selectedCareer || careerResults.find(c => c.slug === slug);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { navigate('/name', { replace: true }); return; }
    if (!userName || !career) { navigate('/results', { replace: true }); return; }
    if (!roadmapData) fetchRoadmap();
  }, [slug, authLoading]);

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

  // ─── Challenge Flow ───
  const startChallenge = async (stepId) => {
    setChallengeStep(stepId);
    setChallengeQuestions([]);
    setChallengeAnswers({ q1: null, q2: '', q3: '' });
    setChallengeLoading(true);
    try {
      const res = await medhaFlowAPI.generateChallenge(stepId);
      setChallengeQuestions(res.data?.data?.questions || []);
    } catch (err) {
      console.error('Challenge gen failed:', err);
      setChallengeStep(null);
    } finally {
      setChallengeLoading(false);
    }
  };

  const submitChallenge = async () => {
    if (challengeAnswers.q1 === null || challengeAnswers.q2.length < 10 || challengeAnswers.q3.length < 10) return;
    setChallengeSubmitting(true);
    try {
      const res = await medhaFlowAPI.validateChallenge(challengeStep, challengeAnswers);
      const result = res.data?.data;
      setChallengeResults(prev => ({ ...prev, [challengeStep]: result }));
      if (result.passed) {
        setRoadmapProgress(prev => ({ ...prev, [challengeStep]: true }));
      }
    } catch (err) {
      console.error('Validate failed:', err);
    } finally {
      setChallengeSubmitting(false);
    }
  };

  const closeChallenge = () => {
    setChallengeStep(null);
    setChallengeQuestions([]);
    setChallengeAnswers({ q1: null, q2: '', q3: '' });
  };

  const retryChallenge = (stepId) => {
    setChallengeResults(prev => { const n = { ...prev }; delete n[stepId]; return n; });
    startChallenge(stepId);
  };

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

  if (error || !roadmapData) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchRoadmap} className="px-6 py-3 rounded-xl bg-primary text-bg-base font-bold">Retry</button>
        </div>
      </main>
    );
  }

  const allSteps = roadmapData.stages?.flatMap(s => s.steps) || [];
  const completedCount = allSteps.filter(s => roadmapProgress[s.id]).length;
  const totalSteps = allSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const canSubmitChallenge = challengeAnswers.q1 !== null && challengeAnswers.q2.trim().length >= 10 && challengeAnswers.q3.trim().length >= 10;

  return (
    <main className="min-h-screen bg-bg-base pt-10 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(`/preview/${slug}`)} className="text-text-dim text-sm hover:text-text-muted mb-6 inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to preview
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="text-primary font-mono text-xs">{roadmapData.total_duration}</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-main mb-2">
            {userName}'s <span className="text-primary">{career.title}</span> Roadmap
          </h1>
          <p className="text-text-muted">Learn each skill, then prove it by answering AI-generated questions.</p>
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
          {roadmapData.stages?.map((stage, stageIdx) => {
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
                          const result = challengeResults[step.id];
                          const isActive = challengeStep === step.id;
                          const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(step.youtube_search || step.skill)}`;

                          return (
                            <div key={step.id} className={`rounded-xl border p-4 transition-all ${isComplete ? 'border-primary/30 bg-primary/5' : 'border-border bg-bg-elevated'}`}>
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                                  isComplete ? 'bg-primary border-primary' : 'border-border'
                                }`}>
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

                                  {/* Completed badge */}
                                  {isComplete && !result && (
                                    <div className="flex items-center gap-2 text-primary text-xs font-medium py-1">
                                      <FontAwesomeIcon icon={faCheckCircle} /> Skill verified ✓
                                    </div>
                                  )}

                                  {/* Challenge Result */}
                                  {result && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                      className={`rounded-xl border p-4 mb-2 ${result.passed ? 'bg-green-500/5 border-green-500/30' : 'bg-yellow-500/5 border-yellow-500/30'}`}>
                                      <div className="flex items-center gap-2 mb-3">
                                        <FontAwesomeIcon icon={result.passed ? faThumbsUp : faExclamationCircle}
                                          className={result.passed ? 'text-green-400' : 'text-yellow-400'} />
                                        <span className={`text-sm font-bold ${result.passed ? 'text-green-400' : 'text-yellow-400'}`}>
                                          {result.passed ? `✅ Passed (${result.passCount}/3)` : `🔄 ${result.passCount}/3 — Need 2 to pass`}
                                        </span>
                                      </div>

                                      {/* Per-question feedback */}
                                      {['q1', 'q2', 'q3'].map((qk, qi) => {
                                        const r = result.results?.[qk];
                                        if (!r) return null;
                                        return (
                                          <div key={qk} className={`flex items-start gap-2 py-1.5 ${qi < 2 ? 'border-b border-border/50' : ''}`}>
                                            <span className={`text-xs mt-0.5 ${r.pass ? 'text-green-400' : 'text-red-400'}`}>
                                              {r.pass ? '✓' : '✗'}
                                            </span>
                                            <div>
                                              <span className="text-text-dim text-xs font-mono">Q{qi + 1}:</span>
                                              <span className="text-text-muted text-xs ml-1">{r.feedback}</span>
                                            </div>
                                          </div>
                                        );
                                      })}

                                      <p className="text-text-muted text-sm mt-3 pt-2 border-t border-border/50">{result.overall_feedback}</p>

                                      {!result.passed && (
                                        <button onClick={() => retryChallenge(step.id)}
                                          className="mt-3 w-full py-2.5 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/20 border border-yellow-500/20">
                                          <FontAwesomeIcon icon={faBrain} className="mr-1" /> Retry Challenge
                                        </button>
                                      )}
                                    </motion.div>
                                  )}

                                  {/* Start Challenge Button */}
                                  {!isComplete && !result && !isActive && (
                                    <button onClick={() => startChallenge(step.id)}
                                      className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-xs rounded-lg transition-all border border-primary/20 hover:border-primary/40 flex items-center justify-center gap-2">
                                      <FontAwesomeIcon icon={faBrain} /> Verify This Skill
                                    </button>
                                  )}

                                  {/* ─── Challenge Questions (Inline) ─── */}
                                  <AnimatePresence>
                                    {isActive && !result && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                        <div className="bg-bg-base rounded-xl border border-primary/30 p-4 mt-2 space-y-5">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <FontAwesomeIcon icon={faBrain} className="text-primary text-sm" />
                                              <p className="text-xs font-mono text-primary">SKILL CHALLENGE</p>
                                            </div>
                                            <button onClick={closeChallenge} className="text-text-dim hover:text-text-muted">
                                              <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                            </button>
                                          </div>

                                          {challengeLoading ? (
                                            <div className="text-center py-8">
                                              <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-xl mb-3" />
                                              <p className="text-text-muted text-sm">Generating questions for you...</p>
                                            </div>
                                          ) : (
                                            <>
                                              {challengeQuestions.map((q, qi) => (
                                                <div key={q.id} className="space-y-2">
                                                  {/* Question header */}
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                                      q.type === 'mcq' ? 'bg-blue-500/15 text-blue-400' :
                                                      q.type === 'short_answer' ? 'bg-purple-500/15 text-purple-400' :
                                                      'bg-orange-500/15 text-orange-400'
                                                    }`}>
                                                      <FontAwesomeIcon icon={q.type === 'code' ? faCode : q.type === 'mcq' ? faQuestionCircle : faLightbulb} className="text-[10px]" />
                                                    </span>
                                                    <span className="text-[10px] font-mono text-text-dim uppercase">
                                                      {q.type === 'mcq' ? 'Conceptual' : q.type === 'short_answer' ? 'Short Answer' : 'Code / Practical'}
                                                    </span>
                                                  </div>

                                                  <p className="text-text-main text-sm font-medium leading-relaxed">{q.question}</p>

                                                  {/* MCQ */}
                                                  {q.type === 'mcq' && (
                                                    <div className="space-y-1.5">
                                                      {q.options?.map((opt, oi) => (
                                                        <button key={oi} onClick={() => setChallengeAnswers(p => ({ ...p, q1: oi }))}
                                                          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs flex items-center gap-3 transition-all ${
                                                            challengeAnswers.q1 === oi
                                                              ? 'border-primary bg-primary/10 text-text-main'
                                                              : 'border-border bg-bg-surface hover:border-primary/30 text-text-muted'
                                                          }`}>
                                                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                                            challengeAnswers.q1 === oi ? 'bg-primary text-bg-base' : 'bg-bg-elevated text-text-dim'
                                                          }`}>{LABELS[oi]}</span>
                                                          {opt}
                                                        </button>
                                                      ))}
                                                    </div>
                                                  )}

                                                  {/* Short Answer */}
                                                  {q.type === 'short_answer' && (
                                                    <textarea value={challengeAnswers.q2}
                                                      onChange={(e) => setChallengeAnswers(p => ({ ...p, q2: e.target.value }))}
                                                      placeholder="Explain in 1-3 sentences..."
                                                      rows={3}
                                                      className="w-full px-3.5 py-3 bg-bg-surface border border-border rounded-lg text-text-main text-sm placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none leading-relaxed transition-all" />
                                                  )}

                                                  {/* Code */}
                                                  {q.type === 'code' && (
                                                    <div className="space-y-2">
                                                      {q.hint && (
                                                        <p className="text-text-dim text-xs flex items-center gap-1">
                                                          <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400 text-[10px]" />
                                                          Hint: {q.hint}
                                                        </p>
                                                      )}
                                                      <textarea value={challengeAnswers.q3}
                                                        onChange={(e) => setChallengeAnswers(p => ({ ...p, q3: e.target.value }))}
                                                        placeholder={`Write your ${q.language || 'code'} here...`}
                                                        rows={6}
                                                        className="w-full px-3.5 py-3 bg-bg-surface border border-border rounded-lg text-text-main text-sm placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none font-mono leading-relaxed transition-all" />
                                                    </div>
                                                  )}

                                                  {qi < challengeQuestions.length - 1 && <div className="border-t border-border/30 my-1" />}
                                                </div>
                                              ))}

                                              {/* Submit */}
                                              <button onClick={submitChallenge}
                                                disabled={!canSubmitChallenge || challengeSubmitting}
                                                className="w-full py-3 bg-primary hover:bg-primary/90 text-bg-base font-bold text-sm rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                                {challengeSubmitting ? (
                                                  <><FontAwesomeIcon icon={faSpinner} spin /> Grading your answers...</>
                                                ) : (
                                                  <><FontAwesomeIcon icon={faPaperPlane} /> Submit Answers</>
                                                )}
                                              </button>

                                              {!canSubmitChallenge && challengeQuestions.length > 0 && (
                                                <p className="text-text-dim text-xs text-center">
                                                  Answer all 3 questions to submit (min 10 chars for text answers)
                                                </p>
                                              )}
                                            </>
                                          )}
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
                            ✅ All skills verified — stage complete!
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
    </main>
  );
};

export default FlowRoadmapPage;
