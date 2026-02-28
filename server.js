const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const caches = require('./services/CacheService');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Cache service is ready immediately (in-memory)
console.log('🚀 Cache layer ready (in-memory)');

const app = express();


// Check if production environment
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for accurate IP detection behind Nginx/Load Balancer (Hostinger)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize passport
const passport = require('./config/passport');
app.use(passport.initialize());

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['https://shankara-hackathon.vercel.app', 'https://medhagivesclarity.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];

console.log('CORS Allowed Origins:', allowedOrigins);

// CORS configuration - must be before routes
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In production, log blocked origins but still allow for debugging
    console.log('CORS request from origin:', origin);
    // Allow all origins during debugging - comment this line to enforce strict CORS
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ALSO add explicit headers as backup (some proxies strip cors package headers)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  next();
});

// Handle preflight OPTIONS requests explicitly for all routes
// Note: Express 5.x requires named wildcard parameters
app.options('/{*path}', cors(corsOptions));

// Compression for responses
app.use(compression());

// Rate limiting - Scalable for high traffic
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // increased limit for scalability
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Route files
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const freeResourcesRoutes = require('./routes/freeResources');
const careerDomainRoutes = require('./routes/careerDomain');
const learningPathsRoutes = require('./routes/learningPaths');
const resourcesRoutes = require('./routes/resources');
const progressRoutes = require('./routes/progress');
const personalizedPathRoutes = require('./routes/personalizedPath');
const vaultRoutes = require('./routes/vault');
const waitlistRoutes = require('./routes/waitlist');
const blogRoutes = require('./routes/blogs');
const opportunityRoutes = require('./routes/opportunities');
const skillsRoutes = require('./routes/skills');
const eventsRoutes = require('./routes/events');
const journeyRoutes = require('./routes/journey');
const savedVideosRoutes = require('./routes/savedVideos');
const userLearningPathsRoutes = require('./routes/userLearningPaths');
const learningPathVersionsRoutes = require('./routes/learningPathVersions');
const aiSuggestionsRoutes = require('./routes/aiSuggestions');
const recommendationRoutes = require('./routes/recommendationRoutes');
const careerProfileRoutes = require('./routes/careerProfileRoutes');
const youtubeHistoryRoutes = require('./routes/youtubeHistory');
const gamificationRoutes = require('./routes/gamification');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/free-resources', freeResourcesRoutes);
app.use('/api/career', careerDomainRoutes);
app.use('/api/learning-paths', learningPathsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/personalized-path', personalizedPathRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/saved-videos', savedVideosRoutes);
app.use('/api/user/learning-paths', userLearningPathsRoutes);
app.use('/api/user/learning-paths', learningPathVersionsRoutes); // Version routes
app.use('/api/ai-suggestions', aiSuggestionsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/career-profile', careerProfileRoutes);
app.use('/api/youtube-tracker', youtubeHistoryRoutes);
app.use('/api/gamification', gamificationRoutes);

// Public Profile
const publicProfileRoutes = require('./routes/publicProfile');
app.use('/api/profile', publicProfileRoutes);

// AI Mentor
const mentorRoutes = require('./routes/mentor');
app.use('/api/mentor', mentorRoutes);

// Collaborative Projects
const projectRoutes = require('./routes/projects');
app.use('/api/projects', projectRoutes);

// Certificates
const certificateRoutes = require('./routes/certificates');
app.use('/api/certificates', certificateRoutes);

// Code Review
const codeReviewRoutes = require('./routes/codeReview');
app.use('/api/reviews', codeReviewRoutes);

// Charcha Forum
const charchaRoutes = require('./routes/charcha');
app.use('/api/charcha', charchaRoutes);

// Career Readiness Routes
const careerReadinessRoutes = require('./routes/careerReadiness');
app.use('/api/readiness', careerReadinessRoutes);

// Admin Routes (system stats, cache management)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// MedhaFlow — AI Career Discovery (no auth required)
const medhaFlowRoutes = require('./routes/medhaFlow');
app.use('/api/medha-flow', medhaFlowRoutes);

// Initialize background workers
const { initializeWorkers } = require('./services/BackgroundWorkers');
initializeWorkers();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Medha API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Medha API',
    version: '2.0.0',
    documentation: '/api/health'
  });
});

// Health check at root level for hosting providers (Hostinger)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handler middleware
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// ─── ML Classifier Child Process ──────────────────────────────────────
const { spawn } = require('child_process');
const path = require('path');

let mlProcess = null;
let mlRestartCount = 0;
const ML_MAX_RESTARTS = 5;
const ML_RESTART_DELAY_BASE = 2000; // 2s, doubles each retry

