const express = require('express');
const router = express.Router();
const careerDomainService = require('../services/CareerDomainService');
const jobApiService = require('../services/JobApiService');
const learningPlanService = require('../services/LearningPlanService');
const CareerKeywordCache = require('../models/CareerKeywordCache');
const CareerLearningPlan = require('../models/CareerLearningPlan');

/**
 * @route   GET /api/career/cached
 * @desc    Browse cached career keywords by category
 * @access  Public
 */
router.get('/cached', async (req, res) => {
  try {
    const { category, subcategory, page = 1, limit = 20 } = req.query;

    if (!category) {
      // Return category tree
      const categoryTree = await CareerKeywordCache.getCategoryTree();
      return res.json({
        success: true,
        data: categoryTree
      });
    }

    const keywords = await CareerKeywordCache.browseByCategory(category, subcategory);
    res.json({
      success: true,
      data: keywords
    });
  } catch (error) {
    console.error('Browse cached keywords error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to browse cached keywords'
    });
  }
});

/**
 * @route   GET /api/career/search
 * @desc    Search cached career keywords
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const results = await CareerKeywordCache.search(q.trim(), {
      category,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search cached keywords error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search keywords'
    });
  }
});

/**
 * @route   GET /api/career/popular
 * @desc    Get popular career keywords from database (user searches)
 * @access  Public
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    // Get most searched keywords from database
    const popular = await CareerKeywordCache.find({})
      .sort({ usageCount: -1, updatedAt: -1 })
      .limit(parseInt(limit))
      .select('keyword category subcategory tags usageCount analysis.summary analysis.primaryCategory analysis.totalDomainsFound updatedAt');

    const formatted = popular.map(item => ({
      keyword: item.keyword,
      category: item.category || item.analysis?.primaryCategory || 'technology',
      subcategory: item.subcategory,
      tags: item.tags?.slice(0, 3) || [],
      usageCount: item.usageCount || 1,
      summary: item.analysis?.summary?.substring(0, 100) || '',
      totalDomains: item.analysis?.totalDomainsFound || 0,
      lastSearched: item.updatedAt
    }));

    res.json({
      success: true,
      data: formatted,
      total: await CareerKeywordCache.countDocuments()
    });
  } catch (error) {
    console.error('Get popular keywords error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular keywords'
    });
  }
});

/**
 * @route   GET /api/career/categories
 * @desc    Get category tree with counts
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categoryTree = await CareerKeywordCache.getCategoryTree();
    res.json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

/**
 * @route   POST /api/career/roadmap
 * @desc    Generate comprehensive career roadmap with real-time web context
 * @access  Public
 */
router.post('/roadmap', async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a keyword (minimum 2 characters)'
      });
    }

    const result = await careerDomainService.generateCareerRoadmap(keyword.trim());

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        suggestion: result.suggestion
      });
    }

    res.json({
      success: true,
      data: result.roadmap,
      fromDatabase: result.fromDatabase,
      usageCount: result.usageCount
    });
  } catch (error) {
    console.error('Career roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate career roadmap',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/career/moderate
 * @desc    Check if a keyword is appropriate for career search
 * @access  Public
 */
router.post('/moderate', async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a keyword'
      });
    }

    const result = await careerDomainService.moderateKeyword(keyword);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Moderation check failed'
    });
  }
});

/**
 * @route   GET /api/career/roadmaps/popular
 * @desc    Get most popular career roadmaps
 * @access  Public
 */
router.get('/roadmaps/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const popular = await careerDomainService.getPopularRoadmaps(parseInt(limit));

    res.json({
      success: true,
      data: popular
    });
  } catch (error) {
    console.error('Get popular roadmaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular roadmaps'
    });
  }
});

/**
 * @route   POST /api/career/explore
 * @desc    Analyze a keyword and return career domains with job data
 * @access  Public
 */
