/**
 * EventTracker — Global event tracking service
 * Batches and debounces events, flushes to /api/events/track
 * 
 * Usage:
 *   import EventTracker from '../services/EventTracker';
 *   EventTracker.track('resource_started', 'learning', { resourceId: '...', resourceTitle: '...' });
 */

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://api2.codelearnn.com/api';

class EventTrackerService {
  constructor() {
    this._queue = [];
    this._flushTimer = null;
    this._flushInterval = 5000; // 5 seconds

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush();
      });
    }
  }

  /**
   * Queue an event for batched submission
   * @param {string} eventType - e.g. 'resource_started', 'ai_recommendation_clicked'
   * @param {string} category - e.g. 'learning', 'engagement', 'system'
   * @param {object} data - event-specific data
   */
  track(eventType, category, data = {}) {
    const token = localStorage.getItem('token');
    if (!token) return; // Don't track anonymous users

    this._queue.push({
      eventType,
      category,
      data: {
        ...data,
        source: 'web',
        timestamp: new Date().toISOString(),
      },
    });

    // Reset debounce timer
    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this.flush(), this._flushInterval);

    // Force flush if queue gets big
    if (this._queue.length >= 10) this.flush();
  }

  /**
   * Immediately flush all queued events to the backend
   */
  async flush() {
    if (this._queue.length === 0) return;

    const events = [...this._queue];
    this._queue = [];
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Send events individually (backend expects single event per call)
      // Use sendBeacon for unload, fetch for normal
      for (const event of events) {
        try {
          await fetch(`${API_URL}/events/track`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(event),
            keepalive: true, // Allows request to survive page unload
          });
        } catch {
          // Silently fail — events are best-effort
        }
      }
    } catch {
      // Silently fail
    }
  }

  // Convenience methods for common events
  resourceStarted(resourceId, resourceTitle, resourceType) {
    this.track('resource_started', 'learning', { resourceId, resourceTitle, resourceType });
  }

  resourceCompleted(resourceId, resourceTitle, timeSpent) {
    this.track('resource_completed', 'learning', { resourceId, resourceTitle, timeSpent });
  }

  recommendationClicked(recommendationType, itemId, itemTitle) {
    this.track('ai_recommendation_clicked', 'system', { recommendationType, recommendedItems: [{ id: itemId, title: itemTitle }] });
  }

  pageViewed(pageName) {
    this.track('daily_login', 'engagement', { source: pageName });
  }

  careerExplored(careerId, careerTitle) {
    this.track('path_enrolled', 'learning', { pathTitle: careerTitle, source: 'career_explorer' });
  }
}

// Singleton instance
const EventTracker = new EventTrackerService();
export default EventTracker;
