const BaseService = require('./BaseService');
const axios = require('axios');
const CareerLearningPlan = require('../models/CareerLearningPlan');
const webSearchService = require('./WebSearchService');
const jobApiService = require('./JobApiService');
const youtubeSearchService = require('./YouTubeSearchService');

/**
 * LearningPlanService — Generates comprehensive, real-time-data-driven learning plans.
 *
 * Pipeline:
 *   1. Gather real-time context in parallel (Google CSE × 3 queries + JSearch jobs)
 *   2. Build a rich prompt with all context
 *   3. Send to Groq LLM (llama-3.3-70b-versatile) for structured plan generation
 *   4. Parse, validate, and store the plan in MongoDB
 *   5. Return with caching (7-day freshness window)
 */
class LearningPlanService extends BaseService {
  constructor() {
    super('LearningPlanService');
    this.groqApiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY2
    ].filter(Boolean);
    this.currentKeyIndex = 0;
    this.groqBaseUrl = 'https://api.groq.com/openai/v1';
    this.STALENESS_DAYS = 7;
  }

  // ─── API Key Rotation ────────────────────────────────────

  get groqApiKey() {
    return this.groqApiKeys[this.currentKeyIndex] || this.groqApiKeys[0];
  }

  switchToNextKey() {
    if (this.currentKeyIndex < this.groqApiKeys.length - 1) {
      this.currentKeyIndex++;
      this.log('info', `Switched to Groq API key #${this.currentKeyIndex + 1}`);
      return true;
    }
    return false;
  }

  async withApiKeyFallback(apiCall) {
    try {
      return await apiCall(this.groqApiKey);
    } catch (error) {
      if (error.response?.status === 429 && this.switchToNextKey()) {
        this.log('warn', 'Rate limited, switching to backup Groq API key');
        return await apiCall(this.groqApiKey);
      }
      throw error;
    }
  }

  // ─── Main Entry Point ────────────────────────────────────

  /**
   * Generate or retrieve a comprehensive learning plan for a career domain.
   * @param {string} keyword — e.g. "react", "data science", "devops"
   * @param {Object} [preferences={}] — User preferences (language, region, etc.)
   * @returns {Promise<Object>} Learning plan result
   */
  async generateLearningPlan(keyword, preferences = {}) {
    const normalized = keyword.toLowerCase().trim();
    const forceRefresh = preferences.forceRefresh === true;

    // 1. Check DB cache (skip if forceRefresh)
    if (!forceRefresh) {
      try {
        const cached = await CareerLearningPlan.findByKeyword(normalized);
        if (cached && cached.isFresh(this.STALENESS_DAYS)) {
          // Also check if plan has YouTube video data — treat plans without videos as stale
          const hasVideos = cached.phases?.some(p =>
            p.steps?.some(s =>
              s.resources?.some(r => r.videoId)
            )
          );
          if (hasVideos) {
            this.log('info', `DB HIT (fresh + has videos) for learning plan: "${normalized}"`);
            return {
              success: true,
              plan: cached,
              fromDatabase: true,
              usageCount: cached.usageCount
            };
          }
          this.log('info', `DB HIT (fresh but no videos) for: "${normalized}" — regenerating with YouTube enrichment`);
        }
        if (cached) {
          this.log('info', `DB HIT (stale) for learning plan: "${normalized}" — regenerating`);
        }
      } catch (dbErr) {
        this.log('warn', `DB check failed: ${dbErr.message}`);
      }
    } else {
      this.log('info', `Force refresh requested for: "${normalized}" — skipping cache`);
    }

    // 2. Gather real-time context in parallel (9 sources)
    this.log('info', `Generating learning plan for: "${normalized}"`);
    const context = await this.gatherRealTimeContext(normalized);

    // 3. Generate plan via LLM
    try {
      const response = await this.withApiKeyFallback(async (apiKey) => {
        return axios.post(
          `${this.groqBaseUrl}/chat/completions`,
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: this.getSystemPrompt() },
              { role: 'user', content: this.buildPrompt(normalized, context, preferences) }
            ],
            temperature: 0.7,
            max_tokens: 8000,
            response_format: { type: 'json_object' }
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

      const aiResponse = JSON.parse(response.data.choices[0].message.content);

      // 4. Structure the plan
      const planData = this.structurePlan(aiResponse, normalized, context);

      // 5. Enrich each step with real YouTube videos (using user preferences)
      try {
        planData.phases = await this.enrichWithYouTubeVideos(planData.phases, normalized, preferences);
        this.log('info', `Enriched plan with YouTube videos for: "${normalized}"`);
      } catch (enrichErr) {
        this.log('warn', `YouTube enrichment failed (plan still usable): ${enrichErr.message}`);
      }

      // 6. Save to DB
      try {
        await CareerLearningPlan.savePlan(normalized, planData);
        this.log('info', `Saved learning plan to DB: "${normalized}"`);
      } catch (saveErr) {
        this.log('warn', `Failed to save plan: ${saveErr.message}`);
      }

      return {
        success: true,
        plan: planData,
        fromDatabase: false
      };
    } catch (error) {
      this.log('error', `Plan generation failed: ${error.message}`);
      throw new Error(`Failed to generate learning plan: ${error.message}`);
    }
  }

  // ─── Real-Time Data Gathering ─────────────────────────────

  /**
   * Gather context from 9 real-time sources in parallel.
   * Tolerant of individual failures — each source is optional.
   */
  async gatherRealTimeContext(keyword) {
    const context = {
      webTrends: null,
      redditInsights: null,
      communityData: null,
      jobListings: null,
      twitterTrends: null,
      aiToolingTrends: null,
      frameworkChanges: null,
      youtubeTrends: null,
      githubTrends: null
    };

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const tasks = [
      // 1. Tech trends & latest info via Google CSE
      webSearchService.getAIContext(keyword)
        .then(data => { context.webTrends = data; })
        .catch(err => this.log('warn', `Web trends failed: ${err.message}`)),

      // 2. Reddit community insights via Google CSE (site:reddit.com)
      webSearchService.performSearch(
        `site:reddit.com ${keyword} learning roadmap beginner ${currentYear} ${nextYear}`, { num: 8 }
      )
        .then(data => { context.redditInsights = data; })
        .catch(err => this.log('warn', `Reddit search failed: ${err.message}`)),

      // 3. Community / resource discovery via Google CSE
      webSearchService.performSearch(
        `${keyword} best free resources courses community discord ${currentYear} ${nextYear}`, { num: 8 }
      )
        .then(data => { context.communityData = data; })
        .catch(err => this.log('warn', `Community search failed: ${err.message}`)),

      // 4. Twitter/X trends via Google CSE
      webSearchService.performSearch(
        `site:x.com OR site:twitter.com ${keyword} developer trending ${currentYear} ${nextYear}`, { num: 5 }
      )
        .then(data => { context.twitterTrends = data; })
        .catch(err => this.log('warn', `Twitter search failed: ${err.message}`)),

      // 5. Real job listings via JSearch / Indeed / LinkedIn APIs
      jobApiService.searchJobs(keyword, { location: 'India', limit: 10 })
        .then(data => { context.jobListings = data; })
        .catch(err => this.log('warn', `Job search failed: ${err.message}`)),

      // 6. AI-era developer tooling context (Cursor, Copilot, v0, Bolt, AI agents)
      webSearchService.performSearch(
        `${keyword} AI coding tools copilot cursor v0 bolt agent workflow ${currentYear} ${nextYear}`, { num: 8 }
      )
        .then(data => { context.aiToolingTrends = data; })
        .catch(err => this.log('warn', `AI tooling search failed: ${err.message}`)),

      // 7. Framework breaking changes, migrations, deprecations
      webSearchService.performSearch(
        `${keyword} breaking changes migration deprecated update ${currentYear} ${nextYear}`, { num: 6 }
      )
        .then(data => { context.frameworkChanges = data; })
        .catch(err => this.log('warn', `Framework changes search failed: ${err.message}`)),

      // 8. YouTube trending tutorials for this topic
      webSearchService.performSearch(
        `site:youtube.com ${keyword} tutorial best ${currentYear} ${nextYear}`, { num: 8 }
      )
        .then(data => { context.youtubeTrends = data; })
        .catch(err => this.log('warn', `YouTube trends search failed: ${err.message}`)),

      // 9. GitHub trending repos (real projects people are building)
      webSearchService.performSearch(
        `site:github.com ${keyword} trending stars ${currentYear}`, { num: 5 }
      )
        .then(data => { context.githubTrends = data; })
        .catch(err => this.log('warn', `GitHub trends search failed: ${err.message}`))
    ];

    await Promise.allSettled(tasks);
    return context;
  }

  // ─── Prompt Engineering ──────────────────────────────────

  getSystemPrompt() {
    const currentYear = new Date().getFullYear();
    return `You are an expert career roadmap architect and YouTube content curator.
Your job is to generate a phase-wise, structured learning path for a given career domain using the BEST available YouTube programming tutorials.
It is currently ${currentYear}.

You must strictly follow the given roadmap structure.
You must NOT generate random tutorials.
You must NOT skip prerequisites.
You must NOT suggest outdated or low-quality content.

🎯 OBJECTIVE
For the given domain:
- Follow the provided roadmap phases exactly (Foundation → Core → Projects → Advanced → Specialization → Job-Ready → Continuous Growth).
- For each phase:
  1. Identify the exact skills required.
  2. Find the BEST YouTube tutorials from reputable channels.
  3. Arrange them in strict learning order.
  4. Ensure each video logically builds on the previous one.
  5. Suggest 1–2 hands-on projects aligned to that phase.
  6. Suggest relevant job roles after advanced phases.

🔎 VIDEO SELECTION RULES (CRITICAL)
When selecting tutorials:
- Prioritize high-quality, well-known channels (e.g. official docs channels, top educators, industry-recognized creators).
- Prefer:
  - Updated content (last 3–4 years unless foundational)
  - High engagement and positive feedback
  - Complete structured playlists over random single videos
- Avoid:
  - Incomplete crash courses unless clearly structured
  - Redundant tutorials covering the same content
  - Extremely outdated content
  - Very low-view or unverified channels (unless niche expert)
- If a playlist is better than scattered videos → choose playlist.
- When the user has a language preference (Hindi, Hinglish), prioritize YouTube channels that teach in that language.

🧱 STRUCTURE FORMAT (MANDATORY)
For each Phase in steps[]:
- Each step represents ONE specific video/playlist recommendation
- Step title = exact video or playlist title
- Step description = channel name + why this is the best resource + what the learner will gain
- Steps must be in strict sequential learning order
- Each step's resources[] must include the YouTube channel/video with proper provider (channel name)
- NEVER recommend the same video or playlist in more than one step
- NEVER recommend multiple videos from the same channel covering the same topic
- Each step must cover a DIFFERENT skill or concept — no two steps should teach the same thing

🧠 INTELLIGENT PROGRESSION RULES
- Each phase must clearly depend on the previous one.
- Do NOT introduce advanced concepts before fundamentals.
- If a prerequisite is missing from roadmap, mention it explicitly in objectives.
- Keep the flow: beginner → intermediate → advanced → specialization.
- Avoid repeating similar tutorials across phases.
- Each video/playlist must logically build on what came before.

📦 AI-ERA INTEGRATION
AI tools (GitHub Copilot, Cursor, v0, Bolt, Claude, ChatGPT) are now integral to development.
- Include AI-assisted development as a SKILL in at least one phase.
- Recommend specific AI coding tools relevant to the domain.
- Teach when to use AI vs manual coding.

🎓 FINAL PHASE: CAREER-READY
The last phase must include:
- Career-Ready Checklist: What the learner must know, portfolio requirements, interview readiness
- Job Roles in This Domain: Entry-level, Mid-level, Advanced roles

🚨 QUALITY CONTROL (Before finalizing)
- Ensure every tutorial directly aligns with roadmap skills.
- Ensure logical continuity — no step gaps.
- Ensure minimal redundancy across phases.
- Ensure resource quality is high-tier.
- If unsure between two tutorials → choose the more structured, comprehensive, and recent one.
- Every resource must be REAL and CURRENTLY ACTIVE (no made-up URLs).
- NEVER recommend outdated tools or approaches.
- Reference REAL YouTube video URLs from the trending data when provided.
- Projects should be PRACTICAL — things that would impress in a portfolio.
- Be specific with tool versions, framework names, and ecosystem choices.
- Focus on the INDIAN job market but include global remote opportunities.

Return JSON with EXACTLY this structure:
{
  "title": "Learning Plan: [Domain Name]",
  "description": "Comprehensive 2-3 sentence description",
  "domain": "one of: frontend, backend, fullstack, mobile, devops, data-science, ai-ml, security, blockchain, cloud, other",
  "level": "all-levels",
  "estimatedDuration": "e.g. 6-8 months",

  "phases": [
    {
      "phase": 1,
      "title": "Phase Title",
      "duration": "e.g. 3-4 weeks",
      "objectives": ["Clear objective 1", "Clear objective 2"],
      "skills": ["Skill 1", "Skill 2"],
      "steps": [
        {
          "order": 1,
          "title": "Exact Video/Playlist Title from YouTube",
          "description": "Channel: [Channel Name] | Why: [Why this is the best resource] | You will learn: [specific skills/concepts]",
          "type": "learn|build|practice|read|explore",
          "estimatedHours": 5,
          "resources": [
            { "name": "Exact Video/Playlist Title", "url": "https://youtube.com/watch?v=... or playlist URL", "type": "video", "isFree": true, "provider": "Channel Name" }
          ]
        }
      ],
      "projects": [
        {
          "name": "Project name aligned to this phase",
          "description": "What to build and what it demonstrates",
          "difficulty": "beginner|intermediate|advanced",
          "skills": ["Skills this project develops"],
          "inspiration": "Why this project",
          "estimatedHours": 15,
          "referenceUrl": "https://link-to-similar-project-or-repo"
        }
      ],
      "milestones": ["What student can now do after this phase"]
    }
  ],

  "aiToolsIntegration": {
    "recommendedTools": [{ "name": "Tool name", "useCase": "When/how to use it", "url": "https://tool-url.com" }],
    "promptingSkills": ["How to write effective prompts for this domain"],
    "aiWorkflow": "How to integrate AI tools into the daily development workflow for this career"
  },

  "deprecationWarnings": [
    { "technology": "Outdated tech", "replacement": "Modern alternative", "reason": "Why it's deprecated" }
  ],

  "community": {
    "subreddits": [{ "name": "r/subreddit", "url": "https://reddit.com/r/subreddit", "description": "Why this community" }],
    "discord": [{ "name": "Server name", "url": "https://discord.gg/invite", "description": "What it offers" }],
    "twitterAccounts": [{ "handle": "@handle", "description": "Why follow them" }],
    "youtubeChannels": [{ "name": "Channel", "url": "https://youtube.com/@channel", "description": "What they cover" }]
  },

  "trendingNow": [
    { "topic": "Trending topic", "reason": "Why it's trending", "relevance": "How it relates to this learning path" }
  ],

  "jobMarketSnapshot": {
    "totalJobs": 5000,
    "topSkills": ["Skill 1", "Skill 2", "Skill 3"],
    "topCompanies": ["Company 1", "Company 2"],
    "salaryRange": { "min": 400000, "max": 2500000, "currency": "INR" },
    "sampleListings": [
      { "title": "Job Title", "company": "Company", "location": "City", "salary": "₹6-12 LPA" }
    ]
  },

  "careerReadyChecklist": {
    "mustKnow": ["Essential skill/concept the learner must master"],
    "portfolioRequirements": ["What the portfolio must contain"],
    "interviewReadiness": ["Interview preparation guidance"],
    "jobRoles": {
      "entryLevel": ["Junior Developer", "Associate Engineer"],
      "midLevel": ["Software Engineer", "Full Stack Developer"],
      "advanced": ["Senior Engineer", "Tech Lead", "Architect"]
    }
  }
}

Generate 5-7 phases (Foundation → Core → Projects → Advanced → Specialization → Job-Ready → Continuous Growth).
Each phase should have 4-8 concrete steps. Each step = ONE specific YouTube video or playlist recommendation.
Each phase should have 1-2 hands-on projects directly aligned to the skills in that phase.
Include at minimum 3 subreddits, 2 Discord servers, 5 Twitter accounts, and 4 YouTube channels in community.
IMPORTANT: At least one phase step must cover AI-assisted development workflow.
IMPORTANT: The LAST phase must include career-ready checklist with job roles.`;
  }

  buildPrompt(keyword, context, preferences = {}) {
    let prompt = `Generate a comprehensive, real-time-data-driven learning plan for: "${keyword}"\n\n`;

    // ── User Preferences ──
    const langLabel = preferences.language === 'hi' ? 'Hindi'
      : preferences.language === 'hinglish' ? 'Hindi/English mix (Hinglish)'
      : 'English';
    const regionLabel = preferences.region === 'IN' ? 'Indian job market and Indian creators'
      : preferences.region === 'US' ? 'US job market'
      : 'global opportunities';

    prompt += `=== USER PREFERENCES ===\n`;
    prompt += `Tutorial Language: ${langLabel} (prioritize ${langLabel} resources and YouTube channels)\n`;
    prompt += `Region: ${preferences.region || 'IN'} (focus on ${regionLabel})\n`;
    if (preferences.contentCreatorPreference === 'indian') {
      prompt += `Content Creators: User STRONGLY prefers Indian YouTube creators and educators\n`;
    } else if (preferences.contentCreatorPreference === 'international') {
      prompt += `Content Creators: User prefers international/global YouTube creators\n`;
    }
    if (preferences.includeAITools !== false) {
      prompt += `AI Tools: YES — include AI-assisted development skills, tools (Cursor, Copilot, v0, Claude), and modern AI workflows\n`;
    }
    prompt += `Experience: ${preferences.experienceLevel || 'beginner'}\n`;
    prompt += `=== END PREFERENCES ===\n\n`;

    // ── Existing context sources ──

    // Inject web trends
    if (context.webTrends) {
      prompt += `${context.webTrends}\n\n`;
    }

    // Inject Reddit community context
    if (context.redditInsights?.organic_results?.length > 0) {
      prompt += `=== REDDIT COMMUNITY INSIGHTS ===\n`;
      prompt += `Active Reddit discussions about "${keyword}":\n`;
      context.redditInsights.organic_results.slice(0, 5).forEach((r, i) => {
        prompt += `${i + 1}. ${r.title || 'Discussion'}: ${(r.snippet || '').substring(0, 200)}\n   URL: ${r.link || ''}\n`;
      });
      prompt += `=== END REDDIT ===\n\n`;
    }

    // Inject Twitter/X trends
    if (context.twitterTrends?.organic_results?.length > 0) {
      prompt += `=== X (TWITTER) TRENDS ===\n`;
      context.twitterTrends.organic_results.slice(0, 5).forEach((r, i) => {
        prompt += `${i + 1}. ${r.title || ''}: ${(r.snippet || '').substring(0, 150)}\n`;
      });
      prompt += `=== END X TRENDS ===\n\n`;
    }

    // Inject community/resource links
    if (context.communityData?.organic_results?.length > 0) {
      prompt += `=== COMMUNITY & RESOURCES ===\n`;
      context.communityData.organic_results.slice(0, 5).forEach((r, i) => {
        prompt += `${i + 1}. ${r.title || ''}: ${(r.snippet || '').substring(0, 150)}\n   URL: ${r.link || ''}\n`;
      });
      prompt += `=== END COMMUNITY ===\n\n`;
    }

    // Inject real job listings
    if (context.jobListings?.jobs?.length > 0) {
      prompt += `=== LIVE JOB LISTINGS (${keyword}) ===\n`;
      prompt += `Total estimated: ${context.jobListings.totalEstimated || 'N/A'} jobs\n`;
      context.jobListings.jobs.slice(0, 8).forEach((job, i) => {
        prompt += `${i + 1}. ${job.title || 'Untitled'} at ${job.company || 'Unknown'} (${job.location || 'India'})`;
        if (job.salary) prompt += ` — ${job.salary}`;
        prompt += `\n`;
        if (job.skills?.length) prompt += `   Skills: ${job.skills.slice(0, 5).join(', ')}\n`;
      });
      prompt += `=== END JOB LISTINGS ===\n\n`;
    }

    // ── NEW context sources ──

    // AI-era developer tooling
    if (context.aiToolingTrends?.organic_results?.length > 0) {
      prompt += `=== AI-ERA DEVELOPER TOOLING ===\n`;
      prompt += `How AI is changing ${keyword} development right now:\n`;
      context.aiToolingTrends.organic_results.slice(0, 5).forEach((r, i) => {
        prompt += `${i + 1}. ${r.title || ''}: ${(r.snippet || '').substring(0, 200)}\n   URL: ${r.link || ''}\n`;
      });
      prompt += `=== END AI TOOLING ===\n\n`;
    }

    // Framework changes & deprecations
    if (context.frameworkChanges?.organic_results?.length > 0) {
      prompt += `=== BREAKING CHANGES & DEPRECATIONS ===\n`;
      prompt += `Recent changes in ${keyword} ecosystem (IMPORTANT — avoid recommending deprecated approaches!):\n`;
      context.frameworkChanges.organic_results.slice(0, 5).forEach((r, i) => {
        prompt += `${i + 1}. ${r.title || ''}: ${(r.snippet || '').substring(0, 200)}\n`;
      });
      prompt += `=== END CHANGES ===\n\n`;
    }

    // YouTube trending tutorials
    if (context.youtubeTrends?.organic_results?.length > 0) {
      prompt += `=== TRENDING YOUTUBE TUTORIALS ===\n`;
      prompt += `Popular ${keyword} tutorials on YouTube RIGHT NOW (use these as resource references!):\n`;
      context.youtubeTrends.organic_results.slice(0, 6).forEach((r, i) => {
        prompt += `${i + 1}. ${r.title || ''}: ${(r.snippet || '').substring(0, 150)}\n   URL: ${r.link || ''}\n`;
      });
      prompt += `=== END YOUTUBE ===\n\n`;
    }

    // GitHub trending repos
    if (context.githubTrends?.organic_results?.length > 0) {
      prompt += `=== GITHUB TRENDING REPOSITORIES ===\n`;
      prompt += `Popular ${keyword} repos people are building/starring:\n`;
      context.githubTrends.organic_results.slice(0, 4).forEach((r, i) => {
        prompt += `${i + 1}. ${r.title || ''}: ${(r.snippet || '').substring(0, 150)}\n   URL: ${r.link || ''}\n`;
      });
      prompt += `=== END GITHUB ===\n\n`;
    }

    prompt += `Based on ALL the real-time data above, create a structured, phase-wise learning path that:

📌 YOUTUBE TUTORIAL CURATION (MOST IMPORTANT):
1. For EACH step, recommend a SPECIFIC YouTube video or playlist — use exact titles from real channels
2. Prefer COMPLETE STRUCTURED PLAYLISTS over random single videos
3. Ensure each video LOGICALLY BUILDS on the previous one (strict sequential order)
4. Choose tutorials from REPUTABLE, well-known channels with high engagement
5. Prefer content from the last 3-4 years unless it's timeless foundational material
6. If you know of a particular channel's complete series on a topic, recommend the SERIES not individual random videos

📌 ADDITIONAL REQUIREMENTS:
7. Prioritize skills that appear most frequently in actual job listings
8. Include 1-2 hands-on projects per phase aligned to that phase's skills
9. Links to the active communities found in the Reddit/X searches
10. Highlights what's trending RIGHT NOW in "${keyword}"
11. Provides a realistic timeline focused on the ${regionLabel}
12. Incorporates AI-era development tools and workflows
13. WARNS about any deprecated/outdated tech found in the breaking changes data
14. Respects user's language preference: ${langLabel}
15. Include job roles (entry/mid/advanced) in the career-ready checklist

🚨 QUALITY CHECK before returning:
- Every tutorial must directly align with roadmap skills
- Logical continuity — no step gaps between videos
- Minimal redundancy — don't recommend two tutorials covering the same content
- Every resource must be a REAL, ACTIVE YouTube video/playlist

Return comprehensive JSON as specified in the system prompt.`;

    return prompt;
  }

  // ─── Response Structuring ─────────────────────────────────

  structurePlan(aiResponse, keyword, context) {
    return {
      title: aiResponse.title || `Learning Plan: ${keyword}`,
      description: aiResponse.description || '',
      domain: aiResponse.domain || 'other',
      level: aiResponse.level || 'all-levels',
      estimatedDuration: aiResponse.estimatedDuration || '6-8 months',

      phases: (aiResponse.phases || []).map(phase => ({
        phase: phase.phase,
        title: phase.title,
        duration: phase.duration || '3-4 weeks',
        objectives: phase.objectives || [],
        skills: phase.skills || [],
        steps: (phase.steps || []).map(step => ({
          order: step.order,
          title: step.title,
          description: step.description || '',
          type: step.type || 'learn',
          estimatedHours: step.estimatedHours || 2,
          resources: (step.resources || []).map(r => ({
            name: r.name,
            url: r.url || '',
            type: r.type || 'course',
            isFree: r.isFree !== false,
            provider: r.provider || '',
            // YouTube video fields (will be populated by enrichment step)
            videoId: r.videoId || null,
            youtubeUrl: r.youtubeUrl || null,
            thumbnailUrl: r.thumbnailUrl || null,
            qualityScore: r.qualityScore || null,
          }))
        })),
        projects: (phase.projects || []).map(p => ({
          name: p.name,
          description: p.description || '',
          difficulty: p.difficulty || 'beginner',
          skills: p.skills || [],
          inspiration: p.inspiration || '',
          estimatedHours: p.estimatedHours || 10,
          referenceUrl: p.referenceUrl || ''
        })),
        milestones: phase.milestones || []
      })),

      // AI tools integration (new section)
      aiToolsIntegration: {
        recommendedTools: (aiResponse.aiToolsIntegration?.recommendedTools || []).map(t => ({
          name: t.name, useCase: t.useCase || '', url: t.url || ''
        })),
        promptingSkills: aiResponse.aiToolsIntegration?.promptingSkills || [],
        aiWorkflow: aiResponse.aiToolsIntegration?.aiWorkflow || ''
      },

      // Deprecation warnings (new section)
      deprecationWarnings: (aiResponse.deprecationWarnings || []).map(d => ({
        technology: d.technology, replacement: d.replacement || '', reason: d.reason || ''
      })),

      community: {
        subreddits: (aiResponse.community?.subreddits || []).map(s => ({
          name: s.name, url: s.url || '', description: s.description || ''
        })),
        discord: (aiResponse.community?.discord || []).map(d => ({
          name: d.name, url: d.url || '', description: d.description || ''
        })),
        twitterAccounts: (aiResponse.community?.twitterAccounts || []).map(t => ({
          handle: t.handle, description: t.description || ''
        })),
        youtubeChannels: (aiResponse.community?.youtubeChannels || []).map(y => ({
          name: y.name, url: y.url || '', description: y.description || ''
        }))
      },

      trendingNow: (aiResponse.trendingNow || []).map(t => ({
        topic: t.topic, reason: t.reason || '', relevance: t.relevance || ''
      })),

      jobMarketSnapshot: {
        totalJobs: aiResponse.jobMarketSnapshot?.totalJobs || 0,
        topSkills: aiResponse.jobMarketSnapshot?.topSkills || [],
        topCompanies: aiResponse.jobMarketSnapshot?.topCompanies || [],
        salaryRange: {
          min: aiResponse.jobMarketSnapshot?.salaryRange?.min || 0,
          max: aiResponse.jobMarketSnapshot?.salaryRange?.max || 0,
          currency: aiResponse.jobMarketSnapshot?.salaryRange?.currency || 'INR'
        },
        sampleListings: (aiResponse.jobMarketSnapshot?.sampleListings || []).map(l => ({
          title: l.title, company: l.company || '', location: l.location || '', salary: l.salary || ''
        }))
      },

      // Career-ready checklist (structured YouTube roadmap output)
      careerReadyChecklist: {
        mustKnow: aiResponse.careerReadyChecklist?.mustKnow || [],
        portfolioRequirements: aiResponse.careerReadyChecklist?.portfolioRequirements || [],
        interviewReadiness: aiResponse.careerReadyChecklist?.interviewReadiness || [],
        jobRoles: {
          entryLevel: aiResponse.careerReadyChecklist?.jobRoles?.entryLevel || [],
          midLevel: aiResponse.careerReadyChecklist?.jobRoles?.midLevel || [],
          advanced: aiResponse.careerReadyChecklist?.jobRoles?.advanced || [],
        }
      },

      generatedBy: {
        model: 'llama-3.3-70b-versatile',
        webContextUsed: !!context.webTrends,
        jobDataUsed: !!(context.jobListings?.jobs?.length),
        redditDataUsed: !!(context.redditInsights?.organic_results?.length),
        aiToolingDataUsed: !!(context.aiToolingTrends?.organic_results?.length),
        githubDataUsed: !!(context.githubTrends?.organic_results?.length),
        youtubeDataUsed: !!(context.youtubeTrends?.organic_results?.length),
        generatedAt: new Date()
      }
    };
  }

  // ─── YouTube Video Enrichment ──────────────────────────────

  /**
   * Enrich each plan step with real, analyzed YouTube tutorial videos.
   * Searches YouTube for each step title, scores videos, and attaches top results.
   *
   * @param {Array} phases - Plan phases from structurePlan()
   * @param {string} keyword - Top-level career keyword
   * @param {Object} preferences - User language/region/creator preferences
   * @returns {Promise<Array>} Enriched phases with real YouTube video data
   */
  async enrichWithYouTubeVideos(phases, keyword, preferences = {}) {
    // Global set of video IDs already used — prevents the same video from
    // appearing in multiple steps across ANY phase.
    const usedVideoIds = new Set();
    // Also track by channel+title to catch near-duplicates (same creator, different upload)
    const usedVideoKeys = new Set();

    // Process phases sequentially to manage API quota
    for (const phase of phases) {
      if (!phase.steps || phase.steps.length === 0) continue;

      // Process steps SEQUENTIALLY (not parallel) so the dedup set stays consistent
      for (const step of phase.steps) {
        try {
          // Build a specific search query that differentiates each step.
          // The YouTubeSearchService._buildSearchQuery will append 'course' and exclusions,
          // so we focus on extracting specific skills/topics from the step.
          const stepSkills = (step.description || '').replace(/^.*?(You will learn|What you|Learn):/i, '').trim();
          const specificQuery = stepSkills && stepSkills.length > 10
            ? `${stepSkills.substring(0, 80)}`                    // Use specific skills from description
            : `${keyword} ${step.title} ${phase.title}`;          // Fallback: keyword + step + phase
          
          const videos = await youtubeSearchService.searchAndAnalyze(
            specificQuery,
            preferences,
            8 // fetch more candidates so we have room after filtering duplicates
          );

          if (videos.length > 0) {
            // Filter out videos already used in previous steps
            const uniqueVideos = videos.filter(v => {
              if (!v.videoId) return true; // keep non-YouTube resources
              if (usedVideoIds.has(v.videoId)) return false;

              // Also deduplicate near-identical videos from same channel
              // (e.g. same creator re-uploading similar content)
              const channelKey = `${(v.channelTitle || '').toLowerCase()}::${(v.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40)}`;
              if (usedVideoKeys.has(channelKey)) return false;

              return true;
            });

            // Take top 2 unique videos for this step (1 primary, 1 alternative)
            const selectedVideos = uniqueVideos.slice(0, 2);

            // Mark these as used globally
            for (const v of selectedVideos) {
              if (v.videoId) {
                usedVideoIds.add(v.videoId);
                const channelKey = `${(v.channelTitle || '').toLowerCase()}::${(v.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40)}`;
                usedVideoKeys.add(channelKey);
              }
            }

            if (selectedVideos.length > 0) {
              const youtubeResources = selectedVideos.map(v => ({
                name: v.title,
                url: v.youtubeUrl,
                type: 'video',
                isFree: true,
                provider: v.channelTitle,
                videoId: v.videoId,
                youtubeUrl: v.youtubeUrl,
                thumbnailUrl: v.thumbnailUrl,
                qualityScore: v.qualityScore,
                duration: v.duration,
                durationSeconds: v.durationSeconds,
              }));

              // Prepend YouTube resources (primary learning content)
              step.resources = [...youtubeResources, ...(step.resources || [])];
            }
          }
        } catch (err) {
          this.log('warn', `Video search failed for step "${step.title}": ${err.message}`);
        }
      }
    }

    this.log('info', `YouTube enrichment complete: ${usedVideoIds.size} unique videos assigned across all phases`);
    return phases;
  }
}

const learningPlanService = new LearningPlanService();
module.exports = learningPlanService;
