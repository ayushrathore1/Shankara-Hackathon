const BaseService = require('./BaseService');
const FreeResource = require('../models/FreeResource');
const YouTubeAnalysisCache = require('../models/YouTubeAnalysisCache');
const youtubeService = require('./YouTubeService');
const groqService = require('./GroqService');
const axios = require('axios');

// ML Classifier service URL
const ML_CLASSIFIER_URL = process.env.ML_CLASSIFIER_URL || 'http://localhost:8100';

/**
 * FreeResourceService - Business logic layer for free resources
 * Orchestrates YouTube API, AI evaluation, and database operations
 * Now with persistent caching for tech tutorials
 */
class FreeResourceService extends BaseService {
  constructor() {
    super('FreeResourceService');
    this.defaultCategories = [
      { id: 'web-dev', name: 'Web Development', icon: '🌐' },
      { id: 'java', name: 'Java', icon: '☕' },
      { id: 'data-science', name: 'Data Science', icon: '📊' },
      { id: 'python', name: 'Python', icon: '🐍' },
      { id: 'c-programming', name: 'C Programming', icon: '⚡' },
      { id: 'dsa', name: 'DSA', icon: '🔢' },
      { id: 'devops', name: 'DevOps', icon: '⚙️' },
      { id: 'mobile', name: 'Mobile Dev', icon: '📱' },
      { id: 'other', name: 'Other', icon: '📚' }
    ];
  }

  /**
   * Get all categories
   * @returns {Object[]} Array of category objects
   */
  getCategories() {
    return this.defaultCategories;
  }

  /**
   * Analyze a YouTube video URL
   * Returns video details and AI evaluation
   * @param {string} url - YouTube video or playlist URL
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeVideo(url) {
    try {
      // Check if this is a playlist URL
      if (youtubeService.isPlaylistUrl(url)) {
        return this.analyzePlaylist(url);
      }

      // Validate URL
      if (!youtubeService.isValidYouTubeUrl(url)) {
        throw new Error('Invalid YouTube URL');
      }

      const videoId = youtubeService.extractVideoId(url);
      this.log('info', `Analyzing video: ${videoId}`);

      // Check analysis cache first (for previously analyzed tutorials)
      try {
        const cachedAnalysis = await YouTubeAnalysisCache.findByYoutubeId(videoId);
        if (cachedAnalysis) {
          this.log('info', `Cache hit for video: ${videoId}`);
          return {
            isNew: false,
            isPlaylist: false,
            fromCache: true,
            cacheUsageCount: cachedAnalysis.usageCount,
            videoData: {
              youtubeId: cachedAnalysis.youtubeId,
              title: cachedAnalysis.title,
              thumbnail: cachedAnalysis.thumbnail,
              channelName: cachedAnalysis.channelName,
              duration: cachedAnalysis.duration,
              category: cachedAnalysis.category,
              subcategory: cachedAnalysis.subcategory,
              tags: cachedAnalysis.tags
            },
            evaluation: cachedAnalysis.analysisData.evaluation,
            engagement: cachedAnalysis.analysisData.engagement,
            message: 'Analysis retrieved from cache'
          };
        }
      } catch (cacheError) {
        this.log('warn', `Cache check failed: ${cacheError.message}`);
      }

      // Check if already in curated database
      const existing = await FreeResource.findOne({ youtubeId: videoId });
      if (existing) {
        this.log('info', `Video ${videoId} already exists in database`);
        return {
          isNew: false,
          isPlaylist: false,
          resource: existing,
          message: 'This video is already in our curated collection'
        };
      }

      // Fetch video details from YouTube
      const videoData = await youtubeService.getVideoDetails(videoId);
      
      // Fetch comments for analysis
      const comments = await youtubeService.getVideoComments(videoId, 30);

      // Get AI evaluation
      const evaluation = await groqService.evaluateVideoQuality(videoData, comments);

      // Calculate engagement metrics
      const engagement = youtubeService.calculateEngagement(videoData.statistics);

      const result = {
        isNew: true,
        isPlaylist: false,
        videoData: {
          youtubeId: videoId,
          title: videoData.title,
          description: videoData.description?.substring(0, 500),
          thumbnail: videoData.thumbnails?.high?.url || videoData.thumbnails?.medium?.url,
          channelName: videoData.channelTitle,
          channelId: videoData.channelId,
          duration: videoData.duration,
          publishedAt: videoData.publishedAt,
          tags: videoData.tags?.slice(0, 10),
          statistics: videoData.statistics
        },
        evaluation,
        engagement,
        message: 'Video analyzed successfully'
      };

      // Save to cache if it's a programming tutorial
      if (evaluation.isProgrammingTutorial) {
        await this.saveVideoToCache(videoId, videoData, evaluation, engagement);
      } else {
        this.log('info', `Video ${videoId} is not a programming tutorial, not caching`);
      }

      return result;
    } catch (error) {
      this.handleError(error, 'analyzeVideo');
    }
  }

  /**
   * Save analyzed video to cache with ML-powered auto-categorization
   */
  async saveVideoToCache(videoId, videoData, evaluation, engagement) {
    try {
      // Use ML classifier for intelligent categorization
      const classification = await this.classifyAndAssignCourse(videoData, evaluation);
      const category = classification.category || this.mapToCategory(evaluation.detectedCategory);
      const subcategory = evaluation.detectedSubcategory || '';
      const tags = this.extractTags(evaluation, videoData);

      const cacheEntry = new YouTubeAnalysisCache({
        youtubeId: videoId,
        type: 'video',
        title: videoData.title,
        channelName: videoData.channelTitle,
        thumbnail: videoData.thumbnails?.high?.url || videoData.thumbnails?.medium?.url,
        duration: videoData.duration,
        category,
        subcategory,
        tags,
        analysisData: { evaluation, engagement, mlClassification: classification }
      });

      await cacheEntry.save();
      this.log('info', `Saved video to cache: ${videoId} [${category}/${subcategory}] (ML course: ${classification.courseName || 'none'})`);
    } catch (error) {
      if (error.code !== 11000) {
        this.log('warn', `Failed to cache video: ${error.message}`);
      }
    }
  }