router.post('/explore', async (req, res) => {
  try {
    const { keyword, location = 'India' } = req.body;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a keyword (minimum 2 characters)'
      });
    }

    const normalizedKeyword = keyword.trim().substring(0, 100); // Limit length
    const normalizedLocation = location || 'India';

    // Get AI analysis
    const analysis = await careerDomainService.analyzeKeyword(normalizedKeyword);

    // Get initial job counts with location filter
    const jobData = await jobApiService.searchJobs(normalizedKeyword, { 
      location: normalizedLocation,
      limit: 5 
    });

    res.json({
      success: true,
      data: {
        analysis,
        location: normalizedLocation,
        quickJobPreview: jobData.jobs.slice(0, 3),
        totalJobsFound: jobData.totalCount,
        linkedinSearchUrl: jobApiService.generateLinkedInSearchUrl(normalizedKeyword, normalizedLocation)
      }
    });
  } catch (error) {
    console.error('Career explore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze keyword',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/career/domain/:domainId
 * @desc    Get detailed information about a specific domain
 * @access  Public
 */
router.get('/domain/:domainName', async (req, res) => {
  try {
    const { domainName } = req.params;
    const { parentKeyword } = req.query;

    if (!domainName) {
      return res.status(400).json({
        success: false,
        message: 'Domain name is required'
      });
    }

    // Get domain details from AI
    const domainDetails = await careerDomainService.getDomainDetails(
      decodeURIComponent(domainName),
      parentKeyword || domainName
    );

    // Get jobs for this domain
    const jobData = await jobApiService.searchJobs(domainName, { limit: 10 });

    res.json({
      success: true,
      data: {
        domain: domainDetails,
        jobs: jobData.jobs,
        totalJobs: jobData.totalCount,
        linkedinSearchUrl: jobApiService.generateLinkedInSearchUrl(domainName)
      }
    });
  } catch (error) {
    console.error('Domain details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get domain details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/career/job-role/:roleName
 * @desc    Get detailed information about a specific job role
 * @access  Public
 */
router.get('/job-role/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params;
    const { domain } = req.query;

    if (!roleName) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Get job role details from AI
    const roleDetails = await careerDomainService.getJobRoleDetails(
      decodeURIComponent(roleName),
      domain || 'Technology'
    );

    // Get actual job listings for this role
    const jobListings = await jobApiService.searchJobs(roleName, { limit: 15 });
    const linkedinJobs = await jobApiService.searchLinkedInJobs(roleName, { limit: 10 });

    res.json({
      success: true,
      data: {
        role: roleDetails,
        jobListings: jobListings.jobs,
        linkedinListings: linkedinJobs.jobs,
        totalListings: jobListings.totalCount + linkedinJobs.totalCount,
        linkedinSearchUrl: jobApiService.generateLinkedInSearchUrl(roleName)
      }
    });
  } catch (error) {
    console.error('Job role details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job role details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/career/jobs/search
 * @desc    Search for jobs with filters
 * @access  Public
 */
router.get('/jobs/search', async (req, res) => {
  try {
    const { keyword, location, days, limit, offset } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword is required'
      });
    }

    const jobData = await jobApiService.searchJobs(keyword, {
      location,
      days: parseInt(days) || 30,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.json({
      success: true,
      data: jobData
    });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/career/trending
 * @desc    Get trending tech domains
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const trendingDomains = await careerDomainService.getTrendingDomains();

    res.json({
      success: true,
      data: trendingDomains
    });
  } catch (error) {
    console.error('Trending domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending domains',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/career/learning-plan/:keyword
 * @desc    Generate or retrieve an AI-powered learning plan with real-time data
 * @access  Public
 */
router.get('/learning-plan/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Keyword must be at least 2 characters'
      });
    }

    const result = await learningPlanService.generateLearningPlan(keyword.trim());

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to generate learning plan'
      });
    }

    res.json({
      success: true,
      data: result.plan,
      fromDatabase: result.fromDatabase || false,
      usageCount: result.usageCount
    });
  } catch (error) {
    console.error('Learning plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate learning plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/career/learning-plans/popular
 * @desc    Get most popular AI learning plans
 * @access  Public
 */
router.get('/learning-plans/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const popular = await CareerLearningPlan.getPopular(parseInt(limit));

    res.json({
      success: true,
      data: popular
    });
  } catch (error) {
    console.error('Popular learning plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular learning plans'
    });
  }
});

/**
 * @route   GET /api/career/health
 * @desc    Check career service health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Career Domain API is running',
    services: {
      groqAi: !!process.env.GROQ_API_KEY,
      jobApis: jobApiService.getApiStatus()
    }
  });
});

module.exports = router;
