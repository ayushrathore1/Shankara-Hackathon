const BaseService = require('./BaseService');
const UserCareerJourney = require('../models/UserCareerJourney');

/**
 * WatchJourneyBridge — Links YouTube watch progress with journey resource completion.
 *
 * When a user watches ≥80% of a YouTube video that's linked to a journey resource,
 * it auto-marks the resource as complete, awards XP, and updates phase progress.
 *
 * Called by YouTubeHistoryService.autoTrackVideos() after processing each video.
 */
class WatchJourneyBridge extends BaseService {
  constructor() {
    super('WatchJourneyBridge');
    this.COMPLETION_THRESHOLD = 0.8; // 80% watched = complete
  }

  /**
   * Check if a watched video matches any journey resource and auto-complete it.
   *
   * @param {string} userId - User's MongoDB ID
   * @param {string} videoId - YouTube video ID (e.g., "dQw4w9WgXcQ")
   * @param {number} watchPercentage - How much of the video was watched (0-1)
   * @returns {Promise<Object|null>} Completion result or null if no match / already complete
   */
  async checkAndAutoComplete(userId, videoId, watchPercentage = 0) {
    if (!userId || !videoId) return null;
    if (watchPercentage < this.COMPLETION_THRESHOLD) return null;

    try {
      // Find user's active journey
      const journey = await UserCareerJourney.findOne({
        user: userId,
        status: 'active'
      });

      if (!journey || !journey.roadmap?.phases) return null;

      // Search all phases for a resource with this videoId
      for (const phase of journey.roadmap.phases) {
        if (!phase.resources) continue;

        const resource = phase.resources.find(
          r => r.videoId === videoId && !r.isCompleted
        );

        if (resource) {
          // Auto-complete the resource
          resource.isCompleted = true;
          resource.completedAt = new Date();
          resource.progress = 100;
          resource.autoCompleted = true;
          resource.autoCompletedAt = new Date();

          // Update phase progress
          const completedCount = phase.resources.filter(r => r.isCompleted).length;
          const totalCount = phase.resources.length;
          phase.progress = Math.round((completedCount / totalCount) * 100);

          // Update stats
          journey.stats.resourcesCompleted = (journey.stats.resourcesCompleted || 0) + 1;
          journey.stats.totalLearningMinutes = (journey.stats.totalLearningMinutes || 0) + (resource.duration || 0);
          journey.stats.lastActivityDate = new Date();
          journey.stats.xpEarned = (journey.stats.xpEarned || 0) + 15; // 15 XP for auto-complete (vs 10 manual)

          // Calculate overall progress
          const allPhases = journey.roadmap.phases;
          const totalProgress = allPhases.reduce((sum, p) => sum + (p.progress || 0), 0);
          journey.stats.overallProgress = Math.round(totalProgress / allPhases.length);

          // Add to history
          journey.history.push({
            eventType: 'RESOURCE_COMPLETED',
            eventData: {
              resourceId: resource.externalResourceId || resource._id?.toString(),
              phaseId: phase.phaseId,
              title: resource.title,
              videoId: videoId,
              autoCompleted: true
            },
            xpEarned: 15,
            timestamp: new Date()
          });

          // Check if phase is fully complete
          if (phase.progress >= 100 && phase.status !== 'completed') {
            phase.status = 'completed';
            phase.completedAt = new Date();
            journey.stats.phasesCompleted = (journey.stats.phasesCompleted || 0) + 1;
            journey.stats.xpEarned += 100;

            journey.history.push({
              eventType: 'PHASE_COMPLETED',
              eventData: { phaseId: phase.phaseId, title: phase.title, autoTriggered: true },
              xpEarned: 100,
              timestamp: new Date()
            });

            // Unlock next phase
            const phaseIndex = allPhases.findIndex(p => p.phaseId === phase.phaseId);
            if (phaseIndex < allPhases.length - 1) {
              const nextPhase = allPhases[phaseIndex + 1];
              nextPhase.status = 'in_progress';
              nextPhase.startedAt = new Date();
              journey.roadmap.currentPhaseId = nextPhase.phaseId;
              journey.roadmap.currentPhaseNumber = nextPhase.phaseNumber;
            }
          }

          await journey.save();

          this.log('info', `Auto-completed resource "${resource.title}" for user ${userId} (video: ${videoId})`);

          return {
            autoCompleted: true,
            resourceTitle: resource.title,
            phaseTitle: phase.title,
            phaseProgress: phase.progress,
            xpEarned: 15,
            overallProgress: journey.stats.overallProgress,
          };
        }
      }

      // No matching resource found
      return null;
    } catch (error) {
      this.log('error', `Auto-complete failed for video ${videoId}: ${error.message}`);
      return null;
    }
  }
}

const watchJourneyBridge = new WatchJourneyBridge();
module.exports = watchJourneyBridge;
