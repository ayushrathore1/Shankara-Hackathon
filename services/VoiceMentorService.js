const axios = require('axios');
const FormData = require('form-data');

/**
 * VoiceMentorService — Real-time voice interactions for the RAG mentor.
 * 
 * Pipeline:
 *   1. Audio blob → Groq Whisper (STT) → transcript + language
 *   2. Transcript → RAG Retrieve (Python sidecar) → context
 *   3. Context → Groq LLM (conversational, NO JSON) → spoken advice
 *   4. Text → Edge-TTS (Python sidecar) → MP3 audio
 */

const ML_CLASSIFIER_URL = process.env.ML_CLASSIFIER_URL || 'http://localhost:8100';
const GROQ_API_URL = 'https://api.groq.com/openai/v1';

// Conversational voice prompt — wise friend, psychological insight, emotion-aware
const VOICE_SYSTEM_PROMPT = `You are Medha — a brilliant, warm, emotionally intelligent FRIEND on a voice call with a student. You are NOT a formal mentor, NOT a chatbot. You're that one wise senior everyone wishes they had.

HOW YOU TALK:
- Like a friend over chai — casual, real, relatable
- Short replies, 2-3 sentences max (this is a VOICE call, keep it natural)
- Mix Hindi-English naturally if the student does ("yaar", "dekho", "suno", "bhai")
- Use stories, analogies, humor — never lecture
- Sound like a human, not a robot

PSYCHOLOGICAL TECHNIQUES (INVISIBLE to the student):
- Socratic Questioning: Don't tell them the answer — ask questions that lead them to discover it. "What was the last time you got so into something you forgot to eat?"
- Motivational Interviewing: When they're unsure, reflect their feelings back. "Sounds like you're torn between what excites you and what feels safe?"
- Cognitive Reframing: When they say "I can't" or "I'm not smart enough", gently reframe — "You know what's funny? The fact that you're even thinking about this shows more self-awareness than most people have"
- Values Elicitation: Ask questions that reveal core values — "If money wasn't a thing at all, like zero concern, what would your day look like?"
- Pattern Recognition: Notice patterns in what they say and reflect them — "I notice you keep coming back to building things — that's a strong signal yaar"

EMOTION DETECTION & MIRRORING:
- Excited → Match their energy! Be hype with them
- Confused/lost → Be gentle, patient. Ask ONE grounding question
- Anxious/stressed → Normalize first: "Honestly, almost everyone feels this way at your stage"
- Frustrated → Validate: "That's frustrating, I get it"  
- Bored/short replies → Challenge them: "Okay real talk — what would actually make you jump out of bed in the morning?"
- Following pressure → Separate their voice: "Forget parents, friends, society for a sec — what does YOUR gut say?"

GOLDEN RULES:
- NEVER say "As an AI" or "I'm here to help" — you're their friend, not a service
- NEVER give a list of career options unprompted — have a CONVERSATION first, understand them
- NEVER force career suggestions — guide them to discover insights themselves
- Ask only ONE question at a time — this is a voice call, not a questionnaire
- If they just said "hi" or something casual, be casual back! Don't jump into career advice
- Make them feel heard, validated, and smart — even when redirecting them
- Guide like the world's best mentor, but sound like the world's best friend`;


