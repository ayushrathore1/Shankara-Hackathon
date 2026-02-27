const BaseService = require('./BaseService');
const Course = require('../models/Course');
const FreeResource = require('../models/FreeResource');
const youtubeService = require('./YouTubeService');
const groqService = require('./GroqService');

/**
 * BulkImportService - Scalable service for importing courses and lectures
 * Designed to handle 1000s of lectures with rate limiting and progress tracking
 */
class BulkImportService extends BaseService {
  constructor() {
    super('BulkImportService');
    this.rateLimitDelay = 3000; // 3 seconds between API calls
    this.batchSize = 5; // Process 5 videos at a time
  }

  /**
   * Import a complete course with videos
   * @param {Object} courseData - Course metadata
   * @param {string[]} videoUrls - Array of YouTube video URLs
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result with created course and resources
   */
  async importCourse(courseData, videoUrls, options = {}) {
    const { analyzeWithAI = true, category = 'other' } = options;
    
    this.log('info', `Starting course import: ${courseData.name} with ${videoUrls.length} videos`);
    
    try {
      // Step 1: Create the course
      const course = await Course.create({
        name: courseData.name,
        provider: courseData.provider,
        description: courseData.description || '',
        category: category,
        level: courseData.level || 'beginner',
        targetAudience: courseData.targetAudience || '',
        tags: courseData.tags || [],
        externalUrl: courseData.externalUrl || ''
      });

      this.log('info', `Created course: ${course.slug}`);

      // Step 2: Analyze and import each video
      const results = {
        course: course,
        successful: [],
        failed: [],
        totalProcessed: 0
      };

      for (let i = 0; i < videoUrls.length; i++) {
        const url = videoUrls[i];
        const lectureNumber = `Lecture ${i + 1}`;
        
        try {
          this.log('info', `Processing video ${i + 1}/${videoUrls.length}: ${url}`);
          
          // Analyze video
          const resource = await this.analyzeAndSaveVideo(
            url, 
            course, 
            i + 1, 
            lectureNumber,
            { analyzeWithAI, category }
          );
          
          results.successful.push({
            lectureNumber,
            videoId: resource.youtubeId,
            title: resource.title,
            score: resource.codeLearnnScore
          });
          
          // Rate limiting delay
          if (i < videoUrls.length - 1) {
            await this.delay(this.rateLimitDelay);
          }
        } catch (error) {
          this.log('error', `Failed to import video ${url}: ${error.message}`);
          results.failed.push({
            url,
            lectureNumber,
            error: error.message
          });
        }
        
        results.totalProcessed = i + 1;
      }

      // Step 3: Update course statistics
      await course.updateStats();
      
      // Step 4: Generate AI course overview if we have successful imports
      if (results.successful.length > 0 && analyzeWithAI) {
        try {
          const overview = await this.generateCourseOverview(course, results.successful);
          course.aiOverview = overview;
          await course.save();
        } catch (error) {
          this.log('warn', `Failed to generate course overview: ${error.message}`);
        }
      }

      this.log('info', `Course import complete: ${results.successful.length} successful, ${results.failed.length} failed`);
      
      return {
        success: true,
        course: course,
        results: results
      };
    } catch (error) {
      this.handleError(error, 'importCourse');
    }
  }

  /**
   * Analyze a single video and save it as a course lecture
   */
  async analyzeAndSaveVideo(url, course, order, lectureNumber, options = {}) {
    const { analyzeWithAI = true, category = 'c-programming' } = options;
    
    // Extract video ID
    const videoId = youtubeService.extractVideoId(url);
    if (!videoId) {
      throw new Error(`Invalid YouTube URL: ${url}`);
    }

    // Check if already exists
    const existing = await FreeResource.findOne({ youtubeId: videoId });
    if (existing) {
      // Update with course info if it exists
      existing.courseId = course._id;
      existing.lectureOrder = order;
      existing.lectureNumber = lectureNumber;
      await existing.save();
      return existing;
    }

    // Fetch video details from YouTube
    const videoData = await youtubeService.getVideoDetails(videoId);
    
    // Fetch comments for analysis
    const comments = await youtubeService.getVideoComments(videoId, 30);

    // Get AI evaluation
    let evaluation = null;
    let enhancedDescription = null;
    let cRelation = null;
    
    if (analyzeWithAI) {
      evaluation = await groqService.evaluateVideoQuality(videoData, comments);
      
      // Generate enhanced description for the lecture
      enhancedDescription = await this.generateEnhancedDescription(
        videoData, 
        comments, 
        evaluation,
        course
      );
      
      // Determine C relation
      cRelation = this.determineCRelation(videoData, evaluation, enhancedDescription);
    }

    // Calculate engagement metrics
    const engagement = youtubeService.calculateEngagement(videoData.statistics);

    // Create the FreeResource entry
    const resourceData = {
      youtubeId: videoId,
      title: videoData.title,
      description: videoData.description?.substring(0, 500),
      thumbnail: videoData.thumbnails?.high?.url || videoData.thumbnails?.medium?.url,
      channelName: videoData.channelTitle,
      channelId: videoData.channelId,
      duration: videoData.duration,
      publishedAt: videoData.publishedAt,
      tags: videoData.tags?.slice(0, 10) || [],
      statistics: videoData.statistics,
      
      // Course relationship
      category: category,
      courseId: course._id,
      lectureOrder: order,
      lectureNumber: lectureNumber,
      cRelation: cRelation,
      
      // AI Analysis
      codeLearnnScore: evaluation?.codeLearnnScore || 0,
      qualityTier: evaluation?.qualityTier || 'average',
      aiAnalysis: evaluation ? {
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
        evaluatedAt: new Date(),
        enhancedDescription: enhancedDescription
      } : {}
    };

    const resource = await FreeResource.create(resourceData);
    this.log('info', `Created lecture: ${lectureNumber} - ${resource.title}`);
    
    return resource;
  }

