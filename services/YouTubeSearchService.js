const BaseService = require('./BaseService');
const youtubeService = require('./YouTubeService');
const { classifyVideo } = require('../utils/videoClassifier');

/**
 * YouTubeSearchService — Searches YouTube for tutorial videos, scores them
 * by quality/relevance/recency, and returns ranked results.
 *
 * Uses YouTube Data API v3 search.list + videos.list for full analysis.
 * Supports language/region preferences for localized results.
 */
class YouTubeSearchService extends BaseService {
  constructor() {
    super('YouTubeSearchService');
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.axios = require('axios');
  }

  // ─── Main Entry Point ──────────────────────────────────────

  /**
   * Search YouTube for tutorial videos on a topic, analyze them, and return ranked results.
   *
   * @param {string} topic - e.g. "React hooks", "Python data science"
   * @param {Object} preferences - User preferences
   * @param {string} preferences.language - 'en' | 'hi' | 'hinglish' | 'auto'
   * @param {string} preferences.region - 'IN' | 'US' | 'GB' | 'global'
   * @param {string} preferences.contentCreatorPreference - 'indian' | 'international' | 'no-preference'
   * @param {number} [maxResults=5] - Number of top results to return
   * @returns {Promise<Object[]>} Ranked array of analyzed video objects
   */
  async searchAndAnalyze(topic, preferences = {}, maxResults = 5) {
    if (!this.apiKey) {
      this.log('warn', 'YouTube API key not configured, skipping video search');
      return [];
    }

    try {
      // 1. Build search query with preference modifiers
      const searchQuery = this._buildSearchQuery(topic, preferences);
      
      // 2. YouTube search.list API → up to 20  candidates
      const candidates = await this._searchVideos(searchQuery, preferences);
      if (candidates.length === 0) return [];

      // 3. Get full details for all candidates (batch request)
      const videoIds = candidates.map(c => c.videoId);
      const detailedVideos = await this._getVideoDetails(videoIds);

      // 4. Merge search snippet data with detailed stats
      const merged = this._mergeResults(candidates, detailedVideos);

      // 5. Score each video
      const scored = merged.map(video => ({
        ...video,
        qualityScore: this._calculateQualityScore(video, topic, preferences),
        relevanceScore: this._calculateRelevanceScore(video, topic),
        category: classifyVideo({ title: video.title, channelTitle: video.channelTitle }),
      }));

      // 6. Sort by quality score descending, return top N
      scored.sort((a, b) => b.qualityScore - a.qualityScore);

      return scored.slice(0, maxResults).map(v => ({
        videoId: v.videoId,
        title: v.title,
        channelTitle: v.channelTitle,
        channelId: v.channelId,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration,
        durationSeconds: v.durationSeconds,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        publishedAt: v.publishedAt,
        qualityScore: v.qualityScore,
        relevanceScore: v.relevanceScore,
        category: v.category,
        youtubeUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        description: (v.description || '').substring(0, 300),
      }));
    } catch (error) {
      this.log('error', `Search failed for "${topic}": ${error.message}`);
      return [];
    }
  }

  // ─── YouTube API Calls ─────────────────────────────────────

  /**
   * Build a search query string incorporating user preferences.
   * NOTE: The caller (enrichWithYouTubeVideos) already appends 'tutorial'
   * to the topic, so we add 'course' for variety and EXCLUDE roadmap/guide content.
   */
  _buildSearchQuery(topic, preferences) {
    // Exclude roadmap/guide overview videos — we want actual course content
    let query = `${topic} course -roadmap -"learning path" -guide`;

    // Add language/region modifiers
    if (preferences.contentCreatorPreference === 'indian') {
      if (preferences.language === 'hi' || preferences.language === 'hinglish') {
        query += ' hindi';
      } else {
        query += ' India';
      }
    }

    // Add recency signal
    const currentYear = new Date().getFullYear();
    query += ` ${currentYear}`;

    return query;
  }