  /**
   * Map AI detected category to our category system
   */
  mapToCategory(detectedCategory) {
    if (!detectedCategory) return 'other';
    const cat = detectedCategory.toLowerCase();
    
    if (cat.includes('web') || cat.includes('frontend') || cat.includes('backend') || cat.includes('react') || cat.includes('node') || cat.includes('javascript')) return 'web-dev';
    if (cat.includes('python')) return 'python';
    if (cat.includes('java') && !cat.includes('javascript')) return 'java';
    if (cat.includes('data') || cat.includes('ml') || cat.includes('machine learning') || cat.includes('ai')) return 'data-science';
    if (cat.includes('dsa') || cat.includes('algorithm') || cat.includes('data structure')) return 'dsa';
    if (cat.includes('devops') || cat.includes('docker') || cat.includes('kubernetes') || cat.includes('cloud')) return 'devops';
    if (cat.includes('mobile') || cat.includes('android') || cat.includes('ios') || cat.includes('flutter')) return 'mobile';
    
    return 'other';
  }

  /**
   * Extract tags from evaluation and video data
   */
  extractTags(evaluation, videoData) {
    const tags = new Set();
    
    if (evaluation.detectedTechnologies) {
      evaluation.detectedTechnologies.forEach(t => tags.add(t.toLowerCase()));
    }
    if (evaluation.detectedCategory) {
      tags.add(evaluation.detectedCategory.toLowerCase());
    }
    if (videoData.tags) {
      videoData.tags.slice(0, 5).forEach(t => tags.add(t.toLowerCase()));
    }
    
    return [...tags].slice(0, 10);
  }

