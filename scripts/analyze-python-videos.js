// Quick script to analyze Python videos and display scores
const http = require('http');

const videos = [
  'https://youtu.be/UrsmFxEIp5k',
  'https://youtu.be/ix9cRaBkVe0',
  'https://youtube.com/playlist?list=PLu71SKxNbfoBsMugTFALhdLlZ5VOqCg2s',
  'https://youtu.be/nLRL_NcnK-4'
];

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

async function main() {
  console.log('='.repeat(80));
  console.log('PYTHON VIDEO ANALYSIS RESULTS');
  console.log('='.repeat(80));
  
  for (let i = 0; i < videos.length; i++) {
    try {
      console.log(`\n[${i + 1}] Analyzing: ${videos[i]}`);
      const result = await analyzeVideo(videos[i]);
      
      if (result.isPlaylist) {
        console.log('TYPE: Playlist');
        console.log(`TITLE: ${result.playlistData?.title || 'N/A'}`);
        console.log(`CHANNEL: ${result.playlistData?.channelName || 'N/A'}`);
        console.log(`VIDEO COUNT: ${result.playlistData?.videoCount || 'N/A'}`);
        console.log(`AVG SCORE: ${result.evaluation?.codeLearnnScore || 'N/A'}`);
        console.log(`QUALITY TIER: ${result.evaluation?.qualityTier || 'N/A'}`);
        console.log(`SUMMARY: ${result.evaluation?.summary?.substring(0, 200) || 'N/A'}...`);
        
        // Show individual video scores
        if (result.evaluation?.videoAnalyses) {
          console.log('\nIndividual Video Scores:');
          result.evaluation.videoAnalyses.forEach((v, idx) => {
            console.log(`  ${idx + 1}. ${v.title?.substring(0, 50)}... | Score: ${v.score} | ${v.isProgrammingTutorial ? 'Programming' : v.detectedCategory}`);
          });
        }
      } else {
        console.log('TYPE: Single Video');
        console.log(`TITLE: ${result.videoData?.title || 'N/A'}`);
        console.log(`CHANNEL: ${result.videoData?.channelName || 'N/A'}`);
        console.log(`DURATION: ${result.videoData?.duration || 'N/A'}`);
        console.log(`CODELEARNN SCORE: ${result.evaluation?.codeLearnnScore || 'N/A'}`);
        console.log(`QUALITY TIER: ${result.evaluation?.qualityTier || 'N/A'}`);
        console.log(`RECOMMENDATION: ${result.evaluation?.recommendation || 'N/A'}`);
        console.log(`SUMMARY: ${result.evaluation?.summary?.substring(0, 200) || 'N/A'}...`);
      }
      console.log('-'.repeat(80));
    } catch (error) {
      console.error(`Error analyzing ${videos[i]}:`, error.message);
    }
  }
}

main().catch(console.error);
