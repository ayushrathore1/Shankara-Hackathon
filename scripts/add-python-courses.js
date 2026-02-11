// Script to add analyzed Python videos to the vault as courses
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const Course = require('../models/Course');
const FreeResource = require('../models/FreeResource');
const http = require('http');

// Videos to add
const videos = [
  { url: 'https://youtu.be/UrsmFxEIp5k', provider: 'CodeWithHarry' },
  { url: 'https://youtu.be/ix9cRaBkVe0', provider: 'Bro Code' },
  { url: 'https://youtu.be/nLRL_NcnK-4', provider: 'freeCodeCamp' }
];

const playlist = {
  url: 'https://youtube.com/playlist?list=PLu71SKxNbfoBsMugTFALhdLlZ5VOqCg2s',
  provider: 'Chai aur Code'
};

async function analyzeVideo(url) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ url });
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/free-resources/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function addSingleVideoAsCourse(url, providerName) {
  console.log(`\nAdding video from ${providerName}...`);
  
  const analysis = await analyzeVideo(url);
  
  if (!analysis.success) {
    console.error('Analysis failed:', analysis.message);
    return null;
  }
  
  const videoData = analysis.videoData;
  const evaluation = analysis.evaluation;
  
  // Check if course already exists
  const existingCourse = await Course.findOne({ 
    name: videoData.title,
    provider: providerName
  });
  
  if (existingCourse) {
    console.log(`Course already exists: ${existingCourse.name}`);
    return existingCourse;
  }
  
  // Create the course
  const course = new Course({
    name: videoData.title,
    provider: providerName,
    description: evaluation.summary || videoData.description?.substring(0, 2000),
    thumbnail: videoData.thumbnail,
    category: 'python',
    level: 'beginner',
    targetAudience: evaluation.recommendedFor || 'Beginners looking to learn Python',
    tags: ['python', 'programming', 'tutorial', 'beginner'],
    lectureCount: 1,
    totalDuration: videoData.duration,
    averageScore: evaluation.codeLearnnScore || 0,
    externalUrl: `https://www.youtube.com/watch?v=${videoData.youtubeId}`,
    isActive: true,
    isFeatured: evaluation.codeLearnnScore >= 80
  });
  
  await course.save();
  console.log(`Created course: ${course.name} (Score: ${course.averageScore})`);
  
  // Check if FreeResource already exists
  let resource = await FreeResource.findOne({ youtubeId: videoData.youtubeId });
  
  if (!resource) {
    // Create the FreeResource (single video as one lecture)
    resource = new FreeResource({
      youtubeId: videoData.youtubeId,
      title: videoData.title,
      description: videoData.description?.substring(0, 2000),
      thumbnail: videoData.thumbnail,
      channelName: videoData.channelName,
      channelId: videoData.channelId || videoData.channelName || 'unknown',
      duration: videoData.duration,
      publishedAt: videoData.publishedAt,
      category: 'python',
      courseId: course._id,
      lectureOrder: 1,
      lectureNumber: 'Complete Course',
      level: 'beginner',
      tags: ['python', 'programming', 'tutorial'],
      statistics: videoData.statistics,
      codeLearnnScore: evaluation.codeLearnnScore || 0,
      qualityTier: evaluation.qualityTier || 'good',
      aiAnalysis: {
        breakdown: evaluation.breakdown,
        evaluationConfidence: evaluation.evaluationConfidence,
        recommendation: evaluation.recommendation,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        redFlags: evaluation.redFlags,
        recommendedFor: evaluation.recommendedFor,
        notRecommendedFor: evaluation.notRecommendedFor,
        summary: evaluation.summary,
        evaluatedAt: new Date()
      },
      isActive: true,
      isFeatured: evaluation.codeLearnnScore >= 80
    });
    
    await resource.save();
    console.log(`Created FreeResource: ${resource.title}`);
  } else {
    // Update existing resource with course reference
    resource.courseId = course._id;
    resource.lectureOrder = 1;
    await resource.save();
    console.log(`Updated existing FreeResource with course reference: ${resource.title}`);
  }
  
  return course;
}

