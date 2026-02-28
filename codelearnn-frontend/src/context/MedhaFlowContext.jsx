import { createContext, useContext, useState, useCallback } from 'react';
import { loadQuiz, loadCareers, loadProgress } from '../services/persistenceService';

const MedhaFlowContext = createContext(null);

export const MedhaFlowProvider = ({ children }) => {
  const [userName, setUserName] = useState('');
  const [userDegree, setUserDegree] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({
    q1: { text: '', dimension: '', followup_q: '', followup_a: '' },
    q2: { text: '', dimension: '', followup_q: '', followup_a: '' },
    q3: { text: '', dimension: '', followup_q: '', followup_a: '' },
    q4: { text: '', dimension: '', followup_q: '', followup_a: '' },
    q5: { text: '', dimension: '', followup_q: '', followup_a: '' },
    q6: '',
  });
  const [careerResults, setCareerResults] = useState([]);
  const [careerDomains, setCareerDomains] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [roadmapProgress, setRoadmapProgress] = useState({});
  const [streakCount, setStreakCount] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState('');

  // Exercise & validation state
  // Shape: { [stepId]: { exercises: [], submissions: { "ex-1": { response, feedback, verdict, attempts } }, step_status, completed_at } }
  const [exerciseData, setExerciseData] = useState({});

  // Complete step via exercise validation
  const completeStepViaExercise = (stepId) => {
    setRoadmapProgress(prev => ({ ...prev, [stepId]: true }));
    setExerciseData(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId], step_status: 'completed', completed_at: new Date().toISOString() },
    }));
    const today = new Date().toISOString().split('T')[0];
    if (today !== lastActiveDate) {
      setStreakCount(s => s + 1);
      setLastActiveDate(today);
    }
  };

  // Record exercise submission (increments streak on any attempt)
  const recordSubmission = (stepId, exerciseId, response, feedback) => {
    setExerciseData(prev => {
      const stepD = prev[stepId] || { exercises: [], submissions: {}, step_status: 'in_progress', completed_at: null };
      const sub = stepD.submissions[exerciseId] || { response: '', feedback: null, verdict: '', attempts: 0 };
      return {
        ...prev,
        [stepId]: {
          ...stepD,
          submissions: {
            ...stepD.submissions,
            [exerciseId]: { response, feedback, verdict: feedback?.verdict || '', attempts: sub.attempts + 1 },
          },
        },
      };
    });
    const today = new Date().toISOString().split('T')[0];
    if (today !== lastActiveDate) {
      setStreakCount(s => s + 1);
      setLastActiveDate(today);
    }
  };

  // Store generated exercises for a step
  const storeExercises = (stepId, exercises) => {
    setExerciseData(prev => ({
      ...prev,
      [stepId]: {
        exercises,
        submissions: prev[stepId]?.submissions || {},
        step_status: 'in_progress',
        completed_at: prev[stepId]?.completed_at || null,
      },
    }));
  };

  const loadFromDB = (flowData) => {
    if (!flowData) return;
    if (flowData.quizAnswers) setQuizAnswers(flowData.quizAnswers);
    if (flowData.careerResults) setCareerResults(flowData.careerResults);
    if (flowData.careerDomains) setCareerDomains(flowData.careerDomains);
    if (flowData.selectedCareer) setSelectedCareer(flowData.selectedCareer);
    if (flowData.roadmapData) setRoadmapData(flowData.roadmapData);
    if (flowData.roadmapProgress) setRoadmapProgress(flowData.roadmapProgress);
    if (flowData.streakCount) setStreakCount(flowData.streakCount);
    if (flowData.lastActiveDate) setLastActiveDate(flowData.lastActiveDate);
    if (flowData.userDegree) setUserDegree(flowData.userDegree);
    if (flowData.exerciseData) setExerciseData(flowData.exerciseData);
  };

  const resetFlow = () => {
    setQuizAnswers({});
    setCareerResults([]);
    setCareerDomains(null);
    setSelectedCareer(null);
    setRoadmapData(null);
    setRoadmapProgress({});
    setExerciseData({});
  };

  // Data loaded flag — prevents showing loading states on return visits
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Restore all user data from database on app mount
  const restoreFromDatabase = useCallback(async () => {
    try {
      const [quizRes, careerRes, progressRes] = await Promise.all([
        loadQuiz(), loadCareers(), loadProgress(),
      ]);

      if (quizRes?.quizData?.completedAt) {
        setQuizAnswers(prev => quizRes.quizData.questions?.length ? {
          ...prev,
          ...quizRes.quizData.questions.reduce((acc, q, i) => {
            acc[`q${i + 1}`] = { text: q.selectedText || '', dimension: q.dimension || '', followup_q: q.followupQuestion || '', followup_a: q.followupAnswer || '' };
            return acc;
          }, {}),
          q6: quizRes.quizData.selfDescription || '',
        } : prev);
      }

      if (careerRes?.careerResults?.careers?.length) {
        setCareerResults(careerRes.careerResults.careers);
        if (careerRes.careerResults.selectedCareer?.slug) {
          setSelectedCareer(careerRes.careerResults.selectedCareer);
        }
      }

      if (progressRes?.roadmapProgress) {
        const rp = progressRes.roadmapProgress;
        if (rp.streakCount) setStreakCount(rp.streakCount);
        if (rp.lastActiveDate) setLastActiveDate(rp.lastActiveDate);
        // Restore step completion states
        if (rp.stages?.length) {
          const progress = {};
          rp.stages.forEach(stage => {
            stage.steps?.forEach(step => {
              if (step.status === 'completed') progress[step.stepId] = true;
            });
          });
          setRoadmapProgress(progress);
        }
      }
    } catch (err) {
      console.error('Database restore failed (using fresh state):', err.message);
    } finally {
      setIsDataLoaded(true);
    }
  }, []);

  return (
    <MedhaFlowContext.Provider value={{
      userName, setUserName,
      userDegree, setUserDegree,
      quizAnswers, setQuizAnswers,
      careerResults, setCareerResults,
      careerDomains, setCareerDomains,
      selectedCareer, setSelectedCareer,
      roadmapData, setRoadmapData,
      roadmapProgress, setRoadmapProgress,
      streakCount, lastActiveDate,
      exerciseData, storeExercises, recordSubmission, completeStepViaExercise,
      isDataLoaded, restoreFromDatabase,
      loadFromDB, resetFlow,
    }}>
      {children}
    </MedhaFlowContext.Provider>
  );
};

export const useMedhaFlow = () => {
  const ctx = useContext(MedhaFlowContext);
  if (!ctx) throw new Error('useMedhaFlow must be used within MedhaFlowProvider');
  return ctx;
};
