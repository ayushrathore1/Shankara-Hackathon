import { createContext, useContext, useState } from 'react';

const MedhaFlowContext = createContext(null);

export const MedhaFlowProvider = ({ children }) => {
  const [userName, setUserName] = useState('');
  const [userDegree, setUserDegree] = useState(null); // { degree, degreeLabel, year }
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

  const toggleStepComplete = (stepId) => {
    setRoadmapProgress(prev => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      const today = new Date().toISOString().split('T')[0];
      if (today !== lastActiveDate) {
        setStreakCount(s => s + 1);
        setLastActiveDate(today);
      }
      return next;
    });
  };

  // Load saved flow from DB
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
  };

  const resetFlow = () => {
    setQuizAnswers({});
    setCareerResults([]);
    setCareerDomains(null);
    setSelectedCareer(null);
    setRoadmapData(null);
    setRoadmapProgress({});
  };

  return (
    <MedhaFlowContext.Provider value={{
      userName, setUserName,
      userDegree, setUserDegree,
      quizAnswers, setQuizAnswers,
      careerResults, setCareerResults,
      careerDomains, setCareerDomains,
      selectedCareer, setSelectedCareer,
      roadmapData, setRoadmapData,
      roadmapProgress, setRoadmapProgress, toggleStepComplete,
      streakCount, lastActiveDate,
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