async function addPlaylistAsCourse(url, providerName) {
  console.log(`\nAdding playlist from ${providerName}...`);
  
  const analysis = await analyzeVideo(url);
  
  if (!analysis.success || !analysis.isPlaylist) {
    console.error('Playlist analysis failed');
    return null;
  }
  
  const playlistData = analysis.playlistData;
  const evaluation = analysis.evaluation;
  
  // Check if course already exists
  const existingCourse = await Course.findOne({ 
    name: playlistData.title,
    provider: providerName
  });
  
  if (existingCourse) {
    console.log(`Course already exists: ${existingCourse.name}`);
    return existingCourse;
  }
  
  // Create the course
  const course = new Course({
    name: playlistData.title,
    provider: providerName,
    description: evaluation.summary,
    thumbnail: playlistData.thumbnail,
    category: 'python',
    level: 'beginner',
    targetAudience: 'Python beginners',
    tags: ['python', 'programming', 'tutorial', 'beginner', 'hindi'],
    lectureCount: evaluation.videoAnalyses?.length || playlistData.videoCount || 0,
    averageScore: evaluation.codeLearnnScore || 0,
    externalUrl: `https://www.youtube.com/playlist?list=${playlistData.playlistId}`,
    isActive: true,
    isFeatured: evaluation.codeLearnnScore >= 80
  });
  
  await course.save();
  console.log(`Created course: ${course.name} (Avg Score: ${course.averageScore})`);
  
  // Add individual videos as FreeResources
  if (evaluation.videoAnalyses) {
    let totalMinutes = 0;
    
    for (let i = 0; i < evaluation.videoAnalyses.length; i++) {
      const video = evaluation.videoAnalyses[i];
      
      // Check if already exists
      let resource = await FreeResource.findOne({ youtubeId: video.videoId });
      
      if (!resource) {
        resource = new FreeResource({
          youtubeId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: playlistData.channelName,
          channelId: playlistData.channelId || 'unknown',
          duration: video.duration,
          category: 'python',
          courseId: course._id,
          lectureOrder: i + 1,
          lectureNumber: `Lecture ${i + 1}`,
          level: 'beginner',
          tags: ['python', 'programming'],
          codeLearnnScore: video.score || 0,
          qualityTier: video.score >= 80 ? 'excellent' : video.score >= 60 ? 'good' : 'average',
          aiAnalysis: {
            summary: video.isProgrammingTutorial ? 'Programming tutorial' : video.detectedCategory,
            evaluatedAt: new Date()
          },
          isActive: true
        });
        
        await resource.save();
        console.log(`  Added lecture ${i + 1}: ${video.title.substring(0, 40)}...`);
      } else {
        resource.courseId = course._id;
        resource.lectureOrder = i + 1;
        await resource.save();
        console.log(`  Updated lecture ${i + 1}: ${video.title.substring(0, 40)}...`);
      }
      
      // Parse duration for total calculation
      if (video.duration) {
        const parts = video.duration.split(':');
        if (parts.length === 3) {
          totalMinutes += parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else if (parts.length === 2) {
          totalMinutes += parseInt(parts[0]);
        }
      }
    }
    
    // Update course total duration
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    course.totalDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    course.lectureCount = evaluation.videoAnalyses.length;
    await course.save();
  }
  
  return course;
}

async function main() {
  console.log('='.repeat(60));
  console.log('ADDING PYTHON COURSES TO VAULT');
  console.log('='.repeat(60));
  
  try {
    // Add single video courses
    for (const video of videos) {
      await addSingleVideoAsCourse(video.url, video.provider);
    }
    
    // Add playlist course
    await addPlaylistAsCourse(playlist.url, playlist.provider);
    
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    
    // Show all Python courses
    const pythonCourses = await Course.find({ category: 'python' }).sort({ averageScore: -1 });
    console.log(`\nTotal Python courses in vault: ${pythonCourses.length}`);
    
    for (const c of pythonCourses) {
      console.log(`- ${c.name} (${c.provider}) - Score: ${c.averageScore}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
