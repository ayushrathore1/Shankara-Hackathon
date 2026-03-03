const axios = require('axios');
const FormData = require('form-data');

/**
 * VoiceStreamService — Fully streaming voice pipeline per WebSocket connection.
 *
 * Pipeline:   Audio chunks → Sliding-window STT → Streaming LLM → Incremental TTS → Audio chunks
 * Nothing blocks. Everything streams.
 */

const ML_CLASSIFIER_URL = process.env.ML_CLASSIFIER_URL || 'http://localhost:8100';
const GROQ_API_URL = 'https://api.groq.com/openai/v1';

// Trimmed voice prompt (<300 tokens for speed)
const VOICE_PROMPT = `You are Medha — a wise, emotionally intelligent FRIEND on a voice call. NOT a chatbot. Talk like a real person.

RULES:
- 2-3 sentences max (this is voice)
- Casual Hindi-English if they do: "yaar", "dekho", "suno"
- Match their emotion: excited→be hype, confused→be gentle, anxious→normalize
- Ask ONE question to discover their interests, never lecture
- Use Socratic questioning and motivational interviewing invisibly
- NEVER say "As an AI" or list career options unprompted
- Guide like the best mentor, sound like the best friend
- If they say hi, just be casual back`;

class VoiceStreamSession {
  constructor(ws, apiKeys) {
    this.ws = ws;
    this.apiKeys = apiKeys;
    this.currentKeyIndex = 0;

    // Audio buffer for sliding-window STT
    this.audioChunks = [];
    this.audioSize = 0;
    this.lastChunkTime = 0;
    this.silenceTimer = null;
    this.sttInProgress = false;

    // LLM state
    this.llmAbortController = null;
    this.conversationHistory = [];

    // TTS state
    this.ttsBuffer = '';
    this.ttsTimer = null;
    this.ttsAbortController = null;
    this.isSpeaking = false;

    // Pipeline state
    this.isActive = false;
  }

  get apiKey() {
    return this.apiKeys[this.currentKeyIndex] || this.apiKeys[0];
  }

  switchKey() {
    if (this.currentKeyIndex < this.apiKeys.length - 1) {
      this.currentKeyIndex++;
      return true;
    }
    return false;
  }

  // ─── Send JSON to client ──────────────────────────────────
  send(data) {
    if (this.ws.readyState === 1) { // OPEN
      this.ws.send(JSON.stringify(data));
    }
  }

  sendBinary(buffer) {
    if (this.ws.readyState === 1) {
      this.ws.send(buffer);
    }
  }

  // ─── Start the session ────────────────────────────────────
  start() {
    this.isActive = true;
    this.send({ type: 'status', status: 'listening' });
    this.send({ type: 'ready' });
  }

  // ─── Receive audio chunk from client ──────────────────────
  onAudioChunk(chunk) {
    if (!this.isActive) return;

    this.audioChunks.push(Buffer.from(chunk));
    this.audioSize += chunk.byteLength;
    this.lastChunkTime = Date.now();

    // Clear existing silence timer
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    // Set silence detection — 400ms of no audio = sentence boundary
    this.silenceTimer = setTimeout(() => {
      if (this.audioSize > 2000 && !this.sttInProgress) {
        this.triggerSTT();
      }
    }, 400);

    // Also trigger if buffer exceeds ~2 seconds of audio
    if (this.audioSize > 64000 && !this.sttInProgress) {
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      this.triggerSTT();
    }
  }

  // ─── Interrupt: user spoke while AI was speaking ──────────
  interrupt() {
    // Cancel LLM stream
    if (this.llmAbortController) {
      this.llmAbortController.abort();
      this.llmAbortController = null;
    }

    // Cancel TTS
    if (this.ttsAbortController) {
      this.ttsAbortController.abort();
      this.ttsAbortController = null;
    }
    if (this.ttsTimer) clearTimeout(this.ttsTimer);
    this.ttsBuffer = '';
    this.isSpeaking = false;

    // Notify client to stop audio playback
    this.send({ type: 'interrupt_ack' });
    this.send({ type: 'status', status: 'listening' });

    // Reset audio buffer for fresh input
    this.audioChunks = [];
    this.audioSize = 0;
  }

  // ─── Step 1: Sliding-window STT ───────────────────────────
  async triggerSTT() {
    if (this.sttInProgress || this.audioChunks.length === 0) return;
    this.sttInProgress = true;

    // Grab current audio buffer
    const audioBuffer = Buffer.concat(this.audioChunks);
    this.audioChunks = [];
    this.audioSize = 0;

    this.send({ type: 'status', status: 'processing' });

    try {
      const form = new FormData();
      form.append('file', audioBuffer, {
        filename: 'chunk.webm',
        contentType: 'audio/webm',
      });
      form.append('model', 'whisper-large-v3-turbo');
      form.append('response_format', 'verbose_json');

      const response = await axios.post(
        `${GROQ_API_URL}/audio/transcriptions`,
        form,
        {
          headers: { ...form.getHeaders(), 'Authorization': `Bearer ${this.apiKey}` },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 10000,
        }
      );

      const { text, language } = response.data;

      if (text && text.trim()) {
        this.send({ type: 'transcript', text, language, final: true });
        // Trigger LLM immediately
        this.triggerLLM(text.trim(), language || 'en');
      } else {
        // Empty transcript — go back to listening
        this.sttInProgress = false;
        this.send({ type: 'status', status: 'listening' });
      }
    } catch (err) {
      console.error('[STT] Error:', err.message);
      const status = err.response?.status;
      if ((status === 429 || status === 401) && this.switchKey()) {
        // Retry with switched key
        this.sttInProgress = false;
        this.audioChunks = [audioBuffer]; // Put audio back
        this.audioSize = audioBuffer.length;
        this.triggerSTT();
        return;
      }
      this.send({ type: 'error', message: 'Transcription failed. Keep talking.' });
      this.sttInProgress = false;
      this.send({ type: 'status', status: 'listening' });
    }
  }

