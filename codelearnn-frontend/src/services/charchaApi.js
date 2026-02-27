import axios from 'axios';

// Charcha API - Separate backend for community features
const CHARCHA_API_URL = import.meta.env.VITE_CHARCHA_API_URL || 'http://localhost:5001/api';

const charchaApi = axios.create({
  baseURL: CHARCHA_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
charchaApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('charcha_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
charchaApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('charcha_token');
      localStorage.removeItem('charcha_user');
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================
export const charchaAuthAPI = {
  register: (data) => charchaApi.post('/auth/register', { ...data, platform: 'MEDHA' }),
  
  login: (data) => charchaApi.post('/auth/login', data),
  
  getMe: () => charchaApi.get('/auth/me'),
  
  updateProfile: (data) => charchaApi.put('/auth/profile', data),
  
  getPublicProfile: (username) => charchaApi.get(`/auth/users/${username}`),
  
  getLeaderboard: (type = 'aura', limit = 20) => 
    charchaApi.get('/auth/leaderboard', { 
      params: { type, platform: 'MEDHA', limit } 
    }),
};

// ============================================================================
// POSTS API
// ============================================================================
export const charchaPostsAPI = {
  // Get posts with filters
  getPosts: (params = {}) => 
    charchaApi.get('/posts', { 
      params: { platform: 'MEDHA', ...params } 
    }),
  
  // Create a new post
  createPost: (data) => 
    charchaApi.post('/posts', { ...data, platform: 'MEDHA' }),
  
  // Get single post by ID or slug
  getPost: (idOrSlug) => charchaApi.get(`/posts/${idOrSlug}`),
  
  // Delete a post
  deletePost: (postId) => charchaApi.delete(`/posts/${postId}`),
  
  // Bookmark a post
  bookmarkPost: (postId) => charchaApi.post(`/posts/${postId}/bookmark`),
  
  // Mark as high quality (moderator only)
  markQuality: (postId) => charchaApi.post(`/posts/${postId}/quality`),
};

// ============================================================================
// COMMENTS API
// ============================================================================
export const charchaCommentsAPI = {
  // Get threaded comments for a post
  getComments: (postId, params = {}) => 
    charchaApi.get(`/posts/${postId}/comments`, { params }),
  
  // Add a comment to a post
  addComment: (postId, data) => 
    charchaApi.post(`/posts/${postId}/comments`, data),
  
  // Delete a comment
  deleteComment: (commentId) => charchaApi.delete(`/comments/${commentId}`),
};

// ============================================================================
// VOTING API
// ============================================================================
export const charchaVotesAPI = {
  // Vote on a post or comment
  vote: (targetType, targetId, voteType) => 
    charchaApi.post('/votes', { targetType, targetId, voteType }),
  
  // Check user's votes on multiple items
  checkVotes: (targetType, targetIds) => 
    charchaApi.post('/votes/check', { targetType, targetIds }),
};

// ============================================================================
// FOLLOW API
// ============================================================================
export const charchaFollowAPI = {
  // Follow a user
  follow: (userId) => charchaApi.post(`/users/${userId}/follow`),
  
  // Unfollow a user
  unfollow: (userId) => charchaApi.delete(`/users/${userId}/follow`),
  
  // Get user's followers
  getFollowers: (userId, params = {}) => 
    charchaApi.get(`/users/${userId}/followers`, { params }),
  
  // Get users that a user follows
  getFollowing: (userId, params = {}) => 
    charchaApi.get(`/users/${userId}/following`, { params }),
  
  // Check if current user follows a user
  checkFollowing: (userId) => 
    charchaApi.get(`/users/${userId}/following/check`),
};

// ============================================================================
// MENTIONS API
// ============================================================================
export const charchaMentionsAPI = {
  // Search users for @autocomplete
  searchUsers: (query) => 
    charchaApi.get('/mentions/users/search', { params: { q: query } }),
  
  // Get current user's mentions
  getMentions: (params = {}) => 
    charchaApi.get('/mentions', { params }),
  
  // Mark mentions as read
  markRead: (mentionIds = []) => 
    charchaApi.post('/mentions/read', { mentionIds }),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Store Charcha auth token
export const setCharchaToken = (token) => {
  localStorage.setItem('charcha_token', token);
};

// Get Charcha auth token
export const getCharchaToken = () => {
  return localStorage.getItem('charcha_token');
};

// Remove Charcha auth token
export const removeCharchaToken = () => {
  localStorage.removeItem('charcha_token');
  localStorage.removeItem('charcha_user');
};

// Store Charcha user
export const setCharchaUser = (user) => {
  localStorage.setItem('charcha_user', JSON.stringify(user));
};

// Get Charcha user
export const getCharchaUser = () => {
  const user = localStorage.getItem('charcha_user');
  return user ? JSON.parse(user) : null;
};

// Post type configs with labels and colors
export const POST_TYPES = {
  NOTE: { label: 'Note', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  POST: { label: 'Post', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  RESOURCE: { label: 'Resource', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  EXPLANATION: { label: 'Explanation', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  ROADMAP: { label: 'Roadmap', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  REVIEW: { label: 'Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
};

// Tag configs
export const POST_TAGS = [
  { id: 'doubts', label: 'Doubts', icon: '❓' },
  { id: 'resources', label: 'Resources', icon: '📚' },
  { id: 'memes', label: 'Memes', icon: '😂' },
  { id: 'off-topic', label: 'Off Topic', icon: '💬' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'roadmaps', label: 'Roadmaps', icon: '🗺️' },
  { id: 'tutorials', label: 'Tutorials', icon: '🎓' },
];

// Sort options
export const SORT_OPTIONS = [
  { id: 'hot', label: 'Hot', icon: '🔥' },
  { id: 'new', label: 'New', icon: '✨' },
  { id: 'top', label: 'Top', icon: '🏆' },
  { id: 'quality', label: 'Quality', icon: '⭐' },
];

// Level configs
export const LEVELS = [
  { level: 1, name: 'Newcomer', icon: '🌱', minAura: 0 },
  { level: 2, name: 'Explorer', icon: '📘', minAura: 100 },
  { level: 3, name: 'Contributor', icon: '🧠', minAura: 500 },
  { level: 4, name: 'Mentor', icon: '🔥', minAura: 2000 },
  { level: 5, name: 'Master', icon: '🏆', minAura: 10000 },
];

// Get level info from AURA
export const getLevelInfo = (aura) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (aura >= LEVELS[i].minAura) {
      const currentLevel = LEVELS[i];
      const nextLevel = LEVELS[i + 1];
      const progress = nextLevel 
        ? ((aura - currentLevel.minAura) / (nextLevel.minAura - currentLevel.minAura)) * 100
        : 100;
      return { ...currentLevel, progress: Math.min(progress, 100), nextLevel };
    }
  }
  return { ...LEVELS[0], progress: 0, nextLevel: LEVELS[1] };
};

export default charchaApi;