  /**
   * Classify a video using the ML microservice and assign it to a course.
   * Falls back to rule-based mapToCategory() if the ML service is unavailable.
   * @param {Object} videoData - Video metadata from YouTube API
   * @param {Object} evaluation - AI evaluation from GroqService
   * @returns {Promise<Object>} Classification result { courseId, courseName, category, isNewCourse, confidence }
   */
  async classifyAndAssignCourse(videoData, evaluation) {
    try {
      const response = await axios.post(`${ML_CLASSIFIER_URL}/classify`, {
        title: videoData.title,
        tags: this.extractTags(evaluation, videoData),
        summary: evaluation.summary || '',
        topics: evaluation.topicsCovered || [],
        category: evaluation.detectedCategory || '',
        subcategory: evaluation.detectedSubcategory || '',
        channel: videoData.channelTitle || '',
        duration: videoData.duration || '',
        score: evaluation.codeLearnnScore || 0,
        youtubeId: videoData.id || '',
        thumbnail: videoData.thumbnails?.high?.url || videoData.thumbnails?.medium?.url || '',
        recommendedFor: evaluation.recommendedFor || ''
      }, {
        timeout: 15000  // 15 second timeout
      });

      this.log('info', `ML classification: ${response.data.courseName} (confidence: ${response.data.confidence})`);
      return response.data;
    } catch (error) {
      // Graceful fallback to rule-based classification
      this.log('warn', `ML classifier unavailable (${error.message}), falling back to rule-based classification`);
      return {
        courseId: null,
        courseName: null,
        category: this.mapToCategory(evaluation.detectedCategory),
        isNewCourse: false,
        confidence: 0,
        matchDetails: { reason: 'ml_service_unavailable', fallback: true }
      };
    }
  }

  /**
   * Save analyzed playlist to cache with auto-categorization
   */
  async savePlaylistToCache(playlistId, playlistDetails, result, detectedCategories) {
    try {
      // Find most common category from analyzed videos
      const categoryCount = {};
      detectedCategories.forEach(cat => {
        const mapped = this.mapToCategory(cat);
        categoryCount[mapped] = (categoryCount[mapped] || 0) + 1;
      });
      const category = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

      // Extract tags from all video analyses
      const allTags = new Set();
      if (result.evaluation.videoAnalyses) {
        result.evaluation.videoAnalyses.forEach(v => {
          if (v.detectedCategory) allTags.add(v.detectedCategory.toLowerCase());
        });
      }

      const cacheEntry = new YouTubeAnalysisCache({
        youtubeId: playlistId,
        type: 'playlist',
        title: playlistDetails.title,
        channelName: playlistDetails.channelTitle,
        thumbnail: playlistDetails.thumbnail,
        duration: `${result.aggregateStats.avgDurationMinutes} min avg`,
        category,
        subcategory: '',
        tags: [...allTags].slice(0, 10),
        analysisData: {
          evaluation: result.evaluation,
          aggregateStats: result.aggregateStats
        }
      });

      await cacheEntry.save();
      this.log('info', `Saved playlist to cache: ${playlistId} [${category}]`);
    } catch (error) {
      if (error.code !== 11000) {
        this.log('warn', `Failed to cache playlist: ${error.message}`);
      }
    }
  }

