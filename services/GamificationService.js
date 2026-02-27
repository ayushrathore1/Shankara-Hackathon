const Achievement = require('../models/Achievement');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');

/**
 * GamificationService
 * Manages XP, career ranks, streaks, and achievements
 */

// Career rank tiers (ordered by XP threshold)
const CAREER_RANKS = [
  { rank: 'intern',     minXP: 0,      title: 'Intern',           icon: '🌱' },
  { rank: 'junior',     minXP: 500,    title: 'Junior Developer',  icon: '💻' },
  { rank: 'mid',        minXP: 2000,   title: 'Mid Developer',     icon: '⚡' },
  { rank: 'senior',     minXP: 5000,   title: 'Senior Developer',  icon: '🔥' },
  { rank: 'lead',       minXP: 10000,  title: 'Tech Lead',         icon: '🚀' },
  { rank: 'architect',  minXP: 20000,  title: 'Architect',         icon: '🏗️' },
  { rank: 'cto',        minXP: 50000,  title: 'CTO',               icon: '👑' },
];

// Achievement definitions
const ACHIEVEMENT_DEFS = {
  // Skill Mastery
  'first-skill': {
    title: 'First Steps',
    description: 'Earn your first skill point',
    category: 'skill-mastery',
    tier: 'bronze',
    icon: '🎯',
    xpReward: 25
  },
  'skill-beginner': {
    title: 'Rising Star',
    description: 'Reach Beginner level in any skill',
    category: 'skill-mastery',
    tier: 'bronze',
    icon: '⭐',
    xpReward: 50
  },
  'skill-intermediate': {
    title: 'Getting Serious',
    description: 'Reach Intermediate level in any skill',
    category: 'skill-mastery',
    tier: 'silver',
    icon: '💪',
    xpReward: 100
  },
  'skill-advanced': {
    title: 'Domain Expert',
    description: 'Reach Advanced level in any skill',
    category: 'skill-mastery',
    tier: 'gold',
    icon: '🏆',
    xpReward: 250
  },
  'skill-expert': {
    title: 'Mastery Achieved',
    description: 'Reach Expert level in any skill',
    category: 'skill-mastery',
    tier: 'platinum',
    icon: '💎',
    xpReward: 500
  },
  'polyglot-3': {
    title: 'Polyglot',
    description: 'Learn 3 different skills',
    category: 'skill-mastery',
    tier: 'silver',
    icon: '🌐',
    xpReward: 75
  },
  'polyglot-10': {
    title: 'Renaissance Dev',
    description: 'Learn 10 different skills',
    category: 'skill-mastery',
    tier: 'gold',
    icon: '🎨',
    xpReward: 200
  },

  // Consistency
  'streak-3': {
    title: 'Getting Started',
    description: 'Maintain a 3-day learning streak',
    category: 'consistency',
    tier: 'bronze',
    icon: '🔥',
    xpReward: 30
  },
  'streak-7': {
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    category: 'consistency',
    tier: 'silver',
    icon: '📅',
    xpReward: 75
  },
  'streak-30': {
    title: 'Monthly Machine',
    description: 'Maintain a 30-day learning streak',
    category: 'consistency',
    tier: 'gold',
    icon: '🗓️',
    xpReward: 300
  },
  'streak-100': {
    title: 'Centurion',
    description: 'Maintain a 100-day learning streak',
    category: 'consistency',
    tier: 'diamond',
    icon: '💯',
    xpReward: 1000
  },

  // Learning
  'first-path': {
    title: 'Path Finder',
    description: 'Start your first learning path',
    category: 'learning',
    tier: 'bronze',
    icon: '🛤️',
    xpReward: 25
  },
  'complete-path': {
    title: 'Path Complete',
    description: 'Complete a learning path',
    category: 'learning',
    tier: 'silver',
    icon: '✅',
    xpReward: 150
  },
  'videos-10': {
    title: 'Binge Learner',
    description: 'Watch 10 learning videos',
    category: 'learning',
    tier: 'bronze',
    icon: '📺',
    xpReward: 40
  },
  'videos-50': {
    title: 'Knowledge Seeker',
    description: 'Watch 50 learning videos',
    category: 'learning',
    tier: 'silver',
    icon: '📚',
    xpReward: 100
  },
  'quizzes-5': {
    title: 'Quiz Whiz',
    description: 'Pass 5 skill checkpoints',
    category: 'learning',
    tier: 'silver',
    icon: '🧠',
    xpReward: 75
  },

  // Career
  'career-started': {
    title: 'Career Journey Begins',
    description: 'Start a career journey',
    category: 'career-milestone',
    tier: 'bronze',
    icon: '🚀',
    xpReward: 50
  },
  'phase-complete': {
    title: 'Phase Unlocked',
    description: 'Complete a career journey phase',
    category: 'career-milestone',
    tier: 'silver',
    icon: '🔓',
    xpReward: 100
  },
  'career-ready': {
    title: 'Career Ready',
    description: 'Achieve 70%+ career readiness score',
    category: 'career-milestone',
    tier: 'gold',
    icon: '🎯',
    xpReward: 300
  },

  // Community
  'first-post': {
    title: 'Voice Found',
    description: 'Create your first Charcha post',
    category: 'community',
    tier: 'bronze',
    icon: '💬',
    xpReward: 20
  },
  'helpful-10': {
    title: 'Helpful Hand',
    description: 'Receive 10 upvotes on your posts',
    category: 'community',
    tier: 'silver',
    icon: '🤝',
    xpReward: 75
  },

  // Explorer
  'profile-complete': {
    title: 'Identity Established',
    description: 'Complete your profile with bio and skills',
    category: 'explorer',
    tier: 'bronze',
    icon: '🪪',
    xpReward: 30
  },
  'first-analysis': {
    title: 'Quality Scout',
    description: 'Analyze your first YouTube video',
    category: 'explorer',
    tier: 'bronze',
    icon: '🔍',
    xpReward: 25
  },
  'referral-first': {
    title: 'Growth Hacker',
    description: 'Successfully refer your first friend',
    category: 'explorer',
    tier: 'silver',
    icon: '📢',
    xpReward: 100
  }
};

