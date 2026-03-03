const axios = require('axios');
const groqService = require('./GroqService');

/**
 * RAGMentorService — Orchestrates the RAG career mentoring pipeline.
 * 
 * Flow:
 *   1. Send user query to Python RAG sidecar → retrieves relevant careers + builds prompt
 *   2. Send the RAG-augmented prompt to Groq API (LLaMA) → get structured JSON response
 *   3. Parse and return the mentoring result
 */
class RAGMentorService {

  constructor() {
    // Python RAG sidecar runs on port 8100 (same as ML classifier)
    this.ragBaseUrl = process.env.ML_CLASSIFIER_URL || 'http://localhost:8100';
  }

  /**
   * Main RAG mentor chat — retrieves context and generates personalized career advice
   * @param {string} userMessage - The student's query
   * @returns {Promise<Object>} Structured career mentoring response
   */
  async chat(userMessage) {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('Message is required');
    }

    // ─── Step 1: Retrieve relevant careers from Vector DB ───
    let ragResult;
    try {
      const response = await axios.post(`${this.ragBaseUrl}/rag/retrieve`, {
        query: userMessage.trim(),
        n_results: 3
      }, { timeout: 30000 });

      ragResult = response.data;
    } catch (error) {
      console.error('RAG retrieval failed:', error.message);
      // Fallback: use Groq without RAG context
      return this.chatWithoutRAG(userMessage);
    }

    // ─── Step 2: Call Groq API with RAG-augmented prompt ───
    const messages = [
      { role: 'system', content: ragResult.prompt.system },
      { role: 'user', content: ragResult.prompt.user }
    ];

    let aiResponse;
    try {
      aiResponse = await groqService.chat(messages, {
        temperature: 0.7,
        maxTokens: 2000
      });
    } catch (error) {
      console.error('Groq API call failed:', error.message);
      throw new Error('AI service temporarily unavailable');
    }

    // ─── Step 3: Parse the structured JSON response ───
    const parsed = this.parseResponse(aiResponse);

    return {
      ...parsed,
      retrieved_careers: ragResult.retrieved_careers?.map(c => ({
        id: c.id,
        title: c.title,
        relevance: c.distance ? (1 - c.distance).toFixed(2) : null
      })) || [],
      rag_enhanced: true
    };
  }

  /**
   * Fallback: Chat without RAG context (direct Groq call)
   */
  async chatWithoutRAG(userMessage) {
    const messages = [
      {
        role: 'system',
        content: `You are Medha — NOT a formal career counselor, but a brilliant, wise FRIEND who genuinely cares about this student's future. You're that one senior/didi/bhaiya everyone wishes they had — someone who's been through it all and always knows what to say.

YOUR PERSONALITY:
- Warm, relatable, witty. You talk like a friend over chai, not an advisor in a conference room
- Use casual language naturally (mix Hindi-English if they do — "yaar", "suno", "dekho")
- Emotionally intelligent — pick up on anxiety, confusion, excitement, and respond accordingly
- NEVER sound like a chatbot or textbook. Sound HUMAN

PSYCHOLOGICAL APPROACH:
- If CONFUSED: Validate feelings first, then ask ONE discovery question
- If ANXIOUS: Normalize first — "bhai, almost everyone feels this at your stage"
- If EXCITED: Match energy, then channel it toward a direction
- If following PRESSURE: Separate their voice — "forget what everyone says, what does YOUR gut say?"
- Read between the lines — what they DON'T say matters most

EMOTION DETECTION:
- Detect emotional state from word choices, punctuation, style
- Mirror their energy — be hype when they're excited, gentle when confused, real when anxious

Respond with ONLY valid JSON:
{
  "personality_analysis": "2-3 sentence FRIENDLY observation — write like telling a friend what you noticed, not a psych report",
  "clarity_score": <0-10>,
  "clarity_explanation": "1 casual sentence — like 'You've got a vibe but not a direction yet'",
  "career_suggestions": [
    {
      "name": "Career Title",
      "match_score": <0-100>,
      "reason": "Why this fits — written like telling them over coffee",
      "roadmap": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
      "first_step": "What to do THIS WEEK — make it sound exciting not like homework",
      "salary_range": "Range",
      "demand": "Level"
    }
  ]
}
Always suggest exactly 3 careers. Mirror their language style in ALL text fields.`
      },
      { role: 'user', content: userMessage }
    ];

    const aiResponse = await groqService.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000
    });

    const parsed = this.parseResponse(aiResponse);

    return {
      ...parsed,
      retrieved_careers: [],
      rag_enhanced: false
    };
  }

  /**
   * Parse the AI response, handling potential JSON parsing issues
   */
  parseResponse(response) {
    try {
      // Try to extract JSON from the response
      let jsonStr = response.trim();

      // Handle markdown code blocks
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields and provide defaults
      return {
        personality_analysis: parsed.personality_analysis || 'Unable to analyze personality from the given input.',
        clarity_score: typeof parsed.clarity_score === 'number' ? parsed.clarity_score : 5,
        clarity_explanation: parsed.clarity_explanation || '',
        career_suggestions: (parsed.career_suggestions || []).slice(0, 3).map(c => ({
          name: c.name || 'Unknown Career',
          match_score: typeof c.match_score === 'number' ? c.match_score : 70,
          reason: c.reason || '',
          roadmap: Array.isArray(c.roadmap) ? c.roadmap : [],
          first_step: c.first_step || '',
          salary_range: c.salary_range || 'N/A',
          demand: c.demand || 'N/A'
        }))
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      console.error('Raw response:', response?.substring(0, 500));

      // Return a structured fallback
      return {
        personality_analysis: 'I had trouble analyzing your input. Could you tell me more about your interests, skills, and what excites you?',
        clarity_score: 0,
        clarity_explanation: 'Could not parse the response properly.',
        career_suggestions: []
      };
    }
  }

  /**
   * Check RAG system health
   */
  async getHealth() {
    try {
      const response = await axios.get(`${this.ragBaseUrl}/rag/health`, {
        timeout: 5000
      });
      return {
        rag_service: response.data,
        groq_configured: groqService.apiKeys?.length > 0 || !!process.env.GROQ_API_KEY,
        status: 'healthy'
      };
    } catch (error) {
      return {
        rag_service: { status: 'unhealthy', error: error.message },
        groq_configured: groqService.apiKeys?.length > 0 || !!process.env.GROQ_API_KEY,
        status: 'degraded'
      };
    }
  }
}

module.exports = new RAGMentorService();
