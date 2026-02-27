import axios from 'axios';

// API URL - uses production on deployed site, localhost for development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_URL = isProduction 
  ? 'https://api-medhaclarity.onrender.com/api' 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  setPassword: (password) => api.post('/auth/set-password', { password }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  logout: () => api.get('/auth/logout')
};

// Contact API
export const contactAPI = {
  submit: (data) => api.post('/contact', data)
};

// Free Resources API
export const freeResourcesAPI = {
  // Get all resources with filters
  getAll: (params = {}) => api.get('/free-resources', { params }),
  
  // Get resource by ID
  getById: (id) => api.get(`/free-resources/${id}`),
  
  // Get resources by category
  getByCategory: (category, params = {}) => 
    api.get(`/free-resources/category/${category}`, { params }),
  
  // Get all categories with stats
  getCategories: () => api.get('/free-resources/categories'),
  
  // ===== COURSES =====
  // Get all courses
  getCourses: (params = {}) => api.get('/free-resources/courses', { params }),
  
  // Get course by slug with lectures
  getCourseBySlug: (slug) => api.get(`/free-resources/courses/${slug}`),
  
  // Get C programming resources
  getCProgramming: (params = {}) => api.get('/free-resources/c-programming', { params }),
  
  // Analyze a YouTube URL
  analyzeVideo: (url) => api.post('/free-resources/analyze', { url }),
  
  // Admin: Create resource
  create: (data) => api.post('/free-resources', data),
  
  // Admin: Add from analysis
  addFromAnalysis: (analysisResult, category, additionalData = {}) =>
    api.post('/free-resources/add-from-analysis', { 
      analysisResult, 
      category, 
      additionalData 
    }),
  
  // Admin: Update resource
  update: (id, data) => api.put(`/free-resources/${id}`, data),
  
  // Admin: Delete resource
  delete: (id) => api.delete(`/free-resources/${id}`),
  
  // Admin: Refresh statistics
  refreshStats: (id) => api.post(`/free-resources/${id}/refresh`),
  
  // Admin: Re-evaluate with AI
  reEvaluate: (id) => api.post(`/free-resources/${id}/evaluate`)
};

// Career Domain Explorer API
export const careerAPI = {
  // Analyze keyword and get career domains
  exploreKeyword: (keyword, location = 'India') => api.post('/career/explore', { keyword, location }),
  
  // Get detailed info about a specific domain
  getDomainDetails: (domainName, parentKeyword) => 
    api.get(`/career/domain/${encodeURIComponent(domainName)}`, { 
      params: { parentKeyword } 
    }),
  
  // Get detailed info about a specific job role
  getJobRoleDetails: (roleName, domain) => 
    api.get(`/career/job-role/${encodeURIComponent(roleName)}`, { 
      params: { domain } 
    }),
  
  // Search for jobs
  searchJobs: (keyword, options = {}) => 
    api.get('/career/jobs/search', { 
      params: { keyword, ...options } 
    }),
  
  // Get trending tech domains (AI-generated)
  getTrending: () => api.get('/career/trending'),
  
  // Get popular searched keywords (from database)
  getPopular: (limit = 12) => api.get('/career/popular', { params: { limit } }),
  
  // Health check
  healthCheck: () => api.get('/career/health'),

  // AI Learning Plan - generates comprehensive real-time learning plan
  getLearningPlan: (keyword) => api.get(`/career/learning-plan/${encodeURIComponent(keyword)}`),

  // Get popular AI learning plans
  getPopularLearningPlans: (limit = 10) => api.get('/career/learning-plans/popular', { params: { limit } })
};

// Learning Paths API (Vault)
export const learningPathsAPI = {
  // Get all learning paths with filters
  getAll: (params = {}) => api.get('/learning-paths', { params }),
  
  // Get learning path by ID or slug
  getById: (idOrSlug) => api.get(`/learning-paths/${idOrSlug}`),
  
  // Get domains with counts
  getDomains: () => api.get('/learning-paths/domains'),
  
  // Admin: Create learning path
  create: (data) => api.post('/learning-paths', data),
  
  // Admin: Update learning path
  update: (id, data) => api.put(`/learning-paths/${id}`, data),
  
  // Admin: Delete learning path
  delete: (id) => api.delete(`/learning-paths/${id}`),
  
  // Enroll in a path (increment count)
  enroll: (id) => api.post(`/learning-paths/${id}/enroll`)
};

