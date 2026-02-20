/**
 * Video Classifier — Keyword-based YouTube video categorization
 * Classifies videos as: programming, tech, distraction, or other
 * Used by YouTubeHistoryService when auto-tracking extension data
 */

const CATEGORIES = {
  programming: [
    // Languages & frameworks
    'react', 'node', 'nodejs', 'python', 'javascript', 'typescript', 'java ',
    'c++', 'c#', 'rust', 'golang', 'go lang', 'swift', 'kotlin', 'ruby',
    'php', 'dart', 'flutter', 'django', 'flask', 'fastapi', 'express',
    'spring boot', 'next.js', 'nextjs', 'nuxt', 'vue', 'angular', 'svelte',
    'react native', 'swiftui',
    // Web dev
    'html', 'css', 'tailwind', 'sass', 'frontend', 'backend', 'fullstack',
    'full stack', 'web dev', 'web development', 'responsive design',
    // DSA & competitive
    'dsa', 'algorithm', 'data structure', 'leetcode', 'codeforces',
    'competitive programming', 'sorting', 'searching', 'dynamic programming',
    'binary tree', 'linked list', 'graph theory', 'recursion',
    // DevOps & infra
    'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'ci/cd',
    'jenkins', 'terraform', 'ansible', 'nginx', 'linux', 'devops',
    // Database & tools
    'sql', 'mysql', 'postgres', 'mongodb', 'redis', 'firebase',
    'git', 'github', 'api', 'rest api', 'graphql', 'websocket',
    // General programming
    'coding', 'programming', 'tutorial', 'code', 'developer', 'software engineer',
    'beginner to advanced', 'crash course', 'freecodecamp', 'traversy',
    'the coding train', 'fireship', 'tech with tim', 'corey schafer',
    'net ninja', 'academind', 'programming with mosh',
  ],

  tech: [
    // AI/ML
    'artificial intelligence', 'machine learning', 'deep learning',
    'neural network', 'tensorflow', 'pytorch', 'generative ai', 'chatgpt',
    'openai', 'llm', 'large language model', 'diffusion model', 'ai ',
    'data science', 'nlp', 'computer vision',
    // Hardware & gadgets
    'tech review', 'unboxing', 'gadget', 'smartphone', 'laptop review',
    'iphone', 'macbook', 'samsung', 'pixel', 'processor', 'gpu', 'cpu',
    'chip', 'benchmark',
    // Tech industry
    'startup', 'silicon valley', 'product hunt', 'saas', 'tech news',
    'cybersecurity', 'blockchain', 'crypto', 'web3', 'nft',
    'cloud computing', 'quantum computing',
    // Tech channels
    'mkbhd', 'linus tech', 'dave2d', 'mrwhosetheboss', 'austin evans',
    'jayztwocents', 'gamers nexus', 'digital foundry',
  ],

  distraction: [
    // Entertainment
    'entertainment', 'vlog', 'daily vlog', 'vlogger',
    'gaming', 'gameplay', 'walkthrough', 'lets play', "let's play",
    'fortnite', 'minecraft', 'gta', 'call of duty', 'valorant',
    'meme', 'memes', 'funny', 'comedy', 'stand up', 'standup',
    'prank', 'reaction', 'react to', 'reacting to',
    'music video', 'official video', 'lyric video', 'music mix',
    'movie', 'trailer', 'film', 'netflix', 'series',
    'celebrity', 'gossip', 'drama', 'roast',
    'tiktok', 'shorts', 'challenge', 'trend',
    'mukbang', 'asmr', 'satisfying', 'oddly satisfying',
    'beauty', 'makeup tutorial', 'skincare', 'fashion haul',
    'travel vlog', 'cooking', 'recipe',
    // Sports & fitness (non-educational)
    'highlights', 'match', 'vs ', 'fight',
    // Clickbait patterns
    'you won\'t believe', 'gone wrong', 'exposed', 'shocking',
  ],
};

/**
 * Classify a YouTube video based on title and channel name.
 * @param {{ title: string, channelTitle?: string }} video
 * @returns {'programming' | 'tech' | 'distraction' | 'other'}
 */
function classifyVideo({ title = '', channelTitle = '' }) {
  const text = `${title} ${channelTitle}`.toLowerCase();

  // Score each category by number of keyword matches
  const scores = {};
  let maxScore = 0;
  let bestCategory = 'other';

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        // Longer keywords are stronger signals
        score += kw.length >= 8 ? 2 : 1;
      }
    }
    scores[category] = score;
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  // Need at least 1 keyword match to classify
  if (maxScore === 0) return 'other';

  // If programming and distraction tie, prefer programming
  // (e.g., "React Tutorial" could match both "tutorial" and something else)
  if (bestCategory === 'distraction' && scores.programming >= scores.distraction) {
    return 'programming';
  }

  return bestCategory;
}

module.exports = { classifyVideo, CATEGORIES };
