/**
 * CodeLearnn YouTube Tracker — Background Service Worker
 * Receives video progress updates from the content script,
 * batches them, and sends to the CodeLearnn API every 2 minutes.
 */

const API_BASE_URL = 'http://localhost:5000/api';
const FLUSH_ALARM_NAME = 'codelearnn-flush-batch';
const FLUSH_INTERVAL_MINUTES = 0.25; // 15 seconds — near real-time for dashboard

// In-memory batch of video progress updates (keyed by videoId)
let videoBatch = {};

// ─── Message Handling ───

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIDEO_PROGRESS') {
    handleVideoProgress(message.data);
    sendResponse({ received: true });
  } else if (message.type === 'LOGIN') {
    handleLogin(message.data).then(sendResponse);
    return true; // async response
  } else if (message.type === 'LOGOUT') {
    handleLogout().then(sendResponse);
    return true;
  } else if (message.type === 'GET_STATUS') {
    getStatus().then(sendResponse);
    return true;
  }
});

/**
 * Handle video progress update from content script
 * Debounces per videoId — only keeps the latest progress
 */
function handleVideoProgress(data) {
  if (!data || !data.videoId) return;

  const existing = videoBatch[data.videoId];

  // Only update if progress is higher (user watched more)
  if (existing && existing.watchProgress >= data.watchProgress) {
    return;
  }

  videoBatch[data.videoId] = {
    videoId: data.videoId,
    title: data.title,
    channelTitle: data.channelTitle,
    thumbnailUrl: data.thumbnailUrl,
    duration: data.duration,
    durationSeconds: data.durationSeconds,
    watchProgress: data.watchProgress,
  };
}

/**
 * Flush the batch to the CodeLearnn API
 */
async function flushBatch() {
  const videos = Object.values(videoBatch);
  if (videos.length === 0) return;

  // Get JWT token
  const { token } = await chrome.storage.local.get('token');
  if (!token) {
    console.log('[CodeLearnn] No token, skipping flush');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/youtube-tracker/auto-track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ videos }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[CodeLearnn] Flushed ${videos.length} videos`, result.data);
      // Clear only successfully sent videos
      videoBatch = {};

      // Update badge with count
      const totalTracked = result.data?.totalAutoTracked || 0;
      updateBadge(totalTracked);
    } else if (response.status === 401) {
      // Token expired — clear it
      console.log('[CodeLearnn] Token expired, clearing');
      await chrome.storage.local.remove('token');
      updateBadge(0, '!');
    } else {
      console.error('[CodeLearnn] Flush failed:', response.status);
    }
  } catch (err) {
    console.error('[CodeLearnn] Flush network error:', err.message);
  }
}

/**
 * Update extension badge
 */
function updateBadge(count, text) {
  const badgeText = text || (count > 0 ? String(count > 99 ? '99+' : count) : '');
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: text === '!' ? '#EF4444' : '#00E5A0' });
}

// ─── Alarm for periodic flushing ───

chrome.alarms.create(FLUSH_ALARM_NAME, {
  periodInMinutes: FLUSH_INTERVAL_MINUTES,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === FLUSH_ALARM_NAME) {
    flushBatch();
  }
});

// ─── Login / Logout / Status ───

async function handleLogin({ email, password, apiUrl }) {
  // Allow popup to override API URL
  const baseUrl = apiUrl || API_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success && data.token) {
      await chrome.storage.local.set({
        token: data.token,
        user: data.user,
        apiUrl: baseUrl,
      });
      updateBadge(0, '✓');
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message || 'Login failed' };
    }
  } catch (err) {
    return { success: false, message: 'Network error: ' + err.message };
  }
}

async function handleLogout() {
  await chrome.storage.local.remove(['token', 'user']);
  videoBatch = {};
  updateBadge(0);
  return { success: true };
}

async function getStatus() {
  const { token, user, apiUrl } = await chrome.storage.local.get(['token', 'user', 'apiUrl']);
  return {
    isLoggedIn: !!token,
    user: user || null,
    apiUrl: apiUrl || API_BASE_URL,
    pendingVideos: Object.keys(videoBatch).length,
  };
}

// ─── Install / Startup ───

chrome.runtime.onInstalled.addListener(() => {
  console.log('[CodeLearnn] Extension installed');
  updateBadge(0);
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[CodeLearnn] Extension started');
});