  // ─── Step 2: Streaming LLM ────────────────────────────────
  async triggerLLM(transcript, language) {
    this.send({ type: 'status', status: 'speaking' });

    // Get RAG context (non-blocking, quick)
    let ragContext = '';
    try {
      const ragRes = await axios.post(
        `${ML_CLASSIFIER_URL}/rag/retrieve`,
        { query: transcript, n_results: 2 }, // 2 docs for speed
        { timeout: 5000 }
      );
      const careers = ragRes.data?.retrieved_careers || [];
      if (careers.length > 0) {
        ragContext = careers.map(c => c.document || c.title).join('\n').substring(0, 500);
      }
    } catch (err) {
      // Continue without RAG
    }

    // Build messages
    let systemPrompt = VOICE_PROMPT;
    if (ragContext) {
      systemPrompt += `\n\nCareer knowledge:\n${ragContext}`;
    }
    if (language !== 'en') {
      systemPrompt += `\n\nStudent speaks ${language}. Reply in same language. Keep technical terms in English.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.slice(-6), // Last 3 exchanges
      { role: 'user', content: transcript },
    ];

    // Store in history
    this.conversationHistory.push({ role: 'user', content: transcript });

    // Streaming LLM call
    this.llmAbortController = new AbortController();
    let fullResponse = '';

    try {
      const response = await axios.post(
        `${GROQ_API_URL}/chat/completions`,
        {
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.7,
          max_tokens: 200,
          stream: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout: 15000,
          signal: this.llmAbortController.signal,
        }
      );

      // Process SSE stream
      let buffer = '';
      const stream = response.data;

      stream.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullResponse += token;
              this.send({ type: 'llm_token', token });
              this.bufferForTTS(token, language);
            }
          } catch {}
        }
      });

      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      // Flush remaining TTS buffer
      this.flushTTSBuffer(language);

      // Store assistant response
      if (fullResponse) {
        this.conversationHistory.push({ role: 'assistant', content: fullResponse });
        this.send({ type: 'response_complete', text: fullResponse });
      }

    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // Interrupted by user — that's fine
      } else {
        console.error('[LLM] Stream error:', err.message);
        this.send({ type: 'error', message: 'Response failed. Try again.' });
      }
    }

    this.sttInProgress = false;
    this.llmAbortController = null;

    // Back to listening
    setTimeout(() => {
      if (this.isActive) {
        this.send({ type: 'status', status: 'listening' });
      }
    }, 300);
  }

  // ─── Step 3: Incremental TTS buffering ────────────────────
  bufferForTTS(token, language) {
    this.ttsBuffer += token;

    // Clear existing flush timer
    if (this.ttsTimer) clearTimeout(this.ttsTimer);

    // Trigger TTS on sentence boundary or buffer size
    const shouldFlush =
      this.ttsBuffer.length > 40 ||
      /[.?!]\s*$/.test(this.ttsBuffer) ||
      this.ttsBuffer.endsWith('\n');

    if (shouldFlush) {
      this.flushTTSBuffer(language);
    } else {
      // Flush after 400ms of no new tokens
      this.ttsTimer = setTimeout(() => this.flushTTSBuffer(language), 400);
    }
  }

  flushTTSBuffer(language = 'en') {
    if (this.ttsTimer) clearTimeout(this.ttsTimer);
    const text = this.ttsBuffer.trim();
    this.ttsBuffer = '';

    if (!text || text.length < 3) return;

    // Fire-and-forget TTS synthesis
    this.synthesizeAndStream(text, language);
  }

  async synthesizeAndStream(text, language) {
    this.ttsAbortController = new AbortController();

    try {
      this.send({ type: 'tts_start' });

      const response = await axios.post(
        `${ML_CLASSIFIER_URL}/tts/synthesize`,
        { text, language },
        {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' },
          signal: this.ttsAbortController.signal,
        }
      );

      // Send audio as binary frame
      if (response.data && response.data.length > 0) {
        this.sendBinary(Buffer.from(response.data));
      }

      this.send({ type: 'tts_end' });
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('[TTS] Error:', err.message);
      }
    }

    this.ttsAbortController = null;
  }

  // ─── Cleanup ──────────────────────────────────────────────
  destroy() {
    this.isActive = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.ttsTimer) clearTimeout(this.ttsTimer);
    if (this.llmAbortController) this.llmAbortController.abort();
    if (this.ttsAbortController) this.ttsAbortController.abort();
    this.audioChunks = [];
    this.conversationHistory = [];
  }
}

module.exports = VoiceStreamSession;