class GamificationService {
  /**
   * Calculate career rank from total XP
   */
  static getRank(totalXP) {
    let current = CAREER_RANKS[0];
    for (const rank of CAREER_RANKS) {
      if (totalXP >= rank.minXP) {
        current = rank;
      } else {
        break;
      }
    }
    
    // Find next rank
    const currentIndex = CAREER_RANKS.indexOf(current);
    const nextRank = CAREER_RANKS[currentIndex + 1] || null;
    
    return {
      ...current,
      nextRank: nextRank ? {
        rank: nextRank.rank,
        title: nextRank.title,
        icon: nextRank.icon,
        xpNeeded: nextRank.minXP - totalXP
      } : null,
      progress: nextRank 
        ? ((totalXP - current.minXP) / (nextRank.minXP - current.minXP)) * 100
        : 100
    };
  }

  /**
   * Update daily streak for a user
   */
  static async updateStreak(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActive = user.gamification?.lastActiveDate;
    
    let currentStreak = user.gamification?.currentStreak || 0;
    let longestStreak = user.gamification?.longestStreak || 0;

    if (lastActive) {
      const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
      const diffDays = Math.floor((today - lastActiveDay) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, no change
        return { currentStreak, longestStreak, streakUpdated: false };
      } else if (diffDays === 1) {
        // Consecutive day
        currentStreak += 1;
      } else {
        // Streak broken
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    await User.findByIdAndUpdate(userId, {
      'gamification.currentStreak': currentStreak,
      'gamification.longestStreak': longestStreak,
      'gamification.lastActiveDate': now
    });

    // Check streak achievements
    const streakAchievements = [];
    if (currentStreak >= 3) streakAchievements.push('streak-3');
    if (currentStreak >= 7) streakAchievements.push('streak-7');
    if (currentStreak >= 30) streakAchievements.push('streak-30');
    if (currentStreak >= 100) streakAchievements.push('streak-100');

    const newAchievements = [];
    for (const achId of streakAchievements) {
      const result = await this.tryAwardAchievement(userId, achId);
      if (result?.awarded) newAchievements.push(result.achievement);
    }

    return { currentStreak, longestStreak, streakUpdated: true, newAchievements };
  }

  /**
   * Award XP to a user and recalculate rank
   */
  static async awardXP(userId, amount, source = 'general') {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { 'gamification.totalXP': amount } },
      { new: true }
    );

    if (!user) return null;

    const totalXP = user.gamification?.totalXP || 0;
    const rankInfo = this.getRank(totalXP);

    // Update rank if changed
    if (user.gamification?.careerRank !== rankInfo.rank) {
      await User.findByIdAndUpdate(userId, {
        'gamification.careerRank': rankInfo.rank
      });
    }

    return { totalXP, rankInfo, xpAwarded: amount, source };
  }

