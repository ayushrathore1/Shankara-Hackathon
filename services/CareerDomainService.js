const BaseService = require('./BaseService');
const axios = require('axios');
const CareerKeywordCache = require('../models/CareerKeywordCache');
const CareerDomainCache = require('../models/CareerDomainCache');
const CareerJobRoleCache = require('../models/CareerJobRoleCache');
const TrendingDomainsCache = require('../models/TrendingDomainsCache');
const CareerRoadmap = require('../models/CareerRoadmap');
const webSearchService = require('./WebSearchService');

/**
 * CareerDomainService - AI-powered career domain analysis
 * Features:
 * - Keyword analysis with related domains expansion
 * - Content moderation (blocks inappropriate keywords)
 * - Real-time web context via SERP API
 * - Complete career roadmap generation
 * - Persistent database storage for all responses
 */
class CareerDomainService extends BaseService {
  constructor() {
    super('CareerDomainService');
    this.groqApiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY2
    ].filter(Boolean); // Filter out undefined/empty keys
    this.currentKeyIndex = 0;
    this.groqBaseUrl = 'https://api.groq.com/openai/v1';
    this.cache = new Map(); // In-memory cache for non-career keywords
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get current Groq API key
   * @returns {string} Current API key
   */
  get groqApiKey() {
    return this.groqApiKeys[this.currentKeyIndex];
  }

  /**
   * Switch to the next available API key
   * @returns {boolean} True if switched successfully, false if no more keys
   */
  switchToNextKey() {
    if (this.currentKeyIndex < this.groqApiKeys.length - 1) {
      this.currentKeyIndex++;
      this.log('info', `Switched to API key ${this.currentKeyIndex + 1} of ${this.groqApiKeys.length}`);
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
   * Make API call with automatic fallback to secondary key on rate limit
   * @param {Function} apiCall - Function that makes the API call (receives apiKey as param)
   * @returns {Promise<*>} API response
   */
  async withApiKeyFallback(apiCall) {
    let lastError;
    const startKeyIndex = this.currentKeyIndex;
    
    // Try each API key
    do {
      try {
        return await apiCall(this.groqApiKey);
      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;
        
        // If rate limited (429) or unauthorized (401), try next key
        if (statusCode === 429 || statusCode === 401) {
          this.log('warn', `API key ${this.currentKeyIndex + 1} failed with status ${statusCode}, trying next key...`);
          if (!this.switchToNextKey()) {
            // Reset to first key for next request attempt
            this.resetApiKey();
            break;
          }
        } else {
          // For other errors, don't switch keys
          throw error;
        }
      }
    } while (this.currentKeyIndex !== startKeyIndex);
    
    // All keys exhausted
    this.log('error', 'All API keys exhausted or rate limited');
    throw lastError;
  }

  /**
   * Analyze a keyword and return career domains with hierarchical data
   * @param {string} keyword - The keyword to analyze (e.g., "Python", "Machine Learning")
   * @returns {Promise<Object>} Hierarchical career data
   */
  async analyzeKeyword(keyword) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    // Check database cache first (permanent storage)
    try {
      const dbCached = await CareerKeywordCache.findByKeyword(normalizedKeyword);
      if (dbCached) {
        this.log('info', `DB cache hit for keyword: ${normalizedKeyword}`);
        return {
          ...dbCached.analysis,
          fromCache: true,
          cacheUsageCount: dbCached.usageCount
        };
      }
    } catch (dbError) {
      this.log('warn', `DB cache check failed: ${dbError.message}`);
    }

    // Check in-memory cache (for non-career keywords)
    const memCached = this.getCached(normalizedKeyword);
    if (memCached) {
      this.log('info', `Memory cache hit for keyword: ${normalizedKeyword}`);
      return memCached;
    }

    this.log('info', `Analyzing keyword: ${normalizedKeyword}`);

    try {
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return axios.post(
          `${this.groqBaseUrl}/chat/completions`,
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: this.getSystemPrompt() },
              { role: 'user', content: this.buildAnalysisPrompt(normalizedKeyword) }
            ],
            temperature: 0.7,
            max_tokens: 4000,
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
      const result = this.processAIResponse(aiResponse, normalizedKeyword);
      
      // Always save to database (default assumption: everything can be career-related)
      // Only skip if AI explicitly says it's NOT career-related
      const isCareerRelated = aiResponse.isCareerRelated !== false;
      
      if (isCareerRelated) {
        this.log('info', `Saving keyword to database: ${normalizedKeyword} (career-related: ${isCareerRelated})`);
        await this.saveToDatabase(normalizedKeyword, result, aiResponse);
      } else {
        this.log('info', `Keyword "${normalizedKeyword}" is not career-related, using memory cache only`);
        this.setCache(normalizedKeyword, result);
      }
      
      return result;
    } catch (error) {
      this.log('error', `Failed to analyze keyword: ${error.message}`);
      throw new Error(`Failed to analyze keyword: ${error.message}`);
    }
  }