// Vault API (Universal Resources)
export const vaultAPI = {
  // Get all resources with filters
  getAll: (params = {}) => api.get('/vault', { params }),
  
  // Get resource by ID
  getById: (id) => api.get(`/vault/${id}`),
  
  // Get featured resources
  getFeatured: (limit = 10) => api.get('/vault/featured', { params: { limit } }),
  
  // Get all categories
  getCategories: (params = {}) => api.get('/vault/categories', { params }),
  
  // Get topics by domain
  getTopics: (domain) => api.get(`/vault/topics/${domain}`),
  
  // Get all domains with counts
  getDomains: () => api.get('/vault/domains'),
  
  // Create resource (auth required)
  create: (data) => api.post('/vault', data),
  
  // Bulk import resources (auth required)
  bulkImport: (resources) => api.post('/vault/bulk', { resources }),
  
  // Update resource (auth required)
  update: (id, data) => api.put(`/vault/${id}`, data),
  
  // Delete resource (auth required)
  delete: (id) => api.delete(`/vault/${id}`)
};

// Progress API (User Learning Progress)
export const progressAPI = {
  // Get user's full progress
  getMyProgress: () => api.get('/progress/me'),
  
  // Get learning stats
  getStats: () => api.get('/progress/stats'),
  
  // Get saved/bookmarked resources
  getSaved: (params = {}) => api.get('/progress/saved', { params }),
  
  // Get in-progress resources
  getInProgress: () => api.get('/progress/in-progress'),
  
  // Get completed resources
  getCompleted: (params = {}) => api.get('/progress/completed', { params }),
  
  // Start a resource
  startResource: (resourceId) => api.post('/progress/start', { resourceId }),
  
  // Update progress on a resource
  updateProgress: (resourceId, progress, timeSpent = 0) => 
    api.put('/progress/update', { resourceId, progress, timeSpent }),
  
  // Complete a resource
  completeResource: (resourceId, rating = null, notes = '', timeSpent = 0) =>
    api.post('/progress/complete', { resourceId, rating, notes, timeSpent }),
  
  // Save/bookmark a resource
  saveResource: (resourceId) => api.post('/progress/save', { resourceId }),
  
  // Remove bookmark
  unsaveResource: (resourceId) => api.delete(`/progress/save/${resourceId}`),
  
  // Check resource status for current user
  checkResource: (resourceId) => api.get(`/progress/check/${resourceId}`)
};

// Personalized Learning Path API (AI-generated)
export const personalizedPathAPI = {
  // Generate a new personalized path
  generate: (data) => api.post('/personalized-path/generate', data),
  
  // Get user's paths
  getMyPaths: (status = null) => 
    api.get('/personalized-path/my-paths', { params: status ? { status } : {} }),
  
  // Get path by ID
  getById: (id) => api.get(`/personalized-path/${id}`),
  
  // Complete a resource in a path
  completeResource: (pathId, milestoneIndex, resourceId) =>
    api.post(`/personalized-path/${pathId}/complete-resource`, { milestoneIndex, resourceId }),
  
  // Update path status (pause/resume)
  updateStatus: (id, status) => api.put(`/personalized-path/${id}/status`, { status }),
  
  // Delete/abandon path
  delete: (id) => api.delete(`/personalized-path/${id}`)
};

// Gamification API
export const gamificationAPI = {
  // Get gamification profile (XP, rank, streaks, achievements)
  getProfile: () => api.get('/gamification/profile'),
  
  // Record daily activity (updates streak)
  heartbeat: () => api.post('/gamification/heartbeat'),
  
  // Get user's achievements
  getAchievements: (params = {}) => api.get('/gamification/achievements', { params }),
  
  // Get all achievement definitions (for gallery)
  getDefinitions: () => api.get('/gamification/achievements/definitions'),
  
  // Get career rank info
  getRanks: () => api.get('/gamification/ranks'),
  
  // Get XP leaderboard
  getLeaderboard: (limit = 20) => api.get('/gamification/leaderboard', { params: { limit } }),
  
  // Get referral info
  getReferral: () => api.get('/gamification/referral'),
  
  // Track referral signup
  trackReferral: (referralCode) => api.post('/gamification/referral/track', { referralCode })
};