  /**
   * Generate enhanced AI description that supplements YouTube description
   */
  async generateEnhancedDescription(videoData, comments, evaluation, course) {
    try {
      const prompt = this.buildEnhancedDescriptionPrompt(videoData, comments, evaluation, course);
      
      const response = await groqService.chat([
        {
          role: 'system',
          content: `You are an educational content analyst for Medha. Your job is to analyze programming tutorial videos and generate helpful descriptions for learners.

For C programming content, you must:
1. Clearly identify if the video is SPECIFICALLY about C language or RELATED to C (general programming concepts useful for C)
2. Explain what learners will gain from watching
3. List specific topics covered
4. Explain how it benefits someone learning C and programming basics

Respond in JSON format only.`
        },
        {
          role: 'user',
          content: prompt
        }
      ], { temperature: 0.3, maxTokens: 1000 });

      const parsed = JSON.parse(response);
      
      return {
        whatYouWillLearn: parsed.whatYouWillLearn || [],
        topicsCovered: parsed.topicsCovered || [],
        cRelevance: parsed.cRelevance || '',
        learningBenefits: parsed.learningBenefits || '',
        suggestedPrerequisites: parsed.suggestedPrerequisites || [],
        keyTakeaways: parsed.keyTakeaways || []
      };
    } catch (error) {
      this.log('warn', `Failed to generate enhanced description: ${error.message}`);
      return null;
    }
  }

  /**
   * Build prompt for enhanced description generation
   */
  buildEnhancedDescriptionPrompt(videoData, comments, evaluation, course) {
    const topComments = comments
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 10)
      .map(c => c.text.substring(0, 200))
      .join('\n- ');

    return `Analyze this programming tutorial video and generate a helpful description for learners:

COURSE CONTEXT:
Course: ${course.name}
Provider: ${course.provider}
Target Audience: ${course.targetAudience || 'Beginners learning programming'}

VIDEO METADATA:
Title: ${videoData.title}
Channel: ${videoData.channelTitle}
Duration: ${videoData.duration}
Description (first 500 chars): ${videoData.description?.substring(0, 500) || 'N/A'}

AI EVALUATION SUMMARY:
${evaluation.summary || 'N/A'}
Quality Score: ${evaluation.codeLearnnScore || 'N/A'}/100
Detected Category: ${evaluation.detectedCategory || 'N/A'}

TOP COMMENTS FROM VIEWERS:
- ${topComments || 'No comments available'}

Generate a JSON response with:
{
  "whatYouWillLearn": ["3-5 specific things learners will gain"],
  "topicsCovered": ["list of specific programming topics covered"],
  "cRelevance": "specifically-for-c OR related-to-c. Explain clearly: is this video ABOUT C language syntax/features, or is it about general programming concepts that apply to C?",
  "learningBenefits": "2-3 sentences explaining why someone learning C programming basics should watch this video",
  "suggestedPrerequisites": ["what should someone know before watching"],
  "keyTakeaways": ["2-3 main takeaways from this lecture"]
}`;
  }

  /**
   * Determine if video is specifically for C or related to C
   */
  determineCRelation(videoData, evaluation, enhancedDescription) {
    const title = videoData.title?.toLowerCase() || '';
    const description = videoData.description?.toLowerCase() || '';
    const detectedCategory = evaluation?.detectedCategory?.toLowerCase() || '';
    
    // Check for explicit C language mentions
    const cSpecificKeywords = ['c programming', 'c language', 'programming in c', 'learn c', 'c tutorial', 'c basics'];
    const isSpecificallyForC = cSpecificKeywords.some(kw => 
      title.includes(kw) || description.includes(kw)
    ) || detectedCategory.includes('c programming');

    if (isSpecificallyForC) {
      return 'specifically-for-c';
    }

    // Check enhanced description from AI
    if (enhancedDescription?.cRelevance?.includes('specifically')) {
      return 'specifically-for-c';
    }

    // Default to related-to-c for programming content
    if (evaluation?.isProgrammingTutorial) {
      return 'related-to-c';
    }

    return 'general-programming';
  }

  /**
   * Generate AI overview for the entire course
   */
  async generateCourseOverview(course, lectures) {
    try {
      const lectureList = lectures.map((l, i) => `${i + 1}. ${l.title} (Score: ${l.score}/100)`).join('\n');
      
      const response = await groqService.chat([
        {
          role: 'system',
          content: `You are an educational content curator. Generate a course overview in JSON format.`
        },
        {
          role: 'user',
          content: `Generate an overview for this course:

Course: ${course.name}
Provider: ${course.provider}
Category: ${course.category}
Target Audience: ${course.targetAudience || 'Beginners'}

Lectures:
${lectureList}

Generate JSON:
{
  "summary": "2-3 sentence course summary",
  "learningObjectives": ["what students will achieve"],
  "keyTopics": ["main topics covered"],
  "recommendedPath": "how to approach this course"
}`
        }
      ], { temperature: 0.3, maxTokens: 800 });

      const parsed = JSON.parse(response);
      return {
        ...parsed,
        generatedAt: new Date()
      };
    } catch (error) {
      this.log('warn', `Failed to generate course overview: ${error.message}`);
      return null;
    }
  }

  /**
   * Helper: Delay for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const bulkImportService = new BulkImportService();

module.exports = bulkImportService;
module.exports.BulkImportService = BulkImportService;