  /**
   * Search YouTube using search.list API with language/region params.
   */
  async _searchVideos(query, preferences = {}) {
    const relevanceLanguage =
      preferences.language === 'hinglish' ? 'hi' :
      preferences.language === 'hi' ? 'hi' :
      preferences.language === 'auto' ? undefined :
      preferences.language || 'en';

    const regionCode =
      preferences.region === 'global' ? undefined :
      preferences.region || 'IN';

    const params = {
      key: this.apiKey,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: 20,
      order: 'relevance',
      videoDuration: 'medium',        // 4-20 min — ideal tutorial length
      videoEmbeddable: 'true',        // Must be embeddable for player
      safeSearch: 'strict',
      videoLicense: 'any',
      ...(relevanceLanguage && { relevanceLanguage }),
      ...(regionCode && { regionCode }),
    };

    const response = await this.axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      { params, timeout: 15000 }
    );

    return (response.data.items || []).map(item => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title || '',
      channelTitle: item.snippet?.channelTitle || '',
      channelId: item.snippet?.channelId || '',
      description: item.snippet?.description || '',
      thumbnailUrl: item.snippet?.thumbnails?.high?.url ||
                    item.snippet?.thumbnails?.medium?.url ||
                    item.snippet?.thumbnails?.default?.url || '',
      publishedAt: item.snippet?.publishedAt || null,
    })).filter(v => v.videoId);
  }

  /**
   * Get full video statistics and content details via videos.list API (batch).
   */
  async _getVideoDetails(videoIds) {
    if (videoIds.length === 0) return [];

    // Batch in groups of 50 (API limit)
    const batches = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      batches.push(videoIds.slice(i, i + 50));
    }

    const allDetails = [];

    for (const batch of batches) {
      const params = {
        key: this.apiKey,
        id: batch.join(','),
        part: 'statistics,contentDetails,snippet',
      };

      const response = await this.axios.get(
        'https://www.googleapis.com/youtube/v3/videos',
        { params, timeout: 15000 }
      );

      for (const item of (response.data.items || [])) {
        allDetails.push({
          videoId: item.id,
          viewCount: parseInt(item.statistics?.viewCount || '0', 10),
          likeCount: parseInt(item.statistics?.likeCount || '0', 10),
          commentCount: parseInt(item.statistics?.commentCount || '0', 10),
          duration: item.contentDetails?.duration || '',
          durationSeconds: this._parseDurationToSeconds(item.contentDetails?.duration),
          description: item.snippet?.description || '',
          tags: item.snippet?.tags || [],
          defaultAudioLanguage: item.snippet?.defaultAudioLanguage || '',
          defaultLanguage: item.snippet?.defaultLanguage || '',
        });
      }
    }

    return allDetails;
  }

  // ─── Scoring ───────────────────────────────────────────────

  /**
   * Merge search snippet data with detailed stats.
   */
  _mergeResults(candidates, details) {
    const detailMap = new Map(details.map(d => [d.videoId, d]));
    return candidates.map(c => ({
      ...c,
      ...(detailMap.get(c.videoId) || {}),
    }));
  }

  /**
   * Calculate overall quality score (0–100).
   *
   * Weights:
   *   View count          15%
   *   Like ratio          10%
   *   Duration sweet spot 15%
   *   Channel trust       10%
   *   Recency             20%  ← Heavily favor 2024-2026 content
   *   Title keyword match 15%
   *   Language match       10%
   *   Description depth    5%
   */
  _calculateQualityScore(video, topic, preferences) {
    let score = 0;

    // 1. View count (15%) — log scale, normalized to ~0-15
    const views = video.viewCount || 0;
    const viewScore = views > 0 ? Math.min(15, (Math.log10(views) / 7) * 15) : 0;
    score += viewScore;

    // 2. Like ratio (10%)
    const likes = video.likeCount || 0;
    const comments = video.commentCount || 0;
    // Estimate dislikes as ~5% of comments (rough heuristic since YT hid dislikes)
    const estimatedDislikes = Math.max(1, comments * 0.05);
    const likeRatio = likes / (likes + estimatedDislikes);
    score += likeRatio * 10;

    // 3. Duration sweet spot (15%) — longer content = actual courses, not overview videos
    const durSec = video.durationSeconds || 0;
    const durMin = durSec / 60;
    let durationScore = 0;
    if (durMin >= 20 && durMin <= 120) durationScore = 15;  // 20min-2hr = ideal course content
    else if (durMin > 120) durationScore = 12;               // 2hr+ = full course, still great
    else if (durMin >= 10 && durMin < 20) durationScore = 8; // 10-20min = decent tutorial
    else if (durMin >= 5 && durMin < 10) durationScore = 4;  // 5-10min = likely overview/guide
    else durationScore = 1;                                  // Under 5min = almost certainly not a tutorial
    score += durationScore;

    // 4. Channel trust (10%) — based on view count as proxy
    // (subscriber count requires channel API call — use views as proxy)
    if (views > 1000000) score += 10;
    else if (views > 100000) score += 8;
    else if (views > 10000) score += 6;
    else if (views > 1000) score += 3;
    else score += 1;

    // 5. Recency (20%) — HEAVILY favor recent content
    const publishDate = video.publishedAt ? new Date(video.publishedAt) : null;
    if (publishDate) {
      const ageMonths = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (ageMonths <= 6) score += 20;         // Last 6 months — perfect
      else if (ageMonths <= 12) score += 17;    // Last year — great
      else if (ageMonths <= 24) score += 12;    // 1-2 years — okay
      else if (ageMonths <= 36) score += 6;     // 2-3 years — getting old
      else score += 2;                           // 3+ years — likely outdated
    }

    // 6. Title keyword match (15%)
    const topicWords = topic.toLowerCase().split(/\s+/);
    const titleLower = (video.title || '').toLowerCase();
    const matchedWords = topicWords.filter(w => w.length > 2 && titleLower.includes(w));
    const titleMatchRatio = topicWords.length > 0 ? matchedWords.length / topicWords.length : 0;
    score += titleMatchRatio * 15;

    // 7. Language match (10%)
    const langPref = preferences.language || 'en';
    const audioLang = (video.defaultAudioLanguage || '').toLowerCase();
    const titleDesc = `${video.title} ${video.description}`.toLowerCase();

    if (langPref === 'hi' || langPref === 'hinglish') {
      // Bonus for Hindi content
      if (audioLang.startsWith('hi') || titleDesc.includes('hindi') || titleDesc.includes('हिन्दी')) {
        score += 10;
      } else if (titleDesc.includes('hinglish')) {
        score += 8;
      } else {
        score += 3; // English is still acceptable
      }
    } else {
      // English preference
      if (!audioLang || audioLang.startsWith('en')) {
        score += 10;
      } else {
        score += 5;
      }
    }

    // 8. Description depth (5%)
    const descLen = (video.description || '').length;
    if (descLen > 500) score += 5;
    else if (descLen > 200) score += 3;
    else score += 1;

    // 9. Content-type penalty — penalize roadmap/guide/overview videos, reward actual courses
    const titleLowerFull = (video.title || '').toLowerCase();
    const roadmapKeywords = ['roadmap', 'learning path', 'guide to become', 'how to become', 'career path', '5 tips', '10 things', 'skills you need', 'don\'t waste'];
    const courseKeywords = ['full course', 'complete course', 'complete tutorial', 'for beginners', 'crash course', 'tutorial for', 'learn ', 'hands on', 'hands-on', 'project based', 'step by step'];

    const isRoadmap = roadmapKeywords.some(kw => titleLowerFull.includes(kw));
    const isCourse = courseKeywords.some(kw => titleLowerFull.includes(kw));

    if (isRoadmap && !isCourse) score -= 20;  // Heavy penalty for pure roadmap/guide videos
    if (isCourse) score += 5;                  // Bonus for actual course content

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Calculate relevance score purely based on topic match (0–100).
   */
  _calculateRelevanceScore(video, topic) {
    const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const text = `${video.title} ${video.description} ${(video.tags || []).join(' ')}`.toLowerCase();
    
    if (topicWords.length === 0) return 50;

    const matchCount = topicWords.filter(w => text.includes(w)).length;
    return Math.round((matchCount / topicWords.length) * 100);
  }

  // ─── Helpers ───────────────────────────────────────────────

  /**
   * Parse ISO 8601 duration (PT1H30M45S) to seconds.
   */
  _parseDurationToSeconds(iso) {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return (parseInt(match[1] || 0) * 3600) +
           (parseInt(match[2] || 0) * 60) +
           (parseInt(match[3] || 0));
  }
}

// Singleton
const youtubeSearchService = new YouTubeSearchService();
module.exports = youtubeSearchService;
