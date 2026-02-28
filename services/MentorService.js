const groqService = require('./GroqService');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const GamificationService = require('./GamificationService');

/**
 * MentorService — AI Career Mentor powered by Groq
 * Provides personalized career advice, skill gap analysis, and learning guidance
 */
class MentorService {

  static getSystemPrompt(userContext) {
    return `You are Medha AI Mentor — a friendly, knowledgeable career coach for developers. You help users with:
- Career advice and roadmap guidance
- Skill gap analysis and learning recommendations
- Interview preparation and tips
- Project ideas based on their skill level
- Industry trends and job market insights

USER CONTEXT:
- Name: ${userContext.name || 'Developer'}
- Career Goal: ${userContext.careerGoal || 'Not set'}
- Current Skills: ${userContext.skills?.join(', ') || 'None tracked yet'}
- Career Rank: ${userContext.rank || 'Intern'}
- Total XP: ${userContext.totalXP || 0}
- Experience Level: ${userContext.experienceLevel || 'beginner'}

RULES:
- Be concise but helpful. Use bullet points and structure.
- Give actionable, specific advice — not generic platitudes.
- Reference the user's actual skills and goals when relevant.
- Use markdown formatting (bold, lists, code blocks) for readability.
- If asked about non-career topics, gently redirect to career/learning topics.
- Encourage the user and celebrate their progress.
- Keep responses under 500 words unless the user asks for detail.`;
  }

  /**
   * Send a message and get AI response
   */
  static async chat(userId, userMessage) {
    // 1. Get user context
    const user = await User.findById(userId)
      .select('name careerGoal gamification learningPreferences')
      .lean();

    if (!user) throw new Error('User not found');

    const skills = await UserSkill.find({ userId })
      .sort({ level: -1 })
      .limit(10)
      .select('skill level')
      .lean();

    const gamProfile = await GamificationService.getProfile(userId);

    const userContext = {
      name: user.name,
      careerGoal: user.careerGoal?.title || user.careerGoal?.name || 'Not set',
      skills: skills.map(s => `${s.skill} (Lv${s.level})`),
      rank: gamProfile?.rank?.title || 'Intern',
      totalXP: gamProfile?.totalXP || 0,
      experienceLevel: user.learningPreferences?.experienceLevel || 'beginner'
    };

    // 2. Save user message
    await ChatMessage.create({
      userId,
      role: 'user',
      content: userMessage,
      context: userContext
    });

    // 3. Get recent conversation history (last 10 messages)
    const history = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Build messages array for Groq
    const messages = [
      { role: 'system', content: this.getSystemPrompt(userContext) },
      ...history
        .reverse()
        .map(m => ({ role: m.role, content: m.content }))
    ];

    // 4. Get AI response
    const aiResponse = await groqService.chat(messages, {
      temperature: 0.7,
      maxTokens: 1500
    });

    // 5. Save assistant message
    await ChatMessage.create({
      userId,
      role: 'assistant',
      content: aiResponse
    });

    // 6. Award XP for using mentor
    try {
      await GamificationService.awardXP(userId, 5, 'mentor_chat');
    } catch (e) {
      // Non-critical
    }

    return {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };
  }

  /**
   * Get conversation history
   */
  static async getHistory(userId, limit = 50) {
    const messages = await ChatMessage.find({ userId, role: { $ne: 'system' } })
      .sort({ createdAt: 1 })
      .limit(limit)
      .select('role content createdAt')
      .lean();

    return messages;
  }

  /**
   * Clear conversation history
   */
  static async clearHistory(userId) {
    await ChatMessage.deleteMany({ userId });
    return { success: true };
  }

  /**
   * Get suggested prompts based on user context
   */
  static async getSuggestedPrompts(userId) {
    const user = await User.findById(userId)
      .select('careerGoal gamification')
      .lean();

    const goal = user?.careerGoal?.title || user?.careerGoal?.name;
    const rank = GamificationService.getRank(user?.gamification?.totalXP || 0);

    const prompts = [
      '🗺️ What should I learn next?',
      '💼 Help me prepare for interviews',
      '🚀 Suggest a project idea for my level',
      '📊 Analyze my skill gaps',
    ];

    if (goal) {
      prompts.unshift(`🎯 How do I become a ${goal}?`);
    }

    if (rank.rank !== 'intern') {
      prompts.push(`📈 How do I reach ${rank.title} rank faster?`);
    }

    return prompts.slice(0, 6);
  }
}

module.exports = MentorService;
