/**
 * CodeLearnn YouTube Tracker — Content Script
 * Runs on youtube.com, detects video playback, and reports progress to the service worker.
 *
 * Key challenges:
 * - YouTube is an SPA — navigations don't trigger full page reloads
 * - We use yt-navigate-finish event + MutationObserver to detect new videos
 * - Video player is accessed via document.querySelector('video')
 */

(function () {
  'use strict';

  let currentVideoId = null;
  let progressInterval = null;
  const PROGRESS_INTERVAL_MS = 10000; // Report every 10 seconds for fast sync

  /**
   * Extract video ID from the current URL
   */
  function getVideoId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('v') || null;
  }

  /**
   * Get video metadata from the page DOM
   */
  function getVideoMetadata() {
    const videoEl = document.querySelector('video');
    if (!videoEl) return null;

    const titleEl =
      document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') ||
      document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
      document.querySelector('#title h1 yt-formatted-string') ||
      document.querySelector('h1.style-scope.ytd-watch-metadata');

    const channelEl =
      document.querySelector('#owner #channel-name yt-formatted-string a') ||
      document.querySelector('ytd-channel-name yt-formatted-string a') ||
      document.querySelector('#channel-name a');

    const videoId = getVideoId();

    return {
      videoId,
      title: titleEl?.textContent?.trim() || document.title.replace(' - YouTube', '').trim(),
      channelTitle: channelEl?.textContent?.trim() || '',
      thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '',
      duration: formatDuration(videoEl.duration),
      durationSeconds: Math.round(videoEl.duration || 0),
      currentTime: videoEl.currentTime || 0,
      watchProgress: videoEl.duration
        ? Math.round((videoEl.currentTime / videoEl.duration) * 100)
        : 0,
    };
  }

  /**
   * Format seconds into HH:MM:SS
   */
  function formatDuration(totalSeconds) {
    if (!totalSeconds || isNaN(totalSeconds)) return '';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /**
   * Send progress data to the service worker
   */
  function reportProgress() {
    const meta = getVideoMetadata();
    if (!meta || !meta.videoId) return;

    // Only report if user has actually watched something (at least 5 seconds)
    if (meta.currentTime < 5) return;

    chrome.runtime.sendMessage({
      type: 'VIDEO_PROGRESS',
      data: meta,
    });
  }

  /**
   * Start tracking the current video
   */
  function startTracking(videoId) {
    if (currentVideoId === videoId && progressInterval) return;

    stopTracking();
    currentVideoId = videoId;

    // Wait a bit for the video element to be ready
    setTimeout(() => {
      reportProgress(); // Initial report
      progressInterval = setInterval(reportProgress, PROGRESS_INTERVAL_MS);
    }, 3000);
  }

  /**
   * Stop tracking
   */
  function stopTracking() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  /**
   * Check current page and start/stop tracking as needed
   */
  function checkPage() {
    const videoId = getVideoId();

    if (videoId && window.location.pathname === '/watch') {
      startTracking(videoId);
    } else {
      stopTracking();
      currentVideoId = null;
    }
  }

  // ─── SPA Navigation Detection ───

  // YouTube fires this custom event on SPA navigation
  document.addEventListener('yt-navigate-finish', () => {
    checkPage();
  });

  // Also listen for popstate (back/forward)
  window.addEventListener('popstate', () => {
    setTimeout(checkPage, 500);
  });

  // Initial check on load
  checkPage();

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    // Send final progress before leaving
    reportProgress();
    stopTracking();
  });
})();