  /**
   * Analyze a YouTube playlist
   * Evaluates multiple videos and provides aggregate assessment
   * @param {string} url - YouTube playlist URL
   * @returns {Promise<Object>} Playlist analysis result
   */
  async analyzePlaylist(url) {
    try {
      const playlistId = youtubeService.extractPlaylistId(url);
      if (!playlistId) {
        throw new Error('Invalid playlist URL');
      }

      this.log('info', `Analyzing playlist: ${playlistId}`);

      // Check analysis cache first
      try {
        const cachedAnalysis = await YouTubeAnalysisCache.findByYoutubeId(playlistId);
        if (cachedAnalysis) {
          this.log('info', `Cache hit for playlist: ${playlistId}`);
          return {
            isNew: false,
            isPlaylist: true,
            fromCache: true,
            cacheUsageCount: cachedAnalysis.usageCount,
            playlistData: {
              playlistId: cachedAnalysis.youtubeId,
              title: cachedAnalysis.title,
              thumbnail: cachedAnalysis.thumbnail,
              channelName: cachedAnalysis.channelName,
              category: cachedAnalysis.category,
              subcategory: cachedAnalysis.subcategory,
              tags: cachedAnalysis.tags
            },
            evaluation: cachedAnalysis.analysisData.evaluation,
            aggregateStats: cachedAnalysis.analysisData.aggregateStats,
            message: 'Playlist analysis retrieved from cache'
          };
        }
      } catch (cacheError) {
        this.log('warn', `Playlist cache check failed: ${cacheError.message}`);
      }

      // Get playlist details
      const playlistDetails = await youtubeService.getPlaylistDetails(playlistId);
      
      // Get playlist items (limit to 15 for efficiency)
      const playlistItems = await youtubeService.getPlaylistItems(playlistId, 15);
      
      if (!playlistItems || playlistItems.length === 0) {
        throw new Error('Playlist is empty or private');
      }

      // Get full video details for all items (batch request - efficient)
      const videoIds = playlistItems.map(item => item.videoId);
      const videoDetails = await youtubeService.getMultipleVideoDetails(videoIds);

      // Analyze a sample of videos (first 5 for speed, or all if fewer)
      const samplesToAnalyze = Math.min(5, videoDetails.length);
      const videoAnalyses = [];
      let totalScore = 0;
      let programmingVideoCount = 0;
      let nonProgrammingVideos = [];
      let detectedCategories = [];
      
      // Aggregate breakdown scores
      const aggregateBreakdown = {
        contentQuality: 0,
        teachingClarity: 0,
        practicalValue: 0,
        upToDateScore: 0,
        commentSentiment: 0,
        engagement: 0
      };
      
      // Collect all strengths and weaknesses
      const allStrengths = [];
      const allWeaknesses = [];
      const allRedFlags = [];

      for (let i = 0; i < samplesToAnalyze; i++) {
        const video = videoDetails[i];
        try {
          // Get comments for this video
          const comments = await youtubeService.getVideoComments(video.id, 20);
          
          // Get AI evaluation
          const evaluation = await groqService.evaluateVideoQuality(video, comments);
          
          videoAnalyses.push({
            videoId: video.id,
            title: video.title,
            thumbnail: video.thumbnails?.medium?.url,
            duration: video.duration,
            score: evaluation.codeLearnnScore,
            isProgrammingTutorial: evaluation.isProgrammingTutorial,
            detectedCategory: evaluation.detectedCategory,
            recommendation: evaluation.recommendation,
            breakdown: evaluation.breakdown,
            strengths: evaluation.strengths?.slice(0, 2),
            weaknesses: evaluation.weaknesses?.slice(0, 2),
            summary: evaluation.summary?.substring(0, 150)
          });

          if (evaluation.isProgrammingTutorial) {
            totalScore += evaluation.codeLearnnScore;
            programmingVideoCount++;
            if (evaluation.detectedCategory) {
              detectedCategories.push(evaluation.detectedCategory);
            }
            
            // Aggregate breakdown scores
            if (evaluation.breakdown) {
              aggregateBreakdown.contentQuality += evaluation.breakdown.contentQuality || 0;
              aggregateBreakdown.teachingClarity += evaluation.breakdown.teachingClarity || 0;
              aggregateBreakdown.practicalValue += evaluation.breakdown.practicalValue || 0;
              aggregateBreakdown.upToDateScore += evaluation.breakdown.upToDateScore || 0;
              aggregateBreakdown.commentSentiment += evaluation.breakdown.commentSentiment || 0;
              aggregateBreakdown.engagement += evaluation.breakdown.engagement || 0;
            }
            
            // Collect strengths and weaknesses
            if (evaluation.strengths) allStrengths.push(...evaluation.strengths);
            if (evaluation.weaknesses) allWeaknesses.push(...evaluation.weaknesses);
            if (evaluation.redFlags) allRedFlags.push(...evaluation.redFlags);
          } else {
            nonProgrammingVideos.push({
              title: video.title,
              detectedCategory: evaluation.detectedCategory
            });
          }
        } catch (err) {
          this.log('warn', `Failed to analyze video ${video.id}: ${err.message}`);
        }
      }

      // Calculate averages for breakdown
      if (programmingVideoCount > 0) {
        aggregateBreakdown.contentQuality = Math.round(aggregateBreakdown.contentQuality / programmingVideoCount);
        aggregateBreakdown.teachingClarity = Math.round(aggregateBreakdown.teachingClarity / programmingVideoCount);
        aggregateBreakdown.practicalValue = Math.round(aggregateBreakdown.practicalValue / programmingVideoCount);
        aggregateBreakdown.upToDateScore = Math.round(aggregateBreakdown.upToDateScore / programmingVideoCount);
        aggregateBreakdown.commentSentiment = Math.round(aggregateBreakdown.commentSentiment / programmingVideoCount);
        aggregateBreakdown.engagement = Math.round(aggregateBreakdown.engagement / programmingVideoCount);
      }

      // Get unique top strengths and weaknesses (deduplicated)
      const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
      const uniqueWeaknesses = [...new Set(allWeaknesses)].slice(0, 5);
      const uniqueRedFlags = [...new Set(allRedFlags)].slice(0, 3);

      // Calculate aggregate score
      const avgScore = programmingVideoCount > 0 
        ? Math.round(totalScore / programmingVideoCount) 
        : 0;

      // Determine playlist quality tier
      let qualityTier;
      if (avgScore >= 80) qualityTier = 'excellent';
      else if (avgScore >= 65) qualityTier = 'good';
      else if (avgScore >= 50) qualityTier = 'average';
      else if (avgScore >= 35) qualityTier = 'below_average';
      else qualityTier = 'poor';

      // Calculate aggregate stats
      const totalViews = videoDetails.reduce((sum, v) => sum + v.statistics.viewCount, 0);
      const totalLikes = videoDetails.reduce((sum, v) => sum + v.statistics.likeCount, 0);
      const avgDuration = videoDetails.length > 0
        ? videoDetails.reduce((sum, v) => sum + this.parseDurationToMinutes(v.duration), 0) / videoDetails.length
        : 0;

      // Determine overall recommendation
      let recommendation = 'neutral';
      if (nonProgrammingVideos.length > samplesToAnalyze / 2) {
        recommendation = 'caution';
      } else if (avgScore >= 80) {
        recommendation = 'strongly_recommend';
      } else if (avgScore >= 70) {
        recommendation = 'recommend';
      } else if (avgScore < 40) {
        recommendation = 'avoid';
      }

      const isProgrammingPlaylist = programmingVideoCount > nonProgrammingVideos.length;

      const result = {
        isNew: true,
        isPlaylist: true,
        playlistData: {
          playlistId,
          title: playlistDetails.title,
          description: playlistDetails.description?.substring(0, 500),
          thumbnail: playlistDetails.thumbnail,
          channelName: playlistDetails.channelTitle,
          channelId: playlistDetails.channelId,
          videoCount: playlistDetails.videoCount,
          analyzedCount: samplesToAnalyze,
          publishedAt: playlistDetails.publishedAt
        },
        aggregateStats: {
          totalViews,
          totalLikes,
          avgDurationMinutes: Math.round(avgDuration),
          programmingVideoCount,
          nonProgrammingVideoCount: nonProgrammingVideos.length
        },
        evaluation: {
          codeLearnnScore: avgScore,
          qualityTier,
          recommendation,
          isProgrammingPlaylist,
          breakdown: aggregateBreakdown,
          strengths: uniqueStrengths,
          weaknesses: uniqueWeaknesses,
          redFlags: uniqueRedFlags,
          videoAnalyses,
          nonProgrammingVideos: nonProgrammingVideos.slice(0, 3),
          summary: this.generatePlaylistSummary(playlistDetails, avgScore, programmingVideoCount, nonProgrammingVideos.length, samplesToAnalyze)
        },
        message: 'Playlist analyzed successfully'
      };

      // Save to cache if it's a programming playlist
      if (isProgrammingPlaylist) {
        await this.savePlaylistToCache(playlistId, playlistDetails, result, detectedCategories);
      } else {
        this.log('info', `Playlist ${playlistId} is not a programming playlist, not caching`);
      }

      return result;
    } catch (error) {
      this.handleError(error, 'analyzePlaylist');
    }
  }

