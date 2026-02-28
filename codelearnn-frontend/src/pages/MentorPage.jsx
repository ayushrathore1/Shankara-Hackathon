import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faRobot,
  faUser,
  faTrash,
  faSpinner,
  faBolt,
  faMicrophone,
  faMicrophoneSlash,
  faVolumeUp,
  faVolumeMute,
  faStop,
  faPhone,
  faPhoneSlash,
} from '@fortawesome/free-solid-svg-icons';
import { mentorAPI } from '../services/api';

// ─── Voice Helpers ───
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

const getVoice = () => {
  const voices = synth.getVoices();
  // Prefer a natural English voice
  return (
    voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
    voices.find(v => v.lang.startsWith('en') && v.localService === false) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0]
  );
};

// Strip markdown for cleaner speech
const cleanForSpeech = (text) => {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, 'code block omitted')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-•]\s/gm, '')
    .replace(/^###?\s/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .trim();
};

const MentorPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [prompts, setPrompts] = useState([]);
  const messagesEndRef = useRef(null);

  // Voice state
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);

  // Check voice support
  useEffect(() => {
    setVoiceSupported(!!SpeechRecognition && !!synth);
    // Load voices
    if (synth) {
      synth.getVoices();
      synth.onvoiceschanged = () => synth.getVoices();
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadPrompts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  const loadHistory = async () => {
    try {
      const res = await mentorAPI.getHistory();
      setMessages(res.data?.data || []);
    } catch (e) {
      // Fresh start
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPrompts = async () => {
    try {
      const res = await mentorAPI.getPrompts();
      setPrompts(res.data?.data || []);
    } catch (e) {
      setPrompts([
        '🗺️ What should I learn next?',
        '💼 Help me prepare for interviews',
        '🚀 Suggest a project idea for my level',
        '📊 Analyze my skill gaps',
      ]);
    }
  };

  // ─── Speech Synthesis (TTS) ───
  const speak = useCallback((text) => {
    if (!synth || !autoSpeak) return;
    stopSpeaking();

    const clean = cleanForSpeech(text);
    if (!clean) return;

    // Split into chunks for long text (synth has ~300 char limit on some browsers)
    const chunks = [];
    const sentences = clean.split(/(?<=[.!?])\s+/);
    let current = '';
    for (const s of sentences) {
      if ((current + ' ' + s).length > 250) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += (current ? ' ' : '') + s;
      }
    }
    if (current) chunks.push(current.trim());

    setIsSpeaking(true);
    let i = 0;
    const speakNext = () => {
      if (i >= chunks.length) {
        setIsSpeaking(false);
        // If in voice mode, auto-start listening after speaking
        if (voiceMode) {
          setTimeout(() => startListening(), 400);
        }
        return;
      }
      const utt = new SpeechSynthesisUtterance(chunks[i]);
      utt.voice = getVoice();
      utt.rate = 1.05;
      utt.pitch = 1.0;
      utt.onend = () => { i++; speakNext(); };
      utt.onerror = () => { setIsSpeaking(false); };
      utteranceRef.current = utt;
      synth.speak(utt);
    };
    speakNext();
  }, [autoSpeak, voiceMode]);

  const stopSpeaking = useCallback(() => {
    if (synth) synth.cancel();
    setIsSpeaking(false);
  }, []);

  // ─── Speech Recognition (STT) ───
  const startListening = useCallback(() => {
    if (!SpeechRecognition || isListening) return;
    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(final || interim);
      if (final) {
        setInput(final);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-send if we have a final transcript
      const currentTranscript = recognitionRef.current?._lastTranscript;
      if (currentTranscript) {
        sendMessage(currentTranscript);
        setTranscript('');
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition error:', e.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Save transcript before stopping
      recognitionRef.current._lastTranscript = transcript || input;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [transcript, input]);

  // ─── Send Message ───
  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    setTranscript('');
    setMessages(prev => [...prev, { role: 'user', content: msg, createdAt: new Date() }]);
    setLoading(true);

    try {
      const res = await mentorAPI.chat(msg);
      const data = res.data?.data;
      if (data) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content, createdAt: data.timestamp }]);
        // Auto-speak the response
        if (autoSpeak && voiceMode) {
          speak(data.content);
        }
      }
    } catch (err) {
      const errorMsg = '⚠️ Sorry, I couldn\'t process that. Please try again in a moment.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        createdAt: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Voice Mode Toggle ───
  const toggleVoiceMode = () => {
    if (voiceMode) {
      stopListening();
      stopSpeaking();
      setVoiceMode(false);
    } else {
      setVoiceMode(true);
      setAutoSpeak(true);
      // Start listening immediately
      setTimeout(() => startListening(), 300);
    }
  };

  const clearChat = async () => {
    if (!confirm('Clear all chat history?')) return;
    try {
      await mentorAPI.clearHistory();
      setMessages([]);
      stopSpeaking();
    } catch (e) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown rendering
  const renderContent = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      line = line.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-bg-elevated text-primary text-sm font-mono">$1</code>');
      if (line.match(/^[-•]\s/)) {
        return <div key={i} className="flex gap-2 ml-2"><span className="text-primary">•</span><span dangerouslySetInnerHTML={{ __html: line.replace(/^[-•]\s/, '') }} /></div>;
      }
      if (line.match(/^###?\s/)) {
        return <div key={i} className="font-bold text-text-main mt-2" dangerouslySetInnerHTML={{ __html: line.replace(/^###?\s/, '') }} />;
      }
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <div key={i} dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  if (historyLoading) {
    return (
      <div className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
      </div>
    );
  }

  // ======================== VOICE CALL MODE ========================
  if (voiceMode) {
    return (
      <main className="min-h-screen bg-bg-base pt-20 pb-0 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-bg-surface/50 backdrop-blur-sm px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center relative">
                <FontAwesomeIcon icon={faRobot} className="text-black text-sm" />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-bg-surface animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-text-main">Voice Call Active</h1>
                <p className="text-[11px] text-green-400">
                  {isSpeaking ? '🔊 Speaking...' : isListening ? '🎙️ Listening...' : loading ? '🤔 Thinking...' : '⏸ Ready'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleVoiceMode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm"
            >
              <FontAwesomeIcon icon={faPhoneSlash} /> End Call
            </button>
          </div>
        </div>

        {/* Voice Visualization Center */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Avatar */}
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.08, 1] } : isListening ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative mb-8"
          >
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden ${
              isSpeaking ? 'shadow-[0_0_60px_rgba(57,255,20,0.2)]' :
              isListening ? 'shadow-[0_0_60px_rgba(0,212,255,0.2)]' :
              'border-2 border-border'
            }`}>
              <img src="/mentor-avatar.png" alt="Medha AI Mentor" className="w-full h-full object-cover" />
            </div>

            {/* Pulse rings when active */}
            {(isSpeaking || isListening) && (
              <>
                <motion.div
                  className={`absolute inset-0 rounded-full border-2 ${isSpeaking ? 'border-primary/30' : 'border-blue-400/30'}`}
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className={`absolute inset-0 rounded-full border-2 ${isSpeaking ? 'border-primary/20' : 'border-blue-400/20'}`}
                  animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}
          </motion.div>

          {/* Status Text */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-text-main mb-2">
              {isSpeaking ? 'Medha is speaking...' : isListening ? 'Listening to you...' : loading ? 'Thinking...' : 'Ready to chat'}
            </h2>
            {transcript && isListening && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-text-muted text-sm italic max-w-md"
              >
                "{transcript}"
              </motion.p>
            )}
            {!isListening && !isSpeaking && !loading && (
              <p className="text-text-dim text-sm">Tap the microphone to speak</p>
            )}
          </div>

          {/* Audio Waveform Bars */}
          {(isListening || isSpeaking) && (
            <div className="flex items-center gap-1 mb-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 rounded-full ${isSpeaking ? 'bg-primary' : 'bg-blue-400'}`}
                  animate={{ height: [8, 16 + Math.random() * 24, 8] }}
                  transition={{
                    duration: 0.4 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
          )}

          {/* Mic Button */}
          <div className="flex items-center gap-4">
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
              >
                <FontAwesomeIcon icon={faStop} className="text-xl" />
              </button>
            ) : (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={loading}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] animate-pulse'
                    : loading
                      ? 'bg-bg-surface border border-border text-text-dim'
                      : 'bg-primary text-black hover:shadow-[0_0_30px_rgba(57,255,20,0.3)]'
                }`}
              >
                <FontAwesomeIcon
                  icon={loading ? faSpinner : isListening ? faMicrophoneSlash : faMicrophone}
                  spin={loading}
                  className="text-xl"
                />
              </button>
            )}

            {/* Mute TTS toggle */}
            <button
              onClick={() => { setAutoSpeak(!autoSpeak); if (autoSpeak) stopSpeaking(); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                autoSpeak ? 'bg-bg-surface border border-border text-text-muted' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
              title={autoSpeak ? 'Mute voice' : 'Unmute voice'}
            >
              <FontAwesomeIcon icon={autoSpeak ? faVolumeUp : faVolumeMute} className="text-sm" />
            </button>
          </div>

          {/* Last AI message (mini) */}
          {messages.length > 0 && (
            <div className="mt-8 max-w-md w-full">
              <div className="bg-bg-surface border border-border rounded-xl p-4 text-sm text-text-muted max-h-32 overflow-y-auto">
                {messages[messages.length - 1]?.role === 'assistant'
                  ? renderContent(messages[messages.length - 1].content)
                  : <span className="text-text-dim italic">You: {messages[messages.length - 1]?.content}</span>
                }
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts in voice mode */}
        {messages.length === 0 && !loading && (
          <div className="px-4 pb-6">
            <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
              {prompts.slice(0, 4).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-3 py-2 rounded-lg bg-bg-surface border border-border text-xs text-text-muted hover:border-primary/30 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  }

  // ======================== TEXT CHAT MODE ========================
  return (
    <main className="min-h-screen bg-bg-base pt-20 pb-0 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-bg-surface/50 backdrop-blur-sm px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-black text-sm" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-main">Medha AI Mentor</h1>
              <p className="text-[11px] text-text-dim">Career guidance powered by AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Voice Call Button */}
            {voiceSupported && (
              <button
                onClick={toggleVoiceMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-xs font-medium"
                title="Start voice call"
              >
                <FontAwesomeIcon icon={faPhone} /> Voice Call
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-text-dim hover:text-danger transition-colors flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faTrash} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faRobot} className="text-primary text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-text-main mb-2">Hey! I'm your AI Mentor 👋</h2>
              <p className="text-text-muted text-sm mb-3 max-w-md mx-auto">
                Ask me about career paths, skill growth, interview prep, project ideas, or anything related to your journey.
              </p>
              {voiceSupported && (
                <button
                  onClick={toggleVoiceMode}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-medium mb-6"
                >
                  <FontAwesomeIcon icon={faPhone} /> Try Voice Call — talk like a real call
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-4 py-3 rounded-xl bg-bg-surface border border-border hover:border-primary/30 hover:bg-bg-elevated transition-all text-sm text-text-muted"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-1">
                    <FontAwesomeIcon icon={faRobot} className="text-black text-xs" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-black rounded-br-md'
                      : 'bg-bg-surface border border-border text-text-main rounded-bl-md'
                  }`}
                >
                  {msg.role === 'user' ? msg.content : renderContent(msg.content)}
                  {/* Speak button on AI messages */}
                  {msg.role === 'assistant' && voiceSupported && (
                    <button
                      onClick={() => speak(msg.content)}
                      className="mt-2 text-[10px] text-text-dim hover:text-primary transition-colors flex items-center gap-1"
                      title="Listen to this"
                    >
                      <FontAwesomeIcon icon={faVolumeUp} /> Listen
                    </button>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0 mt-1">
                    <FontAwesomeIcon icon={faUser} className="text-text-dim text-xs" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faRobot} className="text-black text-xs" />
              </div>
              <div className="bg-bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(d => (
                    <motion.div
                      key={d}
                      className="w-2 h-2 rounded-full bg-primary/50"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, delay: d * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-bg-surface/80 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            {/* Mic button */}
            {voiceSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={loading}
                className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-bg-base border border-border text-text-dim hover:text-primary hover:border-primary/30'
                }`}
                title={isListening ? 'Stop listening' : 'Speak'}
              >
                <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} />
              </button>
            )}
            <div className="flex-1 relative">
              <textarea
                value={isListening ? transcript : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🎙️ Listening...' : 'Ask your AI mentor anything...'}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-bg-base border border-border rounded-xl text-text-main placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none text-sm"
                style={{ maxHeight: '120px' }}
                disabled={loading || isListening}
              />
              <div className="absolute right-2 bottom-2 text-[10px] text-text-dim">
                <FontAwesomeIcon icon={faBolt} className="text-primary" /> +5 XP
              </div>
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!(isListening ? transcript : input).trim() || loading}
              className="btn-primary px-4 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faPaperPlane} spin={loading} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MentorPage;