// Blogs API
export const blogsAPI = {
  // Get all published blogs with filters
  getAll: (params = {}) => api.get('/blogs', { params }),
  
  // Get blog by slug or ID
  getBySlug: (slug) => api.get(`/blogs/${slug}`),
  
  // Get categories with counts
  getCategories: () => api.get('/blogs/categories'),
  
  // Get user's own blogs
  getMyBlogs: (params = {}) => api.get('/blogs/user/my-blogs', { params }),
  
  // Create blog
  create: (data) => api.post('/blogs', data),
  
  // Update blog
  update: (id, data) => api.put(`/blogs/${id}`, data),
  
  // Delete blog
  delete: (id) => api.delete(`/blogs/${id}`),
  
  // Toggle like
  like: (id) => api.post(`/blogs/${id}/like`)
};

// Opportunities API
export const opportunitiesAPI = {
  // Get all opportunities with filters
  getAll: (params = {}) => api.get('/opportunities', { params }),
  
  // Get featured opportunities
  getFeatured: (limit = 5) => api.get('/opportunities/featured', { params: { limit } }),
  
  // Get opportunity by slug or ID
  getBySlug: (slug) => api.get(`/opportunities/${slug}`),
  
  // Get types with counts
  getTypes: () => api.get('/opportunities/types'),
  
  // Get user's own opportunities
  getMyOpportunities: (params = {}) => api.get('/opportunities/user/my-opportunities', { params }),
  
  // Create opportunity
  create: (data) => api.post('/opportunities', data),
  
  // Update opportunity
  update: (id, data) => api.put(`/opportunities/${id}`, data),
  
  // Delete opportunity
  delete: (id) => api.delete(`/opportunities/${id}`)
};

// Skills API (User skill tracking)
export const skillsAPI = {
  // Get user's skills
  getMySkills: (params = {}) => api.get('/skills/me', { params }),
  
  // Get user's top skills
  getTopSkills: (limit = 10) => api.get('/skills/top', { params: { limit } }),
  
  // Get skill gaps for a target role
  getSkillGaps: (targetRole) => api.get(`/skills/gaps/${encodeURIComponent(targetRole)}`),
  
  // Get specific skill details
  getSkill: (skillName) => api.get(`/skills/${encodeURIComponent(skillName)}`),
  
  // Get skill categories
  getCategories: () => api.get('/skills/meta/categories'),
  
  // Get popular skills
  getPopularSkills: () => api.get('/skills/meta/popular')
};

// Events API (User activity tracking)
export const eventsAPI = {
  // Get recent activity
  getRecent: (limit = 20) => api.get('/events/recent', { params: { limit } }),
  
  // Get learning stats
  getLearningStats: () => api.get('/events/stats/learning'),
  
  // Get activity summary
  getSummary: (startDate, endDate) => api.get('/events/summary', { params: { startDate, endDate } }),
  
  // Get activity heatmap
  getHeatmap: (days = 365) => api.get('/events/heatmap', { params: { days } })
};

// Career Journey API
export const journeyAPI = {
  // Get active journey
  getActive: () => api.get('/journey/active'),
  
  // Get journey overview (dashboard data)
  getOverview: () => api.get('/journey/overview'),
  
  // Get full roadmap
  getRoadmap: () => api.get('/journey/roadmap'),
  
  // Get next recommended actions
  getNextActions: () => api.get('/journey/next-actions'),
  
  // Get journey history/timeline
  getHistory: (limit = 20) => api.get('/journey/history', { params: { limit } }),
  
  // Start a new journey
  start: (career, preferences) => api.post('/journey/start', { career, preferences }),
  
  // Complete a resource
  completeResource: (phaseId, resourceId) => api.post('/journey/resource/complete', { phaseId, resourceId }),
  
  // Pause/Resume journey
  togglePause: () => api.post('/journey/toggle-pause'),

  // Regenerate roadmap with real YouTube resources
  regenerateRoadmap: () => api.post('/journey/regenerate-roadmap'),
};

// ML Recommendations API
export const recommendationsAPI = {
  // Get personalized recommendations (authenticated)
  get: (limit = 5) => api.get('/recommendations', { params: { limit } }),

  // Get trending courses (public, for new users)
  getTrending: (limit = 5) => api.get('/recommendations/trending', { params: { limit } }),
};

// Career Profile API (career save, switch, history)
export const careerProfileAPI = {
  // Get active career + history summary
  get: () => api.get('/career-profile'),

  // Save/set active career (auto-save on selection)
  set: (careerData) => api.post('/career-profile/set', careerData),

  // Switch career (pause current, activate target)
  switch: (targetJourneyId) => api.post('/career-profile/switch', { targetJourneyId }),

  // Get detailed career history
  getHistory: () => api.get('/career-profile/history'),
};