  /**
   * Try to award an achievement (idempotent)
   */
  static async tryAwardAchievement(userId, achievementId) {
    const def = ACHIEVEMENT_DEFS[achievementId];
    if (!def) return null;

    const result = await Achievement.award(userId, {
      achievementId,
      ...def
    });

    // If newly awarded, give XP reward
    if (result.awarded && def.xpReward) {
      await this.awardXP(userId, def.xpReward, `achievement:${achievementId}`);
      
      // Update achievement count on user
      await User.findByIdAndUpdate(userId, {
        $inc: { 'gamification.achievementsCount': 1 }
      });
    }

    return result;
  }

  /**
   * Check and award skill-based achievements
   */
  static async checkSkillAchievements(userId) {
    const skills = await UserSkill.getUserSkills(userId);
    const newAchievements = [];

    // First skill
    if (skills.length > 0) {
      const r = await this.tryAwardAchievement(userId, 'first-skill');
      if (r?.awarded) newAchievements.push(r.achievement);
    }

    // Polyglot achievements
    const learnedSkills = skills.filter(s => s.score >= 20);
    if (learnedSkills.length >= 3) {
      const r = await this.tryAwardAchievement(userId, 'polyglot-3');
      if (r?.awarded) newAchievements.push(r.achievement);
    }
    if (learnedSkills.length >= 10) {
      const r = await this.tryAwardAchievement(userId, 'polyglot-10');
      if (r?.awarded) newAchievements.push(r.achievement);
    }

    // Level-based achievements
    for (const skill of skills) {
      if (skill.level === 'beginner' || skill.score >= 20) {
        const r = await this.tryAwardAchievement(userId, 'skill-beginner');
        if (r?.awarded) newAchievements.push(r.achievement);
      }
      if (skill.level === 'intermediate' || skill.score >= 45) {
        const r = await this.tryAwardAchievement(userId, 'skill-intermediate');
        if (r?.awarded) newAchievements.push(r.achievement);
      }
      if (skill.level === 'advanced' || skill.score >= 70) {
        const r = await this.tryAwardAchievement(userId, 'skill-advanced');
        if (r?.awarded) newAchievements.push(r.achievement);
      }
      if (skill.level === 'expert' || skill.score >= 90) {
        const r = await this.tryAwardAchievement(userId, 'skill-expert');
        if (r?.awarded) newAchievements.push(r.achievement);
      }
    }

    return newAchievements;
  }

  /**
   * Get full gamification profile for a user
   */
  static async getProfile(userId) {
    const user = await User.findById(userId).select('gamification name').lean();
    if (!user) return null;

    const gam = user.gamification || {};
    const totalXP = gam.totalXP || 0;
    const rankInfo = this.getRank(totalXP);
    const achievements = await Achievement.getUserAchievements(userId);
    const categoryCounts = await Achievement.getCategoryCounts(userId);

    return {
      user: { name: user.name },
      totalXP,
      rank: rankInfo,
      streak: {
        current: gam.currentStreak || 0,
        longest: gam.longestStreak || 0,
        lastActive: gam.lastActiveDate
      },
      achievements: {
        total: achievements.length,
        totalAvailable: Object.keys(ACHIEVEMENT_DEFS).length,
        byCategory: categoryCounts,
        recent: achievements.slice(0, 5),
        all: achievements
      }
    };
  }

  /**
   * Get all achievement definitions (for the achievements gallery)
   */
  static getAllDefinitions() {
    return Object.entries(ACHIEVEMENT_DEFS).map(([id, def]) => ({
      achievementId: id,
      ...def
    }));
  }

  /**
   * Get the career ranks table
   */
  static getCareerRanks() {
    return CAREER_RANKS;
  }
}

module.exports = GamificationService;