  /**
   * Save career-related keyword to database with auto-categorization
   * Uses upsert pattern to update if exists, insert if not
   */
  async saveToDatabase(keyword, result, aiResponse) {
    try {
      const filter = { keyword: keyword.toLowerCase().trim() };
      const update = {
        $set: {
          keyword: keyword.toLowerCase().trim(),
          category: aiResponse.primaryCategory || 'technology',
          subcategory: aiResponse.subcategory || '',
          tags: aiResponse.tags || [],
          analysis: result,
          lastUpdatedAt: new Date()
        },
        $inc: { usageCount: 1 }
      };
      const options = { upsert: true, new: true };
      
      const savedDoc = await CareerKeywordCache.findOneAndUpdate(filter, update, options);
      this.log('info', `✅ Saved career keyword to database: ${keyword} [${aiResponse.primaryCategory || 'technology'}] (ID: ${savedDoc._id})`);
    } catch (saveError) {
      this.log('error', `❌ Failed to save keyword to database: ${saveError.message}`);
    }
  }

  /**
   * Get detailed information about a specific domain
   * @param {string} domainName - The domain to get details for
   * @param {string} parentKeyword - The original keyword for context
   * @returns {Promise<Object>} Domain details with jobs and skills
   */
  async getDomainDetails(domainName, parentKeyword) {
    this.log('info', `Getting domain details: ${domainName} (from ${parentKeyword})`);

    // Check database cache first (persistent storage)
    try {
      const dbCached = await CareerDomainCache.findByDomain(domainName, parentKeyword);
      if (dbCached) {
        this.log('info', `DB cache hit for domain: ${domainName}`);
        return {
          ...dbCached.analysis,
          fromCache: true,
          cacheUsageCount: dbCached.usageCount
        };
      }
    } catch (dbError) {
      this.log('warn', `Domain DB cache check failed: ${dbError.message}`);
    }

    try {
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return axios.post(
          `${this.groqBaseUrl}/chat/completions`,
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: this.getDomainDetailSystemPrompt() },
              { role: 'user', content: this.buildDomainDetailPrompt(domainName, parentKeyword) }
            ],
            temperature: 0.7,
            max_tokens: 4000,
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

      const result = JSON.parse(response.data.choices[0].message.content);

      // Save to database for persistent caching
      try {
        await CareerDomainCache.saveToCache(domainName, parentKeyword, result);
        this.log('info', `Saved domain details to DB cache: ${domainName}`);
      } catch (saveError) {
        this.log('warn', `Failed to save domain to DB cache: ${saveError.message}`);
      }

      return result;
    } catch (error) {
      this.log('error', `Failed to get domain details: ${error.message}`);
      throw new Error(`Failed to get domain details: ${error.message}`);
    }
  }

  /**
   * Get job role details with specific skills and opportunities
   * @param {string} jobRole - The job role to explore
   * @param {string} domain - The domain context
   * @returns {Promise<Object>} Job role details
   */
  async getJobRoleDetails(jobRole, domain) {
    this.log('info', `Getting job role details: ${jobRole} in ${domain}`);

    // Check database cache first (persistent storage)
    try {
      const dbCached = await CareerJobRoleCache.findByRole(jobRole, domain);
      if (dbCached) {
        this.log('info', `DB cache hit for job role: ${jobRole}`);
        return {
          ...dbCached.analysis,
          fromCache: true,
          cacheUsageCount: dbCached.usageCount
        };
      }
    } catch (dbError) {
      this.log('warn', `Job role DB cache check failed: ${dbError.message}`);
    }

    try {
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return axios.post(
          `${this.groqBaseUrl}/chat/completions`,
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: this.getJobRoleSystemPrompt() },
              { role: 'user', content: this.buildJobRolePrompt(jobRole, domain) }
            ],
            temperature: 0.7,
            max_tokens: 3000,
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

      const result = JSON.parse(response.data.choices[0].message.content);

      // Save to database for persistent caching
      try {
        await CareerJobRoleCache.saveToCache(jobRole, domain, result);
        this.log('info', `Saved job role details to DB cache: ${jobRole}`);
      } catch (saveError) {
        this.log('warn', `Failed to save job role to DB cache: ${saveError.message}`);
      }

      return result;
    } catch (error) {
      this.log('error', `Failed to get job role details: ${error.message}`);
      throw new Error(`Failed to get job role details: ${error.message}`);
    }
  }

  /**
   * Get trending tech domains
   * @returns {Promise<Object>} List of trending domains with stats
   */
  async getTrendingDomains() {
    // Check database cache first (persistent storage with 24h TTL)
    try {
      const dbCached = await TrendingDomainsCache.getCached();
      if (dbCached) {
        this.log('info', 'DB cache hit for trending domains');
        return {
          ...dbCached,
          fromCache: true
        };
      }
    } catch (dbError) {
      this.log('warn', `Trending domains DB cache check failed: ${dbError.message}`);
    }

    // Fallback to memory cache
    const cacheKey = '_trending_domains_';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return axios.post(
          `${this.groqBaseUrl}/chat/completions`,
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are a career industry expert covering ALL professional fields — technology, business, marketing, design, finance, healthcare, creative arts, education, and more. Return JSON only.' },
              { 
                role: 'user', 
                content: `List the top 12 trending career domains for 2025-2026 with high job demand. Include a MIX of: 5-6 technology domains (AI, Cloud, Cybersecurity, etc.), 2-3 business/marketing domains (Digital Marketing, Product Management, etc.), 2-3 other high-demand domains (UX Design, Healthcare, Finance, Content Creation, etc.).
                
                Return JSON format:
                {
                  "domains": [
                    {
                      "name": "Domain Name",
                      "description": "Brief 1-line description",
                      "demandLevel": "High/Very High/Extreme",
                      "avgSalaryUSD": 120000,
                      "growthRate": "25%",
                      "topSkills": ["skill1", "skill2", "skill3"],
                      "icon": "emoji representing domain"
                    }
                  ]
                }`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
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

      const result = JSON.parse(response.data.choices[0].message.content);
      
      // Save to database for persistent caching (24h TTL)
      try {
        await TrendingDomainsCache.saveToCache(result);
        this.log('info', 'Saved trending domains to DB cache');
      } catch (saveError) {
        this.log('warn', `Failed to save trending domains to DB cache: ${saveError.message}`);
      }

      // Also save to memory cache as fallback
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.log('error', `Failed to get trending domains: ${error.message}`);
      throw new Error(`Failed to get trending domains: ${error.message}`);
    }
  }

  // System prompts
  getSystemPrompt() {
    return `You are an expert career counselor and industry analyst covering ALL professional fields — technology, business, marketing, design, finance, healthcare, law, education, creative arts, sciences, trades, and more. Your job is to analyze ANY keyword and identify ALL possible career domains, job opportunities, and career paths related to it.

FIRST: Determine if the keyword is career/profession related. Almost everything has career connections — cooking (culinary arts, food tech), music (audio engineering, music production), sports (sports management, coaching), fashion (fashion design, merchandising), etc. Only set isCareerRelated to false for truly offensive or meaningless inputs.

IMPORTANT: Think beyond the obvious. Students often only know common domains like "web development" or "data science". Your goal is to reveal HIDDEN and NICHE domains that have real job opportunities.

You must return a JSON object with this exact structure:
{
  "isCareerRelated": true/false,
  "primaryCategory": "technology|business|marketing|design|finance|healthcare|engineering|creative-arts|education|law|sciences|trades|hospitality|media|other",
  "subcategory": "frontend|backend|fullstack|digital-marketing|seo|branding|ui-ux|graphic-design|accounting|investment|nursing|biotech|civil|mechanical|film|music|writing|teaching|legal|research|culinary|fashion|etc",
  "tags": ["specific", "technology", "tags"],
  "keyword": "the analyzed keyword",
  "summary": "Brief overview of career landscape for this skill",
  "totalDomainsFound": number,
  "categories": [
    {
      "id": "unique_id",
      "name": "Category Name",
      "icon": "emoji",
      "description": "What this category encompasses",
      "jobCount": estimated jobs in last 30 days,
      "avgSalaryRange": { "min": 50000, "max": 150000, "currency": "USD" },
      "demandLevel": "High/Medium/Low",
      "domains": [
        {
          "id": "unique_domain_id",
          "name": "Specific Domain",
          "description": "What professionals do in this domain",
          "popularityScore": 1-100,
          "requiredSkills": ["skill1", "skill2"],
          "relatedJobTitles": ["Job Title 1", "Job Title 2"],
          "companies": ["Company1", "Company2"],
          "entryLevel": true/false,
          "remoteOpportunities": "High/Medium/Low"
        }
      ]
    }
  ],
  "careerProgression": {
    "entry": ["Entry level roles"],
    "mid": ["Mid-level roles"],
    "senior": ["Senior roles"],
    "leadership": ["Leadership roles"]
  },
  "learningPath": ["Step 1", "Step 2", "Step 3"],
  "marketTrends": "Current trends affecting this skill"
}`;
  }

  getDomainDetailSystemPrompt() {
    return `You are a career expert covering ALL industries — tech, business, marketing, design, finance, healthcare, creative arts, and more. Provide detailed information about a specific career domain including job roles, skills, and companies. Return JSON only.`;
  }

  getJobRoleSystemPrompt() {
    return `You are a job market expert. Provide detailed information about a specific job role including required skills, salary expectations, companies hiring, and career growth. Return JSON only.`;
  }

  // Prompt builders
  buildAnalysisPrompt(keyword) {
    return `Analyze the keyword "${keyword}" and identify ALL possible career domains and job opportunities.

Think creatively and include:
1. Obvious mainstream domains
2. Niche specialized domains
3. Emerging domains with future potential
4. Cross-functional domains combining ${keyword} with other fields
5. Industry-specific applications (healthcare, finance, gaming, etc.)

For each category, provide realistic job counts based on current market data (LinkedIn, Indeed, etc.).
Focus on domains with REAL job opportunities, not just theoretical applications.

Return comprehensive JSON as specified in the system prompt.`;
  }

  buildDomainDetailPrompt(domainName, parentKeyword) {
    return `Provide detailed career information for the "${domainName}" domain (related to ${parentKeyword}).

Include:
{
  "domain": "${domainName}",
  "detailedDescription": "Comprehensive description",
  "dailyWork": "What professionals do day-to-day",
  "jobRoles": [
    {
      "id": "unique_id",
      "title": "Job Title",
      "description": "Role description",
      "salaryRange": { "min": 0, "max": 0, "currency": "USD" },
      "experience": "0-2 years / 2-5 years / 5+ years",
      "demandLevel": "High/Medium/Low",
      "topCompanies": ["Company1", "Company2"],
      "linkedinSearchUrl": "LinkedIn job search URL for this role"
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"]
  },
  "certifications": ["Cert 1", "Cert 2"],
  "interviewTopics": ["Topic 1", "Topic 2"],
  "careerPath": {
    "entry": { "title": "", "yearsExp": "0-2", "avgSalary": 0 },
    "mid": { "title": "", "yearsExp": "2-5", "avgSalary": 0 },
    "senior": { "title": "", "yearsExp": "5-10", "avgSalary": 0 },
    "lead": { "title": "", "yearsExp": "10+", "avgSalary": 0 }
  }
}`;
  }

  buildJobRolePrompt(jobRole, domain) {
    return `Provide comprehensive details for the "${jobRole}" position in the ${domain} domain.

Return JSON:
{
  "role": "${jobRole}",
  "domain": "${domain}",
  "overview": "What this role entails",
  "responsibilities": ["resp1", "resp2"],
  "requiredSkills": {
    "mustHave": ["skill1", "skill2"],
    "niceToHave": ["skill1", "skill2"]
  },
  "salaryInsights": {
    "entry": { "min": 0, "max": 0 },
    "mid": { "min": 0, "max": 0 },
    "senior": { "min": 0, "max": 0 },
    "currency": "USD",
    "factors": ["Location impacts", "Company size impacts"]
  },
  "topHiringCompanies": [
    {
      "name": "Company Name",
      "linkedinUrl": "https://linkedin.com/company/...",
      "glassdoorRating": 4.2,
      "avgSalary": 0
    }
  ],
  "jobBoards": [
    {
      "name": "LinkedIn",
      "searchUrl": "https://www.linkedin.com/jobs/search/?keywords=${jobRole}",
      "estimatedListings": 500
    }
  ],
  "interviewPrep": {
    "commonQuestions": ["Q1", "Q2"],
    "technicalTopics": ["Topic1", "Topic2"],
    "resources": ["Resource1", "Resource2"]
  },
  "growthPath": ["Next role 1", "Next role 2"],
  "dayInLife": "Description of typical work day"
}`;
  }

  // Cache helpers
  getCached(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Moderate keyword for appropriateness
   * Blocks offensive, inappropriate, or non-career related terms
   * @param {string} keyword - Keyword to check
   * @returns {Promise<Object>} { isAppropriate, reason, suggestion }
   */
  async moderateKeyword(keyword) {
    const normalized = keyword.toLowerCase().trim();
    
    // Quick check against known bad patterns
    const inappropriatePatterns = [
      /\b(porn|xxx|sex|nude|nsfw|drug|kill|murder|suicide|hate|racist)\b/i,
      /\b(fuck|shit|ass|bitch|cunt|dick)\b/i
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(normalized)) {
        return {
          isAppropriate: false,
          reason: 'This keyword contains inappropriate content.',
          suggestion: 'Please search for a skill, career field, or industry.'
        };
      }
    }

    // AI-powered moderation for edge cases
    try {
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return axios.post(
          `${this.groqBaseUrl}/chat/completions`,
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { 
                role: 'system', 
                content: `You are a content moderator for a career guidance platform for students.
              Determine if the given keyword is appropriate and career-related.
              
              APPROPRIATE: Technology names, programming languages, career fields, skills, tools, frameworks, job titles, industries
              INAPPROPRIATE: Offensive words, adult content, violence, non-career topics (cooking recipes, entertainment gossip, etc.)
              
              Always try to find a career connection. For example:
              - "cooking" → appropriate (culinary careers)
              - "gaming" → appropriate (game dev, esports)
              - "music" → appropriate (audio engineering, music tech)
              
              Return JSON: { "isAppropriate": true/false, "reason": "brief reason", "careerConnection": "how it relates to careers if appropriate", "suggestion": "alternative keyword if inappropriate" }`
              },
              { role: 'user', content: `Keyword: "${keyword}"` }
            ],
            temperature: 0.3,
            max_tokens: 200,
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

      const result = JSON.parse(response.data.choices[0].message.content);
      return {
        isAppropriate: result.isAppropriate !== false,
        reason: result.reason || '',
        careerConnection: result.careerConnection || '',
        suggestion: result.suggestion || ''
      };
    } catch (error) {
      this.log('error', `Moderation failed: ${error.message}`);
      // Default to allowing if moderation fails
      return { isAppropriate: true, reason: 'Moderation unavailable' };
    }
  }

  /**
   * Generate a comprehensive career roadmap with real-time web context
   * @param {string} keyword - Technology/field to create roadmap for
   * @returns {Promise<Object>} Complete career roadmap
   */
  async generateCareerRoadmap(keyword) {
    const normalized = keyword.toLowerCase().trim();
    
    // Check content appropriateness first
    const moderation = await this.moderateKeyword(keyword);
    if (!moderation.isAppropriate) {
      return {
        success: false,
        error: 'inappropriate_keyword',
        message: moderation.reason,
        suggestion: moderation.suggestion
      };
    }

    // Check database for existing roadmap
    try {
      const cached = await CareerRoadmap.findByKeyword(normalized);
      if (cached) {
        this.log('info', `DB hit for roadmap: ${normalized}`);
        return {
          success: true,
          roadmap: cached,
          fromDatabase: true,
          usageCount: cached.usageCount
        };
      }
    } catch (dbError) {
      this.log('warn', `Roadmap DB check failed: ${dbError.message}`);
    }

    this.log('info', `Generating career roadmap for: ${normalized}`);

    // Get real-time web context
    let webContext = '';
    try {
      webContext = await webSearchService.getAIContext(normalized);
    } catch (webError) {
      this.log('warn', `Web context failed: ${webError.message}`);
    }

    // Generate comprehensive roadmap with AI
    try {
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return axios.post(
          `${this.groqBaseUrl}/chat/completions`,
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: this.getRoadmapSystemPrompt() },
              { role: 'user', content: this.buildRoadmapPrompt(normalized, webContext) }
            ],
            temperature: 0.7,
            max_tokens: 6000,
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
      
      // Structure the roadmap data
      const roadmapData = {
        isAppropriate: true,
        overview: {
          name: aiResponse.name || keyword,
          description: aiResponse.description,
          latestVersion: aiResponse.latestVersion,
          category: aiResponse.category,
          subcategory: aiResponse.subcategory
        },
        marketInsights: {
          demandLevel: aiResponse.marketDemand || 'Medium',
          growthRate: aiResponse.growthRate,
          averageSalary: aiResponse.salary,
          topHiringCompanies: aiResponse.topCompanies || [],
          hotLocations: aiResponse.hotLocations || ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad'],
          jobCount: aiResponse.estimatedJobs
        },
        relatedDomains: aiResponse.relatedDomains || [],
        roadmap: {
          prerequisites: aiResponse.prerequisites || [],
          phases: aiResponse.learningPath || [],
          certifications: aiResponse.certifications || [],
          timeline: aiResponse.timeline || {}
        },
        careerPath: {
          entryLevel: aiResponse.entryJobs || [],
          midLevel: aiResponse.midJobs || [],
          seniorLevel: aiResponse.seniorJobs || [],
          leadership: aiResponse.leadershipJobs || []
        },
        generatedBy: {
          model: 'llama-3.3-70b-versatile',
          webContextUsed: !!webContext,
          webSearchDate: new Date()
        }
      };

      // Save to database
      try {
        await CareerRoadmap.saveRoadmap(normalized, roadmapData);
        this.log('info', `Saved roadmap to DB: ${normalized}`);
      } catch (saveError) {
        this.log('warn', `Failed to save roadmap: ${saveError.message}`);
      }

      return {
        success: true,
        roadmap: roadmapData,
        fromDatabase: false
      };
    } catch (error) {
      this.log('error', `Roadmap generation failed: ${error.message}`);
      throw new Error(`Failed to generate roadmap: ${error.message}`);
    }
  }

  /**
   * System prompt for roadmap generation
   */
  getRoadmapSystemPrompt() {
    return `You are an expert career counselor with real-time knowledge of ALL industries — technology, business, marketing, design, finance, healthcare, creative arts, law, education, and more.
    Generate comprehensive, actionable career roadmaps for students in ANY field.
    
    Your roadmaps should include:
    1. Field/industry overview with current landscape
    2. Current market demand and salary ranges (focus on India market)
    3. ALL related domains and career paths (be expansive, not narrow)
    4. Step-by-step learning path with realistic timelines
    5. Specific job titles at each career stage
    6. Top companies actively hiring
    
    IMPORTANT: 
    - Always relate ANY keyword to professional career opportunities
    - Show ALL related fields, not just the obvious ones
    - Include both traditional and emerging career paths
    - Be specific with salary ranges (in both INR and USD)
    
    Return JSON with this structure:
    {
      "name": "Field/Career Name",
      "description": "Comprehensive description",
      "latestVersion": "Current version if applicable",
      "category": "Primary category",
      "subcategory": "Subcategory",
      "marketDemand": "Very Low/Low/Medium/High/Very High/Extreme",
      "growthRate": "Percentage growth",
      "salary": {
        "entry": { "min": INR, "max": INR },
        "mid": { "min": INR, "max": INR },
        "senior": { "min": INR, "max": INR },
        "currency": "INR"
      },
      "topCompanies": ["Company1", "Company2", ...],
      "hotLocations": ["City1", "City2", ...],
      "estimatedJobs": number,
      "relatedDomains": [
        {
          "name": "Related Field",
          "description": "How it connects",
          "relevanceScore": 1-100,
          "jobTitles": ["Title1", "Title2"],
          "skills": ["Skill1", "Skill2"]
        }
      ],
      "prerequisites": [
        { "skill": "Skill name", "importance": "Essential/Recommended/Optional", "resources": ["Resource1"] }
      ],
      "learningPath": [
        {
          "phase": 1,
          "title": "Phase Title",
          "duration": "2-3 months",
          "objectives": ["Objective1"],
          "skills": ["Skill1"],
          "projects": ["Project idea"],
          "resources": [
            { "name": "Resource", "type": "course/book/tool", "url": "", "isFree": true }
          ]
        }
      ],
      "certifications": [
        { "name": "Cert name", "provider": "Provider", "cost": "Free/$99", "difficulty": "Beginner/Intermediate/Advanced", "url": "" }
      ],
      "timeline": {
        "beginnerToJob": "3-6 months",
        "beginnerToMid": "2-3 years",
        "beginnerToSenior": "5-7 years"
      },
      "entryJobs": [{ "title": "Job Title", "salaryRange": "₹3-6 LPA", "companies": ["Company1"] }],
      "midJobs": [{ "title": "Job Title", "salaryRange": "₹8-15 LPA", "yearsExperience": "3-5 years" }],
      "seniorJobs": [{ "title": "Job Title", "salaryRange": "₹20-40 LPA", "yearsExperience": "7+ years" }],
      "leadershipJobs": [{ "title": "Job Title", "salaryRange": "₹50+ LPA" }]
    }`;
  }

  /**
   * Build the roadmap generation prompt with web context
   */
  buildRoadmapPrompt(keyword, webContext) {
    return `Generate a comprehensive career roadmap for: "${keyword}"

${webContext ? webContext : '(No real-time web data available - use your knowledge)'}

Create a detailed, actionable career guide that includes:
1. What "${keyword}" is and its latest developments
2. Why it's valuable in today's job market
3. ALL related career domains (be expansive - show students the full picture)
4. Complete step-by-step learning path from beginner to expert
5. Specific job roles with realistic salary expectations
6. Top companies hiring and in-demand locations

Focus on the Indian job market but include global opportunities.
Be specific, practical, and encouraging for students just starting out.

Return comprehensive JSON as specified in the system prompt.`;
  }

  /**
   * Get popular career roadmaps
   * @param {number} limit - Number of roadmaps to return
   * @returns {Promise<Array>} Popular roadmaps
   */
  async getPopularRoadmaps(limit = 10) {
    try {
      return await CareerRoadmap.getPopular(limit);
    } catch (error) {
      this.log('error', `Failed to get popular roadmaps: ${error.message}`);
      return [];
    }
  }

  // Process AI response
  processAIResponse(aiResponse, keyword) {
    // Add metadata
    return {
      ...aiResponse,
      analyzedAt: new Date().toISOString(),
      keyword: keyword,
      source: 'groq-ai'
    };
  }
}

// Singleton instance
const careerDomainService = new CareerDomainService();

module.exports = careerDomainService;