// ============================================
// NEW: Saved Videos API (User's saved analyzed videos)
// ============================================
export const savedVideosAPI = {
  // Get all saved videos
  getAll: (params = {}) => api.get('/saved-videos', { params }),
  
  // Get unassigned videos (not in any path)
  getUnassigned: (limit = 10) => api.get('/saved-videos/unassigned', { params: { limit } }),
  
  // Check if video is saved
  check: (videoId) => api.get(`/saved-videos/check/${videoId}`),
  
  // Get specific saved video with full analysis
  getById: (videoId) => api.get(`/saved-videos/${videoId}`),
  
  // Save a video (after analysis)
  save: (videoId) => api.post('/saved-videos', { videoId }),
  
  // Add video to a specific path
  addToPath: (videoId, pathId) => api.put(`/saved-videos/${videoId}/add-to-path/${pathId}`),
  
  // Remove saved video (soft delete)
  delete: (videoId) => api.delete(`/saved-videos/${videoId}`)
};

// ============================================
// NEW: User Learning Paths API
// ============================================
export const userLearningPathsAPI = {
  // Get all user's learning paths
  getAll: (params = {}) => api.get('/user/learning-paths', { params }),
  
  // Get active learning path
  getActive: () => api.get('/user/learning-paths/active'),
  
  // Get specific path by ID
  getById: (id) => api.get(`/user/learning-paths/${id}`),
  
  // Create new learning path
  create: (data) => api.post('/user/learning-paths', data),
  
  // Update learning path
  update: (id, data) => api.put(`/user/learning-paths/${id}`, data),
  
  // Activate a path (set as current)
  activate: (id) => api.put(`/user/learning-paths/${id}/activate`),
  
  // Add video to path
  addVideo: (pathId, videoId, previousNodeId = null) => 
    api.post(`/user/learning-paths/${pathId}/add-video`, { videoId, previousNodeId }),
  
  // Reorder nodes in path
  reorder: (pathId, nodeOrder) => 
    api.put(`/user/learning-paths/${pathId}/reorder`, { nodeOrder }),
  
  // Mark node as complete
  completeNode: (pathId, nodeId) => 
    api.put(`/user/learning-paths/${pathId}/complete-node/${nodeId}`),
  
  // Delete path (soft delete)
  delete: (id) => api.delete(`/user/learning-paths/${id}`),
  
  // ===== Branching/Graph Operations =====
  
  // Remove a node from path (keeps video in library)
  removeNode: (pathId, nodeId) => 
    api.delete(`/user/learning-paths/${pathId}/remove-node/${nodeId}`),
  
  // Create a branch from an existing node
  createBranch: (pathId, fromNodeId, videoId, edgeType = 'optional') =>
    api.post(`/user/learning-paths/${pathId}/create-branch`, { fromNodeId, videoId, edgeType }),
  
  // Add an optional edge between existing nodes
  addEdge: (pathId, fromNodeId, toNodeId) =>
    api.post(`/user/learning-paths/${pathId}/add-edge`, { fromNodeId, toNodeId }),
  
  // Remove an edge between nodes
  removeEdge: (pathId, fromNodeId, toNodeId) =>
    api.delete(`/user/learning-paths/${pathId}/remove-edge`, { data: { fromNodeId, toNodeId } }),
  
  // Get nodes available to start next (prerequisites completed)
  getNextAvailable: (pathId) => 
    api.get(`/user/learning-paths/${pathId}/next-available`),
  
  // Check if path has branching structure
  hasBranching: (pathId) => 
    api.get(`/user/learning-paths/${pathId}/has-branching`),
  
  // ===== Visibility & Sharing =====
  
  // Toggle visibility (private/public)
  setVisibility: (pathId, visibility) =>
    api.put(`/user/learning-paths/${pathId}/visibility`, { visibility }),
  
  // Browse public paths
  browsePublic: (params = {}) =>
    api.get('/user/learning-paths/public/browse', { params }),
  
  // Get public path by slug
  getPublicPath: (slug) =>
    api.get(`/user/learning-paths/public/${slug}`),
  
  // Clone a public path
  clonePath: (pathId) =>
    api.post(`/user/learning-paths/clone/${pathId}`),
  
  // ===== Versioning Operations =====
  
  // Get version history for a path
  getVersionHistory: (pathId, params = {}) =>
    api.get(`/user/learning-paths/${pathId}/versions`, { params }),
  
  // Get a specific version
  getVersion: (pathId, versionNumber) =>
    api.get(`/user/learning-paths/${pathId}/versions/${versionNumber}`),
  
  // Compare two versions
  compareVersions: (pathId, fromVersion, toVersion) =>
    api.get(`/user/learning-paths/${pathId}/versions/compare`, { 
      params: { from: fromVersion, to: toVersion } 
    }),
  
  // Restore to a specific version
  restoreVersion: (pathId, versionNumber) =>
    api.post(`/user/learning-paths/${pathId}/versions/restore/${versionNumber}`),
  
  // Get AI suggestion stats
  getAISuggestionStats: (days = 30) =>
    api.get('/user/learning-paths/ai-suggestion-stats', { params: { days } })
};

