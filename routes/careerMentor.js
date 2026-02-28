const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroqMentor(messages, { temperature = 0.75, max_tokens = 250 } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
  const response = await axios.post(GROQ_API_URL, {
    model: GROQ_MODEL, messages, temperature, max_tokens,
    response_format: { type: 'json_object' },
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  const raw = response.data.choices[0].message.content;
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

// ─── POST /initialize — Generate opening mentor message ───
router.post('/initialize', protect, async (req, res) => {
  try {
    const { career, userProfile } = req.body;
    if (!career?.title || !userProfile?.name) {
      return res.status(400).json({ success: false, message: 'Missing career or userProfile' });
    }

    const systemPrompt = `You are an experienced career mentor who has worked as a ${career.title} for 10 years. You are having a genuine first conversation with a student who is considering this career path. You know their psychological profile deeply. You speak like a trusted senior colleague — warm, direct, honest, never corporate or generic. You never use phrases like 'Great question' or 'Certainly' or 'As an AI'. You speak in short paragraphs, never bullet points. Maximum 80 words per response. You MUST return valid JSON only.`;

    const userPrompt = `Generate an opening message to start a mentorship conversation with ${userProfile.name} who is considering becoming a ${career.title}.

What you know about them:
- How they think: ${userProfile.cognitive_style || 'analytical'}
- What drives them: ${userProfile.motivation_source || 'growth'}
- Where they thrive: ${userProfile.environment_preference || 'structured'}
- How they handle setbacks: ${userProfile.resilience_pattern || 'persistent'}
- In their own words: '${userProfile.self_description || 'Exploring career options'}'

Your opening message must:
- Address them by name
- Reference one specific thing from their profile that makes you think this career could fit them
- Ask one specific question that will reveal whether they truly understand what this career involves day to day — not a generic question, something that only someone who has actually worked in ${career.title} would think to ask
- Feel like the start of a real conversation not a formal introduction
- Maximum 60 words

Return ONLY valid JSON: { "message": "opening message text" }`;

    const result = await callGroqMentor(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.8, max_tokens: 200 }
    );
    res.json({ success: true, data: { message: result.message } });
  } catch (err) {
    console.error('Mentor init error:', err.message);
    const name = req.body?.userProfile?.name || 'there';
    const title = req.body?.career?.title || 'this field';
    res.json({
      success: true,
      data: {
        message: `Hi ${name}. I have been working in ${title} for over a decade. I have seen people thrive in this field and I have seen people realize too late it was not for them. Based on what I know about you, I have some thoughts. But first — what is your honest understanding of what this job actually involves day to day?`
      }
    });
  }
});

// ─── POST /message — Continue conversation ───
router.post('/message', protect, async (req, res) => {
  try {
    const { career, userProfile, messageHistory, newMessage } = req.body;
    if (!newMessage || !career?.title) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Minimum length check
    if (newMessage.trim().length < 3) {
      return res.json({ success: true, data: { message: 'Could you tell me a bit more? I want to make sure I understand what you are asking.' } });
    }

    // Repetition detection
    const lastUserMsg = [...(messageHistory || [])].reverse().find(m => m.role === 'user');
    if (lastUserMsg && lastUserMsg.content.trim().toLowerCase() === newMessage.trim().toLowerCase()) {
      return res.json({ success: true, data: { message: 'You mentioned that already — is there a specific angle of this you want to dig into further?' } });
    }

    const recentHistory = (messageHistory || []).slice(-10);
    const exchangeCount = recentHistory.filter(m => m.role === 'user').length;

    let conversationLengthNote = '';
    if (exchangeCount >= 20) {
      conversationLengthNote = '\nThis conversation has been going for a while. Begin gently steering toward a conclusion — suggest one concrete action the student can take this week and offer to wrap up.';
    }

    const systemPrompt = `You are an experienced ${career.title} with 10 years in the field mentoring ${userProfile?.name || 'the student'}.

Their psychological profile:
- Cognitive style: ${userProfile?.cognitive_style || 'analytical'}
- Motivated by: ${userProfile?.motivation_source || 'growth'}
- Thrives in: ${userProfile?.environment_preference || 'structured'}
- Handles setbacks: ${userProfile?.resilience_pattern || 'persistent'}
- About themselves: '${userProfile?.self_description || 'Exploring career options'}'

Rules for every response:
1. Maximum 80 words — conversational not essay
2. Never use bullet points — flowing sentences only
3. Never say 'Great question', 'Certainly', 'As an AI', 'I understand' as openers
4. Reference their profile when genuinely relevant — not forced
5. Be honest including about hard truths — do not paint the career as perfect
6. End most responses with either a question that goes deeper OR a specific observation that invites reflection
7. If asked something outside career guidance, redirect warmly
8. If asked about salary, give real India market ranges
9. If the student seems discouraged, acknowledge it directly before responding
10. After 8 exchanges, mention one specific next step they could take this week${conversationLengthNote}

You MUST return valid JSON only.`;

    const historyBlock = recentHistory.map(m =>
      `${m.role === 'assistant' ? 'You' : (userProfile?.name || 'Student')}: ${m.content}`
    ).join('\n\n');

    const userPrompt = `Conversation so far:\n${historyBlock}\n\n${userProfile?.name || 'Student'} just said:\n'${newMessage}'\n\nRespond as the mentor. Stay in character. Keep it under 80 words.\n\nReturn ONLY valid JSON: { "message": "your response" }`;

    const result = await callGroqMentor(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.75, max_tokens: 250 }
    );
    res.json({ success: true, data: { message: result.message } });
  } catch (err) {
    console.error('Mentor message error:', err.message);
    res.json({ success: true, data: { message: 'I lost my train of thought for a moment. Could you repeat what you just said?' } });
  }
});

// ─── POST /suggest — Suggest questions after inactivity ───
router.post('/suggest', protect, async (req, res) => {
  try {
    const { career, userProfile, lastExchangeContext } = req.body;

    const userPrompt = `Based on this mentor message:\n'${lastExchangeContext || 'Tell me about your interest in this career.'}'\n\nAnd this career: ${career?.title || 'this field'}\n\nGenerate 3 short questions ${userProfile?.name || 'the student'} could ask to continue this conversation naturally. Questions should be things a genuinely curious student would wonder about this career. Each question maximum 10 words.\n\nReturn ONLY valid JSON: { "suggestions": ["question one", "question two", "question three"] }`;

    const result = await callGroqMentor(
      [{ role: 'user', content: userPrompt }],
      { temperature: 0.9, max_tokens: 150 }
    );
    res.json({ success: true, data: { suggestions: result.suggestions || [] } });
  } catch (err) {
    console.error('Mentor suggest error:', err.message);
    res.json({
      success: true,
      data: {
        suggestions: [
          `What does a typical day look like?`,
          `What skills matter most early on?`,
          `What would you do differently starting out?`,
        ]
      }
    });
  }
});

module.exports = router;