function spawnMLClassifier() {
  if (process.env.DISABLE_ML === 'true') {
    console.log('ℹ️  ML Classifier: Disabled via DISABLE_ML=true');
    return;
  }

  const mlDir = path.join(__dirname, 'ml-classifier');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

  console.log(`\n🧠 Starting ML Classifier (${pythonCmd} app.py)...`);

  mlProcess = spawn(pythonCmd, ['-u', 'app.py'], {
    cwd: mlDir,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  mlProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.log(`  [ML] ${line}`));
  });

  mlProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      // uvicorn logs INFO to stderr, so don't treat everything as error
      if (line.includes('ERROR') || line.includes('Traceback')) {
        console.error(`  [ML ERROR] ${line}`);
      } else {
        console.log(`  [ML] ${line}`);
      }
    });
  });

  mlProcess.on('close', (code) => {
    mlProcess = null;
    if (code !== 0 && code !== null) {
      mlRestartCount++;
      if (mlRestartCount <= ML_MAX_RESTARTS) {
        const delay = ML_RESTART_DELAY_BASE * Math.pow(2, mlRestartCount - 1);
        console.log(`⚠️  ML Classifier exited with code ${code}. Restarting in ${delay / 1000}s (attempt ${mlRestartCount}/${ML_MAX_RESTARTS})...`);
        setTimeout(spawnMLClassifier, delay);
      } else {
        console.error(`❌ ML Classifier crashed ${ML_MAX_RESTARTS} times. Giving up. Node.js will continue without ML features.`);
      }
    } else {
      console.log('🧠 ML Classifier stopped.');
    }
  });

  mlProcess.on('error', (err) => {
    console.error(`❌ Failed to start ML Classifier: ${err.message}`);
    console.log('   Node.js will continue without ML features.');
    mlProcess = null;
  });
}

// Graceful shutdown: kill ML process when Node.js exits
function shutdownML() {
  if (mlProcess) {
    console.log('🧠 Stopping ML Classifier...');
    mlProcess.kill('SIGTERM');
    mlProcess = null;
  }
}
process.on('SIGTERM', shutdownML);
process.on('SIGINT', shutdownML);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Configuration check
  console.log('\n📋 API Configuration Check:');
  console.log('─'.repeat(50));
  
  // Check YouTube API Key
  if (process.env.YOUTUBE_API_KEY) {
    console.log('✅ YouTube API Key: Configured');
  } else {
    console.log('⚠️  YouTube API Key: NOT CONFIGURED');
  }
  
  // Check GROQ API Keys (with fallback support)
  const groqKey1 = process.env.GROQ_API_KEY;
  const groqKey2 = process.env.GROQ_API_KEY2;
  if (groqKey1 && groqKey2) {
    console.log('✅ GROQ API Keys: 2 keys configured (with fallback)');
  } else if (groqKey1) {
    console.log('✅ GROQ API Key: 1 key configured (no fallback)');
  } else {
    console.log('⚠️  GROQ API Key: NOT CONFIGURED');
  }

  // Check Google Custom Search API
  if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_ID) {
    console.log('✅ Google Custom Search: Configured');
  } else if (process.env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_CSE_ID) {
    console.log('⚠️  Google Custom Search: PARTIALLY CONFIGURED (need both API_KEY and CSE_ID)');
  } else {
    console.log('ℹ️  Google Custom Search: Not configured (AI uses training data only)');
  }

  // Check RapidAPI (Job Search)
  if (process.env.RAPIDAPI_KEY) {
    console.log('✅ RapidAPI (Jobs): Configured');
  } else {
    console.log('ℹ️  RapidAPI (Jobs): Not configured');
  }
  
  // Check MongoDB
  console.log('✅ MongoDB: Connected');
  
  // List registered routes
  console.log('\n📍 Registered API Routes:');
  console.log('─'.repeat(50));
  console.log('  GET  /api/health');
  console.log('  GET  /api/free-resources');
  console.log('  GET  /api/free-resources/browse');
  console.log('  GET  /api/free-resources/categories');
  console.log('  POST /api/free-resources/analyze');
  console.log('  GET  /api/vault');
  console.log('  GET  /api/vault/featured');
  console.log('  GET  /api/vault/categories');
  console.log('  GET  /api/vault/domains');
  console.log('  GET  /api/progress/me');
  console.log('  POST /api/progress/start');
  console.log('  POST /api/progress/complete');
  console.log('  POST /api/personalized-path/generate');
  console.log('  GET  /api/personalized-path/my-paths');
  console.log('  POST /api/career/roadmap');
  console.log('  POST /api/career/explore');
  console.log('  GET  /api/career/trending');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/contact');
  console.log('─'.repeat(50));
  console.log('');

  // Start ML Classifier as a child process
  spawnMLClassifier();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  shutdownML();
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;