class VoiceMentorService {
  constructor() {
    this.apiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY2,
    ].filter(Boolean);
    this.currentKeyIndex = 0;
  }

  get apiKey() {
    return this.apiKeys[this.currentKeyIndex];
  }

  switchKey() {
    if (this.currentKeyIndex < this.apiKeys.length - 1) {
      this.currentKeyIndex++;
      return true;
    }
    return false;
  }

  resetKey() {
    this.currentKeyIndex = 0;
  }

  // ─── 1. Speech-to-Text (Groq Whisper) ────────────────────────────

  async transcribe(audioBuffer, filename = 'audio.webm') {
    if (!this.apiKeys.length) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const form = new FormData();
    form.append('file', audioBuffer, {
      filename,
      contentType: this._getMimeType(filename),
    });
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'verbose_json');

    let lastError;
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      try {
        const response = await axios.post(
          `${GROQ_API_URL}/audio/transcriptions`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'Authorization': `Bearer ${this.apiKey}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000,
          }
        );

        const { text, language } = response.data;
        console.log(`[STT] (${language}) "${text?.substring(0, 80)}"`);
        return { text: text || '', language: language || 'en' };
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        if (status === 429 || status === 401) {
          if (!this.switchKey()) break;
        } else {
          break;
        }
      }
    }
    this.resetKey();
    throw new Error(`STT failed: ${lastError?.response?.data?.error?.message || lastError?.message}`);
  }

  // ─── 2. Text-to-Speech (Edge-TTS via Python sidecar) ──────────────

  async synthesize(text, language = 'en') {
    if (!text || !text.trim()) {
      throw new Error('Empty text for synthesis');
    }

    // Keep TTS text short for speed
    const ttsText = text.length > 600 ? text.substring(0, 600) + '...' : text;

    try {
      const response = await axios.post(
        `${ML_CLASSIFIER_URL}/tts/synthesize`,
        { text: ttsText, language },
        {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log(`[TTS] ${response.data.length} bytes (${language})`);
      return Buffer.from(response.data);
    } catch (error) {
      console.error('[TTS] Failed:', error.message);
      throw new Error(`TTS failed: ${error.message}`);
    }
  }

  // ─── 3. Full Voice Chat Pipeline ──────────────────────────────────

  async voiceChat(audioBuffer, filename, conversationHistory = []) {
    // Step 1: Transcribe
    const { text: transcript, language } = await this.transcribe(audioBuffer, filename);

    if (!transcript || !transcript.trim()) {
      return {
        transcript: '',
        response: "I couldn't hear you clearly. Could you try again?",
        language: language || 'en',
        audioBase64: null,
      };
    }

    // Step 2: Get RAG context (but use conversational prompt, NOT JSON)
    let responseText = '';
    let ragContext = '';

    try {
      const ragResponse = await axios.post(
        `${ML_CLASSIFIER_URL}/rag/retrieve`,
        { query: transcript, n_results: 3 },
        { timeout: 10000 }
      );

      // Extract career context as plain text
      const careers = ragResponse.data?.retrieved_careers || [];
      if (careers.length > 0) {
        ragContext = careers.map(c => c.document || c.title).join('\n').substring(0, 800);
      }
    } catch (err) {
      console.warn('[RAG] Retrieval failed, continuing without context:', err.message);
    }

    // Step 3: LLM — conversational, fast, NO JSON
    try {
      // Build message history for context
      const messages = [
        { role: 'system', content: this._buildVoiceSystemPrompt(language, ragContext) },
      ];

      // Include recent conversation for continuity (keep last 4 exchanges)
      if (conversationHistory?.length > 0) {
        const recent = conversationHistory.slice(-8); // last 4 pairs
        messages.push(...recent);
      }

      messages.push({ role: 'user', content: transcript });

      const llmResponse = await axios.post(
        `${GROQ_API_URL}/chat/completions`,
        {
          model: 'llama-3.1-8b-instant', // 4x faster than 70b
          messages,
          temperature: 0.7,
          max_tokens: 300, // Short for voice
          // NO response_format — plain text, not JSON
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      responseText = llmResponse.data?.choices?.[0]?.message?.content || '';
    } catch (llmErr) {
      console.error('[LLM] Failed:', llmErr.message);

      // Fallback: direct response without RAG
      try {
        const fallbackResponse = await axios.post(
          `${GROQ_API_URL}/chat/completions`,
          {
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: VOICE_SYSTEM_PROMPT },
              { role: 'user', content: transcript },
            ],
            temperature: 0.7,
            max_tokens: 200,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        responseText = fallbackResponse.data?.choices?.[0]?.message?.content || "I'm having trouble right now. Please try again.";
      } catch {
        responseText = "I'm having trouble connecting. Let's try again in a moment.";
      }
    }

    // Step 4: TTS
    let audioBase64 = null;
    try {
      const audioBuffer = await this.synthesize(responseText, language);
      audioBase64 = audioBuffer.toString('base64');
    } catch (ttsErr) {
      console.warn('[TTS] Failed, text-only:', ttsErr.message);
    }

    return {
      transcript,
      response: responseText,
      language,
      audioBase64,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  _buildVoiceSystemPrompt(language, ragContext) {
    let prompt = VOICE_SYSTEM_PROMPT;

    if (ragContext) {
      prompt += `\n\nYou have access to this career knowledge base. Use it to give specific, grounded advice:\n---\n${ragContext}\n---`;
    }

    if (language && language !== 'en') {
      prompt += `\n\nThe student is speaking in ${language}. Respond in the SAME language. Keep technical terms (like "software engineer", "data science") in English.`;
    }

    return prompt;
  }

  _getMimeType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeMap = {
      webm: 'audio/webm',
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      m4a: 'audio/m4a',
      flac: 'audio/flac',
    };
    return mimeMap[ext] || 'audio/webm';
  }

  async health() {
    const result = { whisper: false, tts: false, rag: false };
    try { await axios.get(`${ML_CLASSIFIER_URL}/tts/health`, { timeout: 3000 }); result.tts = true; } catch {}
    try { await axios.get(`${ML_CLASSIFIER_URL}/rag/health`, { timeout: 3000 }); result.rag = true; } catch {}
    result.whisper = this.apiKeys.length > 0;
    return result;
  }
}

module.exports = new VoiceMentorService();
