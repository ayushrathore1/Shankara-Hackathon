const BaseService = require('./BaseService');
const User = require('../models/User');

/**
 * DistractionAlertService — Monitors distraction video counts and sends alert emails.
 *
 * When a user has watched more distraction (non-educational) videos than their
 * configured threshold in a given day, it triggers a motivational email nudge.
 *
 * Called by YouTubeHistoryService.autoTrackVideos() after video classification.
 */
class DistractionAlertService extends BaseService {
  constructor() {
    super('DistractionAlertService');
    // Track daily alert state in memory to avoid spamming
    this._alertsSentToday = new Map(); // userId -> Date
  }

  /**
   * Check if a user has exceeded their distraction threshold and send an alert email.
   *
   * @param {string} userId - User's MongoDB ID
   * @param {number} distractionCount - Number of distraction videos watched today
   * @returns {Promise<boolean>} true if alert was sent, false otherwise
   */
  async checkDistractionThreshold(userId, distractionCount) {
    if (!userId || !distractionCount) return false;

    try {
      // 1. Check if we already sent an alert today
      const lastAlert = this._alertsSentToday.get(userId.toString());
      if (lastAlert) {
        const hoursSinceAlert = (Date.now() - lastAlert.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAlert < 12) { // Don't re-alert within 12 hours
          return false;
        }
      }

      // 2. Get user preferences
      const user = await User.findById(userId)
        .select('name email notifications.email.distractionAlerts notifications.email.distractionThreshold')
        .lean();

      if (!user) return false;

      // Check if user opted in to distraction alerts
      const alertsEnabled = user.notifications?.email?.distractionAlerts;
      if (!alertsEnabled) return false;

      const threshold = user.notifications?.email?.distractionThreshold || 5;

      // 3. Check if threshold is exceeded
      if (distractionCount < threshold) return false;

      // 4. Send the alert email
      try {
        const emailService = require('./emailService');
        if (emailService.sendDistractionAlertEmail) {
          await emailService.sendDistractionAlertEmail(user.email, {
            userName: user.name || 'Learner',
            distractionCount,
            threshold,
          });

          this.log('info', `Distraction alert sent to ${user.email} (${distractionCount} distraction videos, threshold: ${threshold})`);
        }
      } catch (emailErr) {
        this.log('warn', `Distraction alert email failed: ${emailErr.message}`);
      }

      // 5. Record that we sent the alert
      this._alertsSentToday.set(userId.toString(), new Date());

      return true;
    } catch (error) {
      this.log('error', `Distraction check failed for user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Clear daily alert tracking (call at midnight or server restart).
   */
  clearDailyAlerts() {
    this._alertsSentToday.clear();
  }
}

const distractionAlertService = new DistractionAlertService();
module.exports = distractionAlertService;
