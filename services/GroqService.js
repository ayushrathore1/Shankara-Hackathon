const BaseService = require('./BaseService');
const axios = require('axios');

/**
 * GroqService - Service for AI-powered video quality evaluation using Groq
 * Extends BaseService for common functionality
 * 
 * This service provides HONEST, CRITICAL assessments of tutorial quality
 * by analyzing video metadata, comments, and engagement patterns
 */
class GroqService extends BaseService {
  constructor() {
    super('GroqService');
    this.apiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY2
    ].filter(Boolean); // Filter out undefined/empty keys
    this.currentKeyIndex = 0;
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.3-70b-versatile';
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour for AI evaluations
  }

  /**
   * Get current API key
   * @returns {string} Current API key
   */
  get apiKey() {
    return this.apiKeys[this.currentKeyIndex];
  }

  /**
   * Switch to the next available API key
   * @returns {boolean} True if switched successfully, false if no more keys
   */
  switchToNextKey() {
    if (this.currentKeyIndex < this.apiKeys.length - 1) {
      this.currentKeyIndex++;
      this.log('info', `Switched to API key ${this.currentKeyIndex + 1} of ${this.apiKeys.length}`);
      return true;
    }
    return false;
  }

  /**
   * Reset to the first API key
   */
  resetApiKey() {
    this.currentKeyIndex = 0;
  }

  /**
   * Check if an error is a rate limit or auth error that warrants key switching
   * @param {Error} error - The error to check
   * @returns {boolean} True if error is rate limit or auth related
   */
  isRateLimitOrAuthError(error) {
    // Check response status code
    const statusCode = error.response?.status;
    if (statusCode === 429 || statusCode === 401) {
      return true;
    }
    
    // Also check error message for rate limit indicators (fallback)
    const message = (error.message || '').toLowerCase();
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }
    
    return false;
  }

  /**
   * Make API call with automatic fallback to secondary key on rate limit
   * @param {Function} apiCall - Function that makes the API call (receives apiKey as param)
   * @returns {Promise<*>} API response
   */
  async withApiKeyFallback(apiCall) {
    let lastError;
    const totalKeys = this.apiKeys.length;
    
    // Try each API key
    for (let keyAttempt = 0; keyAttempt < totalKeys; keyAttempt++) {
      try {
        this.log('info', `Trying API key ${this.currentKeyIndex + 1} of ${totalKeys}`);
        return await apiCall(this.apiKey);
      } catch (error) {
        lastError = error;
        
        // Check if this is a rate limit or auth error
        if (this.isRateLimitOrAuthError(error)) {
          this.log('warn', `API key ${this.currentKeyIndex + 1} rate limited or auth failed: ${error.message}`);
          
          // Try next key if available
          if (keyAttempt < totalKeys - 1) {
            this.switchToNextKey();
            this.log('info', `Switching to API key ${this.currentKeyIndex + 1}...`);
          } else {
            this.log('error', 'All API keys exhausted (rate limited or auth failed)');
          }
        } else {
          // For other errors, don't switch keys - just throw
          throw error;
        }
      }
    }
    
    // Reset to first key for next request cycle
    this.resetApiKey();
    
    // All keys exhausted
    throw lastError;
  }

  /**
   * Evaluate video quality based on metadata and comments
   * @param {Object} videoData - Video metadata from YouTube API
   * @param {Object[]} comments - Array of video comments
   * @returns {Promise<Object>} AI evaluation result
   */
  async evaluateVideoQuality(videoData, comments) {
    const cacheKey = `eval_${videoData.id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Check if any API key is configured
    if (this.apiKeys.length === 0) {
      throw new Error('GROQ API key is not configured. Please add GROQ_API_KEY to your .env file.');
    }

    try {
      // Analyze comments first
      const commentAnalysis = this.analyzeComments(comments);
      
      const prompt = this.buildEvaluationPrompt(videoData, comments, commentAnalysis);
      
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return axios.post(
          this.baseUrl,
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt()
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.2, // Lower temperature for more consistent, analytical responses
            max_tokens: 1500,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
      });

      const aiResponse = JSON.parse(response.data.choices[0].message.content);
      const result = this.processEvaluationResult(aiResponse, videoData, commentAnalysis);
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.handleError(error, 'evaluateVideoQuality');
    }
  }

  /**
   * Analyze comments for sentiment and quality indicators
   * @param {Object[]} comments - Array of comments
   * @returns {Object} Comment analysis result
   */
  analyzeComments(comments) {
    if (!comments || comments.length === 0) {
      return {
        totalAnalyzed: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        questionsCount: 0,
        complaintsCount: 0,
        praiseCount: 0,
        confusionIndicators: 0,
        helpfulIndicators: 0,
        outdatedIndicators: 0,
        avgLikes: 0,
        topConcerns: [],
        topPraises: [],
        overallSentiment: 'unknown'
      };
    }

    // Keywords for classification
    const positiveKeywords = ['great', 'amazing', 'best', 'thank', 'helpful', 'excellent', 'awesome', 'perfect', 'learned', 'finally', 'understand', 'clear', 'love', 'fantastic', 'wonderful'];
    const negativeKeywords = ['bad', 'waste', 'boring', 'confusing', 'outdated', 'wrong', 'incorrect', 'useless', 'terrible', 'poor', 'disappointed', 'skip', 'misleading', 'error'];
    const confusionKeywords = ['confused', 'don\'t understand', 'lost', 'what?', 'how?', 'unclear', 'makes no sense', 'explain', 'can\'t follow'];
    const outdatedKeywords = ['outdated', 'old', 'deprecated', 'doesn\'t work anymore', 'not working', 'updated', 'new version', '2024', '2023'];
    const questionKeywords = ['?', 'how do', 'what is', 'can you', 'please explain', 'help'];
    const praiseKeywords = ['best tutorial', 'finally understand', 'thank you so much', 'saved my life', 'exactly what i needed', 'best ever'];
    const complaintKeywords = ['waste of time', 'too fast', 'too slow', 'doesn\'t explain', 'skips over', 'missing', 'incomplete'];

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let questionsCount = 0;
    let complaintsCount = 0;
    let praiseCount = 0;
    let confusionIndicators = 0;
    let helpfulIndicators = 0;
    let outdatedIndicators = 0;
    let totalLikes = 0;

    const concerns = [];
    const praises = [];

    comments.forEach(comment => {
      const text = comment.text.toLowerCase();
      totalLikes += comment.likeCount || 0;

      // Count sentiment
      const hasPositive = positiveKeywords.some(kw => text.includes(kw));
      const hasNegative = negativeKeywords.some(kw => text.includes(kw));

      if (hasPositive && !hasNegative) positiveCount++;
      else if (hasNegative && !hasPositive) negativeCount++;
      else if (hasPositive && hasNegative) neutralCount++; // Mixed
      else neutralCount++;

      // Count specific indicators
      if (questionKeywords.some(kw => text.includes(kw))) questionsCount++;
      if (confusionKeywords.some(kw => text.includes(kw))) {
        confusionIndicators++;
        if (comment.likeCount >= 5) concerns.push(comment.text.substring(0, 150));
      }
      if (outdatedKeywords.some(kw => text.includes(kw))) {
        outdatedIndicators++;
        if (comment.likeCount >= 3) concerns.push(`Outdated content mentioned: ${comment.text.substring(0, 100)}`);
      }
      if (praiseKeywords.some(kw => text.includes(kw))) {
        praiseCount++;
        helpfulIndicators++;
        if (comment.likeCount >= 10) praises.push(comment.text.substring(0, 150));
      }
      if (complaintKeywords.some(kw => text.includes(kw))) {
        complaintsCount++;
        if (comment.likeCount >= 5) concerns.push(comment.text.substring(0, 150));
      }
    });

    // Determine overall sentiment
    let overallSentiment = 'mixed';
    const total = positiveCount + negativeCount + neutralCount;
    if (total > 0) {
      const positiveRatio = positiveCount / total;
      const negativeRatio = negativeCount / total;
      
      if (positiveRatio > 0.7) overallSentiment = 'very_positive';
      else if (positiveRatio > 0.5) overallSentiment = 'positive';
      else if (negativeRatio > 0.4) overallSentiment = 'negative';
      else if (negativeRatio > 0.6) overallSentiment = 'very_negative';
    }

    return {
      totalAnalyzed: comments.length,
      positiveCount,
      negativeCount,
      neutralCount,
      questionsCount,
      complaintsCount,
      praiseCount,
      confusionIndicators,
      helpfulIndicators,
      outdatedIndicators,
      avgLikes: comments.length > 0 ? Math.round(totalLikes / comments.length) : 0,
      topConcerns: concerns.slice(0, 3),
      topPraises: praises.slice(0, 3),
      overallSentiment
    };
  }

  /**
   * Get system prompt for video evaluation
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `You are a FAIR, EVIDENCE-BASED, and CRITICAL educational content evaluator for Medha, a platform that helps learners discover high-quality programming tutorials and avoid misleading, outdated, or low-value content.

Your goal is ACCURATE assessment, not harshness and not hype.

You must judge based on actual learning value.

==============================
PHASE 0 — RELEVANCE CHECK (MANDATORY)
==============================

First determine whether the video is genuinely about programming or technical education.

Valid topics include:
- Programming, software development
- Web, mobile, backend, frontend development
- Data science, machine learning, AI
- DevOps, cloud, infrastructure
- Computer science, algorithms, data structures
- Developer tools, IDEs, version control

If the video is NOT about programming or technical education (e.g., entertainment, vlogs, gaming, podcasts, music, fitness, news, etc.):
- Set "isProgrammingTutorial": false
- Set "detectedCategory" to what it actually is
- Set ALL numeric scores to 0
- Set "overallRecommendation": "not_applicable"
- Summary must clearly explain that this is not a programming tutorial

Do not evaluate further.

==============================
PHASE 1 — EVIDENCE COLLECTION (NO SCORING YET)
==============================

Internally identify:
- Main topics covered
- Intended audience level: beginner / intermediate / advanced
- Teaching style: conceptual, code-along, deep-dive, reference / overview

Collect positive signals:
- Clear explanations
- Logical structure
- Explains "why", not only "what"
- Real-world reasoning or use cases
- Edge cases or limitations mentioned
- Many comments reporting success or understanding
- Long, technical discussion in comments

Collect negative signals:
- Repeated confusion
- Repeated bug reports
- Repeated "doesn't work" / "wrong"
- Repeated "outdated" warnings
- Logical errors or misleading claims
- Title/content mismatch

==============================
PHASE 2 — WEIGHTED INTERPRETATION (IMPORTANT)
==============================

Judge by proportion and severity, not by existence:
- A few negative comments among many positive ones = small penalty
- Many negative comments = large penalty
- Highly-liked critical comments matter more than random complaints

Consider audience mismatch:
- Beginner confusion on advanced content = small or no penalty
- Confusion among the target audience = big penalty

==============================
PHASE 3 — CONTEXT & REPUTATION SIGNALS
==============================

You may apply a small positive adjustment if:
- The video is part of a well-received playlist
- The creator consistently produces well-received technical content
- Many users mention using this in real projects

These are weak positive signals, not proof of quality by themselves.

==============================
PHASE 4 — SCORING PHILOSOPHY
==============================

Start from a neutral baseline of 6
Move scores up or down based on evidence

Do NOT apply hard caps unless the problem is:
- Repeated
- Severe
- Clearly confirmed

Hard penalties apply ONLY if:
- Many users report "doesn't work", "wrong", or serious bugs
- Or the content is clearly outdated
- Or the core explanation is incorrect or misleading

==============================
PHASE 5 — SCORING SCALE
==============================

3–4: Bad / misleading
5: Weak
6: Average
7: Good
8: Very good
9: Excellent
10: Exceptional (rare)

==============================
PHASE 6 — CONSISTENCY CHECK
==============================

Before finalizing:
- Scores must match listed strengths and weaknesses
- Summary must match the scores
- Recommendation must reflect the most serious weakness
- If unsure, be conservative but fair.

==============================
PHASE 7 — OUTPUT FORMAT (STRICT JSON)
==============================

You MUST respond with VALID JSON ONLY in exactly this format:

{
  "isProgrammingTutorial": true,
  "detectedCategory": "<topic or non-programming category>",
  "contentQuality": <1-10 or 0>,
  "teachingClarity": <1-10 or 0>,
  "practicalValue": <1-10 or 0>,
  "upToDateScore": <1-10 or 0>,
  "commentSentiment": <1-10 or 0>,
  "overallRecommendation": "<strongly_recommend|recommend|neutral|caution|avoid|not_applicable>",
  "strengths": ["<specific, evidence-based strength>"],
  "weaknesses": ["<specific, evidence-based weakness>"],
  "redFlags": ["<serious concern, if any>"],
  "recommendedFor": "<who benefits>",
  "notRecommendedFor": "<who should avoid>",
  "summary": "<2–3 sentence honest assessment>"
}

==============================
FINAL DIRECTIVE
==============================

Your job is to accurately estimate real learning value.
Do NOT overrate because of popularity.
Do NOT underrate because of a few complaints.
Be fair, evidence-based, and useful to learners.`;
  }

  /**
   * Build evaluation prompt from video data
   * @param {Object} videoData - Video metadata
   * @param {Object[]} comments - Video comments
   * @param {Object} commentAnalysis - Pre-analyzed comment data
   * @returns {string} Formatted prompt
   */
  buildEvaluationPrompt(videoData, comments, commentAnalysis) {
    // Categorize comments by sentiment for the AI
    const sortedComments = [...comments].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    
    const topPositiveComments = sortedComments
      .filter(c => {
        const text = c.text.toLowerCase();
        return ['great', 'helpful', 'thanks', 'amazing', 'best', 'learned', 'understand'].some(kw => text.includes(kw));
      })
      .slice(0, 5)
      .map(c => `  [+] "${c.text.substring(0, 180)}${c.text.length > 180 ? '...' : ''}" (${c.likeCount} likes)`)
      .join('\n');

    const topNegativeComments = sortedComments
      .filter(c => {
        const text = c.text.toLowerCase();
        return ['confus', 'doesn\'t work', 'outdated', 'bad', 'waste', 'unclear', 'wrong', 'error'].some(kw => text.includes(kw));
      })
      .slice(0, 5)
      .map(c => `  [-] "${c.text.substring(0, 180)}${c.text.length > 180 ? '...' : ''}" (${c.likeCount} likes)`)
      .join('\n');

    const topQuestions = sortedComments
      .filter(c => c.text.includes('?'))
      .slice(0, 5)
      .map(c => `  [?] "${c.text.substring(0, 180)}${c.text.length > 180 ? '...' : ''}" (${c.likeCount} likes)`)
      .join('\n');

    // Calculate suspicious metrics
    const likeRatio = videoData.statistics.viewCount > 0 
      ? ((videoData.statistics.likeCount / videoData.statistics.viewCount) * 100).toFixed(2)
      : 0;
    const commentRatio = videoData.statistics.viewCount > 0
      ? ((videoData.statistics.commentCount / videoData.statistics.viewCount) * 100).toFixed(3)
      : 0;

    return `EVALUATE THIS PROGRAMMING TUTORIAL CRITICALLY:

═══════════════════════════════════════════════════════════
VIDEO METADATA
═══════════════════════════════════════════════════════════
Title: ${videoData.title}
Channel: ${videoData.channelTitle}
Duration: ${videoData.duration}
Published: ${videoData.publishedAt || 'Unknown'}

Description (first 600 chars):
${videoData.description?.substring(0, 600) || 'No description provided'}

Tags: ${videoData.tags?.slice(0, 15).join(', ') || 'None'}

═══════════════════════════════════════════════════════════
ENGAGEMENT STATISTICS
═══════════════════════════════════════════════════════════
Views: ${videoData.statistics.viewCount.toLocaleString()}
Likes: ${videoData.statistics.likeCount.toLocaleString()}
Comments: ${videoData.statistics.commentCount.toLocaleString()}
Like Ratio: ${likeRatio}% (typical good: 3-5%)
Comment Ratio: ${commentRatio}% (typical: 0.1-0.5%)

═══════════════════════════════════════════════════════════
COMMENT ANALYSIS (Pre-processed)
═══════════════════════════════════════════════════════════
Total Comments Analyzed: ${commentAnalysis.totalAnalyzed}
Positive Comments: ${commentAnalysis.positiveCount} (${commentAnalysis.totalAnalyzed > 0 ? Math.round(commentAnalysis.positiveCount / commentAnalysis.totalAnalyzed * 100) : 0}%)
Negative Comments: ${commentAnalysis.negativeCount} (${commentAnalysis.totalAnalyzed > 0 ? Math.round(commentAnalysis.negativeCount / commentAnalysis.totalAnalyzed * 100) : 0}%)
Questions Asked: ${commentAnalysis.questionsCount}
Complaints: ${commentAnalysis.complaintsCount}
Confusion Indicators: ${commentAnalysis.confusionIndicators}
Outdated Mentions: ${commentAnalysis.outdatedIndicators}
Overall Sentiment: ${commentAnalysis.overallSentiment.toUpperCase()}

═══════════════════════════════════════════════════════════
POSITIVE COMMENTS (Most Liked)
═══════════════════════════════════════════════════════════
${topPositiveComments || 'No clearly positive comments found'}

═══════════════════════════════════════════════════════════
NEGATIVE/CRITICAL COMMENTS (Most Liked) ⚠️ PAY ATTENTION
═══════════════════════════════════════════════════════════
${topNegativeComments || 'No clearly negative comments found'}

═══════════════════════════════════════════════════════════
QUESTIONS FROM VIEWERS
═══════════════════════════════════════════════════════════
${topQuestions || 'No questions found'}

═══════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════
Based on ALL the above information, provide an HONEST evaluation.

KEY THINGS TO CHECK:
1. Is the title clickbait-y? Does the content likely match the promise?
2. Are there comments mentioning confusion, errors, or outdated content?
3. Is the video age concerning for a fast-moving tech topic?
4. Do questions suggest the video failed to explain key concepts?
5. Is this actually educational or just entertainment?

Respond with your JSON evaluation now:`;
  }

  /**
   * Process AI evaluation result and calculate final score
   * @param {Object} aiResponse - Raw AI response
   * @param {Object} videoData - Video metadata
   * @param {Object} commentAnalysis - Comment analysis data
   * @returns {Object} Processed evaluation with Medha score
   */
  processEvaluationResult(aiResponse, videoData, commentAnalysis) {
    const {
      isProgrammingTutorial = true,
      detectedCategory = 'programming',
      contentQuality = 5,
      teachingClarity = 5,
      practicalValue = 5,
      upToDateScore = 5,
      commentSentiment = 5,
      overallRecommendation = 'neutral',
      evaluationConfidence = 'medium',
      strengths = [],
      weaknesses = [],
      redFlags = [],
      recommendedFor = 'General learners',
      notRecommendedFor = '',
      summary = ''
    } = aiResponse;

    // Handle non-programming videos
    if (!isProgrammingTutorial) {
      return {
        isProgrammingTutorial: false,
        detectedCategory,
        codeLearnnScore: 0,
        qualityTier: 'not_applicable',
        evaluationConfidence: 'high', // High confidence it's not programming
        breakdown: {
          engagement: 0,
          contentQuality: 0,
          teachingClarity: 0,
          practicalValue: 0,
          upToDateScore: 0,
          commentSentiment: 0
        },
        penalties: { outdated: 0, confusion: 0 },
        recommendation: 'not_applicable',
        strengths: [],
        weaknesses: [],
        redFlags: [`This is not a programming tutorial. Detected category: ${detectedCategory}`],
        recommendedFor: 'N/A - Not a programming tutorial',
        notRecommendedFor: 'Anyone looking for coding tutorials',
        summary: summary || `This video is not a programming tutorial. It appears to be about ${detectedCategory}. Medha is designed for coding and tech education content only.`,
        commentAnalysis: {
          sentiment: 'not_applicable',
          concerns: [],
          totalAnalyzed: 0
        },
        evaluatedAt: new Date().toISOString()
      };
    }

    // Calculate engagement score from video statistics
    const { viewCount, likeCount, commentCount } = videoData.statistics;
    const engagementScore = this.calculateEngagementScore(viewCount, likeCount, commentCount);

    // Apply penalties based on comment analysis
    let outdatedPenalty = 0;
    if (commentAnalysis.outdatedIndicators >= 5) outdatedPenalty = 15;
    else if (commentAnalysis.outdatedIndicators >= 3) outdatedPenalty = 10;
    else if (commentAnalysis.outdatedIndicators >= 1) outdatedPenalty = 5;

    let confusionPenalty = 0;
    const confusionRatio = commentAnalysis.totalAnalyzed > 0 
      ? commentAnalysis.confusionIndicators / commentAnalysis.totalAnalyzed 
      : 0;
    if (confusionRatio > 0.2) confusionPenalty = 10;
    else if (confusionRatio > 0.1) confusionPenalty = 5;

    // Calculate Medha Score (0-100) with weighted components
    // Weights: teaching clarity is most important, then content quality
    let rawScore = (
      (engagementScore * 0.10) +          // 10% - Engagement (lower weight - popularity != quality)
      (contentQuality * 2.0) +             // 20% - Content accuracy and depth
      (teachingClarity * 2.5) +            // 25% - How well it teaches
      (practicalValue * 2.0) +             // 20% - Real-world usefulness
      (upToDateScore * 1.5) +              // 15% - Current/relevant content
      (commentSentiment * 1.0)             // 10% - Community feedback
    );

    // Apply penalties
    rawScore = rawScore - outdatedPenalty - confusionPenalty;

    // Recommendation multiplier
    const recommendationMultiplier = {
      'strongly_recommend': 1.05,
      'recommend': 1.0,
      'neutral': 0.95,
      'caution': 0.85,
      'avoid': 0.70
    };
    rawScore = rawScore * (recommendationMultiplier[overallRecommendation] || 1.0);

    const codeLearnnScore = Math.round(Math.min(100, Math.max(0, rawScore)));

    // Determine quality tier
    let qualityTier;
    if (codeLearnnScore >= 85) qualityTier = 'excellent';
    else if (codeLearnnScore >= 70) qualityTier = 'good';
    else if (codeLearnnScore >= 55) qualityTier = 'average';
    else if (codeLearnnScore >= 40) qualityTier = 'below_average';
    else qualityTier = 'poor';

    return {
      isProgrammingTutorial: true,
      detectedCategory,
      codeLearnnScore,
      qualityTier,
      breakdown: {
        engagement: Math.round(engagementScore / 10), // Normalize to 0-10 scale like other scores
        contentQuality,
        teachingClarity,
        practicalValue,
        upToDateScore,
        commentSentiment
      },
      penalties: {
        outdated: outdatedPenalty,
        confusion: confusionPenalty
      },
      recommendation: overallRecommendation,
      evaluationConfidence,
      strengths,
      weaknesses,
      redFlags,
      recommendedFor,
      notRecommendedFor,
      summary,
      commentAnalysis: {
        sentiment: commentAnalysis.overallSentiment,
        concerns: commentAnalysis.topConcerns,
        totalAnalyzed: commentAnalysis.totalAnalyzed
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate engagement score from video statistics
   * @param {number} views - View count
   * @param {number} likes - Like count
   * @param {number} comments - Comment count
   * @returns {number} Engagement score (0-100)
   */
  calculateEngagementScore(views, likes, comments) {
    if (views === 0) return 0;

    // Like ratio (typical good ratio is 3-5%)
    const likeRatio = (likes / views) * 100;
    let likeScore = 0;
    if (likeRatio >= 5) likeScore = 100;
    else if (likeRatio >= 4) likeScore = 85;
    else if (likeRatio >= 3) likeScore = 70;
    else if (likeRatio >= 2) likeScore = 55;
    else if (likeRatio >= 1) likeScore = 40;
    else likeScore = likeRatio * 40;

    // Comment ratio (typical good ratio is 0.1-0.5%)
    const commentRatio = (comments / views) * 100;
    let commentScore = 0;
    if (commentRatio >= 0.5) commentScore = 100;
    else if (commentRatio >= 0.3) commentScore = 80;
    else if (commentRatio >= 0.1) commentScore = 60;
    else commentScore = commentRatio * 600;

    // View credibility (not a linear bonus - diminishing returns)
    let credibilityBonus = 0;
    if (views > 1000000) credibilityBonus = 15;
    else if (views > 500000) credibilityBonus = 12;
    else if (views > 100000) credibilityBonus = 10;
    else if (views > 50000) credibilityBonus = 8;
    else if (views > 10000) credibilityBonus = 5;
    else if (views > 1000) credibilityBonus = 2;

    return Math.min(100, (likeScore * 0.5) + (commentScore * 0.35) + credibilityBonus);
  }

  /**
   * Quick quality check without full AI evaluation
   * @param {Object} videoData - Video metadata
   * @returns {Object} Quick assessment
   */
  quickAssessment(videoData) {
    const { viewCount, likeCount, commentCount } = videoData.statistics;
    
    // Calculate basic metrics
    const likeRatio = viewCount > 0 ? (likeCount / viewCount) * 100 : 0;
    const isPopular = viewCount > 10000;
    const hasGoodEngagement = likeRatio > 3;
    const hasComments = commentCount > 10;

    // Check for potential red flags in title
    const title = videoData.title.toLowerCase();
    const clickbaitIndicators = ['🔥', '😱', 'you won\'t believe', 'secret', 'hack', 'trick', 'in 5 minutes', 'instantly'];
    const hasClickbait = clickbaitIndicators.some(indicator => title.includes(indicator));

    // Quick score estimation
    let quickScore = 50; // Base score
    if (isPopular) quickScore += 10;
    if (hasGoodEngagement) quickScore += 15;
    if (hasComments) quickScore += 5;
    if (videoData.duration && this.parseDurationMinutes(videoData.duration) > 10) quickScore += 5;
    if (hasClickbait) quickScore -= 10; // Penalty for clickbait indicators

    return {
      quickScore: Math.min(100, Math.max(0, quickScore)),
      isPopular,
      hasGoodEngagement,
      hasComments,
      hasClickbait,
      likeRatio: likeRatio.toFixed(2),
      recommendation: quickScore >= 60 ? 'worth_evaluating' : 'may_skip'
    };
  }

  /**
   * Parse duration string to minutes
   * @param {string} duration - Duration string (e.g., "1:30:45" or "45:30")
   * @returns {number} Duration in minutes
   */
  parseDurationMinutes(duration) {
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
   * Generic chat completion for flexible AI interactions
   * @param {Object[]} messages - Array of chat messages [{role, content}]
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} AI response text
   */
  async chat(messages, options = {}) {
    if (this.apiKeys.length === 0) {
      throw new Error('GROQ API key is not configured');
    }

    const { temperature = 0.7, maxTokens = 2000 } = options;

    try {
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return this.withRetry(async () => {
          return axios.post(
            this.baseUrl,
            {
              model: this.model,
              messages,
              temperature,
              max_tokens: maxTokens
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 60000
            }
          );
        });
      });

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      this.logError('Chat completion failed', error);
      throw error;
    }
  }
}

// Singleton instance
const groqService = new GroqService();

// Export both singleton and class for flexibility
module.exports = groqService;
module.exports.GroqService = GroqService;