  /**
   * Generate a summary for playlist analysis
   */
  generatePlaylistSummary(playlist, avgScore, progCount, nonProgCount, totalAnalyzed) {
    let summary = `"${playlist.title}" is a playlist with ${playlist.videoCount} videos. `;
    
    if (nonProgCount > progCount) {
      summary += `Warning: Most analyzed videos (${nonProgCount}/${totalAnalyzed}) are not programming tutorials. `;
    } else if (nonProgCount > 0) {
      summary += `Note: ${nonProgCount} of ${totalAnalyzed} analyzed videos are not programming content. `;
    }
    
    if (avgScore >= 70) {
      summary += `The programming tutorials have a good average quality score of ${avgScore}/100.`;
    } else if (avgScore >= 50) {
      summary += `The programming tutorials have an average quality score of ${avgScore}/100.`;
    } else if (avgScore > 0) {
      summary += `The programming tutorials have a below-average quality score of ${avgScore}/100.`;
    }
    
    return summary;
  }

  /**
   * Parse duration string to minutes
   */
  parseDurationToMinutes(duration) {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1] + parts[2] / 60;
    } else if (parts.length === 2) {
      return parts[0] + parts[1] / 60;
    }
    return 0;
  }

  /**
   * Get all resources with filters and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async getResources(options = {}) {
    try {
      const {
        category,
        level,
        search,
        sortBy = 'codeLearnnScore',
        sortOrder = 'desc',
        page = 1,
        limit = 12,
        featured
      } = options;

      const query = { isActive: true };

      if (category && category !== 'all') {
        query.category = category;
      }

      if (level) {
        query.level = level;
      }

      if (featured) {
        query.isFeatured = true;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { channelName: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const sortDirection = sortOrder === 'desc' ? -1 : 1;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [resources, total] = await Promise.all([
        FreeResource.find(query)
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-aiAnalysis.weaknesses'),
        FreeResource.countDocuments(query)
      ]);

      return {
        success: true,
        data: resources,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + resources.length < total
        }
      };
    } catch (error) {
      this.handleError(error, 'getResources');
    }
  }

  /**
   * Get resources by category
   * @param {string} category - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Resources in category
   */
  async getByCategory(category, options = {}) {
    return this.getResources({ ...options, category });
  }

  /**
   * Get a single resource by ID
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Resource details
   */
  async getById(id) {
    try {
      const resource = await FreeResource.findById(id);
      if (!resource) {
        throw new Error('Resource not found');
      }
      return { success: true, data: resource };
    } catch (error) {
      this.handleError(error, 'getById');
    }
  }

  /**
   * Create a new curated resource
   * @param {Object} data - Resource data
   * @returns {Promise<Object>} Created resource
   */
  async createResource(data) {
    try {
      this.validateParams(data, ['youtubeId', 'title', 'category']);

      // Check for duplicate
      const existing = await FreeResource.findOne({ youtubeId: data.youtubeId });
      if (existing) {
        throw new Error('Video already exists in the collection');
      }

      const resource = await FreeResource.create(data);
      this.log('info', `Created resource: ${resource._id}`);

      return { success: true, data: resource };
    } catch (error) {
      this.handleError(error, 'createResource');
    }
  }

  /**
   * Add video from analysis result
   * @param {Object} analysisResult - Result from analyzeVideo
   * @param {string} category - Category to assign
   * @param {Object} additionalData - Additional metadata
   * @returns {Promise<Object>} Created resource
   */
  async addFromAnalysis(analysisResult, category, additionalData = {}) {
    try {
      if (!analysisResult.isNew) {
        throw new Error('Video already exists');
      }

      const evaluation = analysisResult.evaluation;

      const resourceData = {
        ...analysisResult.videoData,
        category,
        codeLearnnScore: evaluation.codeLearnnScore,
        qualityTier: evaluation.qualityTier,
        aiAnalysis: {
          breakdown: evaluation.breakdown,
          penalties: evaluation.penalties || { outdated: 0, confusion: 0 },
          evaluationConfidence: evaluation.evaluationConfidence || 'medium',
          recommendation: evaluation.recommendation,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          redFlags: evaluation.redFlags || [],
          recommendedFor: evaluation.recommendedFor,
          notRecommendedFor: evaluation.notRecommendedFor || '',
          summary: evaluation.summary,
          commentAnalysis: evaluation.commentAnalysis || {},
          evaluatedAt: new Date()
        },
        ...additionalData
      };

      return this.createResource(resourceData);
    } catch (error) {
      this.handleError(error, 'addFromAnalysis');
    }
  }

  /**
   * Update a resource
   * @param {string} id - Resource ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated resource
   */
  async updateResource(id, data) {
    try {
      const resource = await FreeResource.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!resource) {
        throw new Error('Resource not found');
      }

      this.log('info', `Updated resource: ${id}`);
      return { success: true, data: resource };
    } catch (error) {
      this.handleError(error, 'updateResource');
    }
  }

  /**
   * Delete a resource
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteResource(id) {
    try {
      const resource = await FreeResource.findByIdAndDelete(id);
      
      if (!resource) {
        throw new Error('Resource not found');
      }

      this.log('info', `Deleted resource: ${id}`);
      return { success: true, message: 'Resource deleted successfully' };
    } catch (error) {
      this.handleError(error, 'deleteResource');
    }
  }

  /**
   * Refresh statistics for a resource
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Updated resource
   */
  async refreshStatistics(id) {
    try {
      const resource = await FreeResource.findById(id);
      if (!resource) {
        throw new Error('Resource not found');
      }

      const videoData = await youtubeService.getVideoDetails(resource.youtubeId);
      await resource.updateStatistics(videoData.statistics);

      this.log('info', `Refreshed statistics for resource: ${id}`);
      return { success: true, data: resource };
    } catch (error) {
      this.handleError(error, 'refreshStatistics');
    }
  }

  /**
   * Re-evaluate a resource with AI
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Updated resource
   */
  async reEvaluate(id) {
    try {
      const resource = await FreeResource.findById(id);
      if (!resource) {
        throw new Error('Resource not found');
      }

      const videoData = await youtubeService.getVideoDetails(resource.youtubeId);
      const comments = await youtubeService.getVideoComments(resource.youtubeId, 30);
      const evaluation = await groqService.evaluateVideoQuality(videoData, comments);

      await resource.updateAiAnalysis(evaluation);
      await resource.updateStatistics(videoData.statistics);

      this.log('info', `Re-evaluated resource: ${id}`);
      return { success: true, data: resource };
    } catch (error) {
      this.handleError(error, 'reEvaluate');
    }
  }

  /**
   * Get category statistics
   * @returns {Promise<Object[]>} Stats per category
   */
  async getCategoryStats() {
    try {
      const stats = await FreeResource.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgScore: { $avg: '$codeLearnnScore' },
            totalViews: { $sum: '$statistics.viewCount' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return this.defaultCategories.map(cat => {
        const stat = stats.find(s => s._id === cat.id) || { count: 0, avgScore: 0, totalViews: 0 };
        return {
          ...cat,
          count: stat.count,
          avgScore: Math.round(stat.avgScore || 0),
          totalViews: stat.totalViews
        };
      });
    } catch (error) {
      this.handleError(error, 'getCategoryStats');
    }
  }
}

// Singleton instance
const freeResourceService = new FreeResourceService();

module.exports = freeResourceService;
