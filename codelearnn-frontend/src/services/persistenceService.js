/**
 * Persistence Service — All API calls to user data persistence endpoints.
 * Uses the same axios instance as the rest of the app for auth token handling.
 * Every call is fire-and-forget safe — errors log silently, never break UX.
 */
import api from './api';

// ═══ QUIZ ═══

export const saveQuiz = async (questions, selfDescription) => {
  try {
    const res = await api.post('/user/quiz/save', { questions, selfDescription });
    return res.data;
  } catch (err) {
    console.error('Quiz save failed:', err.message);
    return { success: false };
  }
};

export const loadQuiz = async () => {
  try {
    const res = await api.get('/user/quiz');
    return res.data;
  } catch (err) {
    console.error('Quiz load failed:', err.message);
    return { quizData: null };
  }
};

// ═══ CAREERS ═══

export const saveCareers = async (careers) => {
  try {
    const res = await api.post('/user/careers/save', { careers });
    return res.data;
  } catch (err) {
    console.error('Careers save failed:', err.message);
    return { success: false };
  }
};

export const selectCareer = async (slug, title) => {
  try {
    const res = await api.post('/user/careers/select', { slug, title });
    return res.data;
  } catch (err) {
    console.error('Career select failed:', err.message);
    return { success: false };
  }
};

export const loadCareers = async () => {
  try {
    const res = await api.get('/user/careers');
    return res.data;
  } catch (err) {
    console.error('Careers load failed:', err.message);
    return { careerResults: null };
  }
};

// ═══ ROADMAP ═══

export const initializeRoadmap = async (careerSlug, roadmapData) => {
  try {
    const res = await api.post('/user/roadmap/initialize', { careerSlug, roadmapData });
    return res.data;
  } catch (err) {
    console.error('Roadmap init failed:', err.message);
    return { initialized: false };
  }
};

export const startStep = async (stageId, stepId) => {
  try {
    const res = await api.post('/user/roadmap/step/start', { stageId, stepId });
    return res.data;
  } catch (err) {
    console.error('Step start failed:', err.message);
    return { success: false };
  }
};

export const submitExercise = async (stageId, stepId, exerciseId, exerciseType, response, feedback) => {
  try {
    const res = await api.post('/user/roadmap/exercise/submit', {
      stageId, stepId, exerciseId, exerciseType, response, feedback,
    });
    return res.data;
  } catch (err) {
    console.error('Exercise submit failed:', err.message);
    return { success: false };
  }
};

export const loadProgress = async () => {
  try {
    const res = await api.get('/user/roadmap/progress');
    return res.data;
  } catch (err) {
    console.error('Progress load failed:', err.message);
    return { roadmapProgress: null };
  }
};

// ═══ MENTOR ═══

export const saveMentorChat = async (careerSlug, messages) => {
  try {
    const res = await api.post('/user/mentor/save', { careerSlug, messages });
    return res.data;
  } catch (err) {
    console.error('Mentor save failed:', err.message);
    return { success: false };
  }
};

export const loadMentorChat = async (careerSlug) => {
  try {
    const res = await api.get(`/user/mentor/${careerSlug}`);
    return res.data;
  } catch (err) {
    console.error('Mentor load failed:', err.message);
    return { messages: [] };
  }
};