// ============================================
// AI Suggestions API
// ============================================
export const aiSuggestionsAPI = {
  // Get pending suggestions for user
  getAll: (params = {}) => api.get('/ai-suggestions', { params }),
  
  // Get pending suggestions for a path
  getForPath: (pathId, params = {}) => 
    api.get(`/ai-suggestions/path/${pathId}`, { params }),
  
  // Generate new suggestions for a path
  generate: (pathId, trigger = 'user_requested', context = {}) =>
    api.post(`/ai-suggestions/generate/${pathId}`, { trigger, context }),
  
  // Accept a suggestion
  accept: (suggestionId, feedback = null) =>
    api.put(`/ai-suggestions/${suggestionId}/accept`, { feedback }),
  
  // Reject a suggestion
  reject: (suggestionId, feedback = null) =>
    api.put(`/ai-suggestions/${suggestionId}/reject`, { feedback }),
  
  // Dismiss a suggestion
  dismiss: (suggestionId) =>
    api.put(`/ai-suggestions/${suggestionId}/dismiss`),
  
  // Get suggestion stats
  getStats: (days = 30) =>
    api.get('/ai-suggestions/stats', { params: { days } })
};

// ============================================
// Career Readiness API
// ============================================
export const careerReadinessAPI = {
  // Get readiness score
  getReadiness: (careerId = null) =>
    api.get('/readiness', { params: careerId ? { careerId } : {} }),
  
  // Get skills gap analysis
  getSkillsGap: (careerId = null) =>
    api.get('/readiness/skills-gap', { params: careerId ? { careerId } : {} }),
  
  // Refresh readiness for a path
  refresh: (pathId) =>
    api.put(`/readiness/refresh/${pathId}`)
};

// ============================================
// YouTube Tracker API (Watch History Tracking)
// ============================================
export const youtubeTrackerAPI = {
  // Get full progress dashboard
  getProgress: () => api.get('/youtube-tracker'),

  // Grant tracking consent
  grantConsent: () => api.post('/youtube-tracker/consent'),

  // Revoke tracking consent
  revokeConsent: (clearData = false) =>
    api.delete('/youtube-tracker/consent', { params: { clearData } }),

  // Add playlist to track
  addPlaylist: (url) => api.post('/youtube-tracker/playlist', { url }),

  // Get playlist progress detail
  getPlaylistProgress: (playlistId) =>
    api.get(`/youtube-tracker/playlist/${playlistId}`),

  // Remove playlist from tracking
  removePlaylist: (playlistId) =>
    api.delete(`/youtube-tracker/playlist/${playlistId}`),

  // Add standalone video to track
  addVideo: (url) => api.post('/youtube-tracker/video', { url }),

  // Update video watch progress (0-100)
  updateVideoProgress: (videoId, watchProgress = 100) =>
    api.put(`/youtube-tracker/video/${videoId}/progress`, { watchProgress }),

  // Mark video as unwatched
  unwatchVideo: (videoId) =>
    api.put(`/youtube-tracker/video/${videoId}/unwatch`),

  // Remove standalone video
  removeVideo: (videoId) =>
    api.delete(`/youtube-tracker/video/${videoId}`),

  // Auto-tracked history (from Chrome extension)
  getAutoTracked: (page = 1, limit = 20) =>
    api.get(`/youtube-tracker/auto-tracked?page=${page}&limit=${limit}`),

  // Subscribe to live activity stream (SSE)
  subscribeLive: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const baseURL = api.defaults.baseURL;
    return new EventSource(`${baseURL}/youtube-tracker/live?token=${token}`);
  },
};

export default api;
