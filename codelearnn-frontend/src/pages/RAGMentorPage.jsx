import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane, faSpinner, faBrain, faRocket, faChartLine, faRoad,
  faStar, faArrowRight, faLightbulb, faUserGraduate, faChevronDown,
  faChevronUp, faFire, faBolt, faBriefcase, faGraduationCap,
  faMicrophone, faPhoneSlash, faPhone,
  faGlobe, faComments, faWaveSquare,
} from '@fortawesome/free-solid-svg-icons';
import { ragMentorAPI } from '../services/api';

// ═══════════════════════════════════════════════════════════
// Text Chat Sub-Components (compact)
// ═══════════════════════════════════════════════════════════

const ClarityGauge = ({ score, explanation }) => {
  const pct = (score / 10) * 100;
  const c = 2 * Math.PI * 45;
  const off = c - (pct / 100) * c;
  const col = score <= 3 ? { s: '#ff4444', g: 'rgba(255,68,68,0.3)', l: 'Exploring', b: 'from-red-500/10 to-red-600/5' } :
    score <= 6 ? { s: '#ffd600', g: 'rgba(255,214,0,0.3)', l: 'Emerging', b: 'from-yellow-500/10 to-yellow-600/5' } :
    score <= 8 ? { s: '#00f0ff', g: 'rgba(0,240,255,0.3)', l: 'Focused', b: 'from-cyan-500/10 to-cyan-600/5' } :
    { s: '#39ff14', g: 'rgba(57,255,20,0.3)', l: 'Crystal Clear', b: 'from-green-500/10 to-green-600/5' };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
      className={`bg-gradient-to-br ${col.b} border border-border rounded-2xl p-6 text-center`}>
      <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Career Clarity</h3>
      <div className="relative w-28 h-28 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="6" />
          <motion.circle cx="50" cy="50" r="45" fill="none" stroke={col.s} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }} style={{ filter: `drop-shadow(0 0 8px ${col.g})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-text-main">{score}</span>
          <span className="text-[10px] text-text-dim">/10</span>
        </div>
      </div>
      <p className="text-sm font-semibold" style={{ color: col.s }}>{col.l}</p>
      {explanation && <p className="text-xs text-text-dim mt-2 leading-relaxed">{explanation}</p>}
    </motion.div>
  );
};

const PersonalityCard = ({ analysis }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
    className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-border rounded-2xl p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center"><FontAwesomeIcon icon={faBrain} className="text-secondary text-sm" /></div>
      <div><h3 className="text-sm font-bold text-text-main">Personality Analysis</h3></div>
    </div>
    <p className="text-sm text-text-muted leading-relaxed">{analysis}</p>
  </motion.div>
);

const CareerCard = ({ career, index, isExpanded, onToggle }) => {
  const mc = career.match_score >= 80 ? 'text-green-400' : career.match_score >= 60 ? 'text-cyan-400' : 'text-yellow-400';
  const mb = career.match_score >= 80 ? 'from-green-500/10 to-green-600/5' : career.match_score >= 60 ? 'from-cyan-500/10 to-cyan-600/5' : 'from-yellow-500/10 to-yellow-600/5';
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.15 }}>
      <div className={`bg-gradient-to-br ${mb} border border-border rounded-2xl overflow-hidden transition-all hover:border-border-hover`}>
        <div className="p-5 cursor-pointer" onClick={onToggle}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-bg-base/50 border border-border flex items-center justify-center text-lg">{['🥇','🥈','🥉'][index]}</div>
              <div>
                <h3 className="text-base font-bold text-text-main">{career.name}</h3>
                <span className={`text-xs font-bold ${mc}`}><FontAwesomeIcon icon={faStar} className="mr-1" />{career.match_score}% match</span>
              </div>
            </div>
            <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-text-dim mt-1" />
          </div>
          <p className="text-sm text-text-muted mt-3 leading-relaxed">{career.reason}</p>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
                {career.first_step && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2"><FontAwesomeIcon icon={faBolt} className="text-primary text-xs" /><span className="text-xs font-bold text-primary">Start This Week</span></div>
                    <p className="text-sm text-text-muted">{career.first_step}</p>
                  </div>
                )}
                {career.roadmap?.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-text-main mb-2 block">Roadmap</span>
                    {career.roadmap.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-bg-base border border-border flex items-center justify-center text-[10px] font-bold text-text-dim flex-shrink-0 mt-0.5">{i+1}</span>
                        <p className="text-sm text-text-muted">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const suggestedPrompts = [
  { icon: faLightbulb, text: 'I love solving puzzles and writing code, what careers suit me?' },
  { icon: faUserGraduate, text: "I'm a 12th grader confused between engineering and design" },
  { icon: faGraduationCap, text: 'I enjoy working with people and have good communication skills' },
  { icon: faRocket, text: 'I want a high-paying career in tech with work-life balance' },
];


// ═══════════════════════════════════════════════════════════
// STREAMING VOICE CALL MODE — WebSocket, real-time
// ═══════════════════════════════════════════════════════════

const VoiceCallMode = ({ onEndCall }) => {
  const [status, setStatus] = useState('connecting'); // connecting | listening | processing | speaking | idle
  const [error, setError] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [conversationLog, setConversationLog] = useState([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [llmText, setLlmText] = useState(''); // Live-streaming LLM text

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);
  const callTimerRef = useRef(null);
  const logEndRef = useRef(null);

  // Audio playback queue
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef(null);

  // ─── Connect WebSocket ────────────────────────────────────
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:5000/voice-stream`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      ws.send(JSON.stringify({ type: 'start_call' }));
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // TTS audio chunk — queue for playback
        audioQueueRef.current.push(event.data);
        playNextInQueue();
        return;
      }

      try {
        const msg = JSON.parse(event.data);
        handleWSMessage(msg);
      } catch {}
    };

    ws.onclose = () => console.log('[WS] Disconnected');
    ws.onerror = (e) => {
      console.error('[WS] Error:', e);
      setError('Connection failed. Please try again.');
      setStatus('idle');
    };

    // Call timer
    callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);

    return () => {
      ws.close();
      cleanup();
      clearInterval(callTimerRef.current);
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationLog, llmText]);

  // ─── Handle WebSocket messages ────────────────────────────
  const handleWSMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'ready':
        startMic();
        break;

      case 'status':
        setStatus(msg.status);
        if (msg.status === 'listening') {
          setLlmText('');
          startMic();
        }
        break;

      case 'transcript':
        if (msg.final) {
          setConversationLog(prev => [...prev, { role: 'user', text: msg.text, time: new Date() }]);
          setDetectedLang(msg.language || '');
          stopMic(); // Stop mic while AI responds
        }
        break;

      case 'llm_token':
        setLlmText(prev => prev + msg.token);
        break;

      case 'response_complete':
        // Move streaming text to conversation log
        setConversationLog(prev => [...prev, { role: 'assistant', text: msg.text, time: new Date() }]);
        setLlmText('');
        break;

      case 'tts_start':
        setStatus('speaking');
        break;

      case 'tts_end':
        // Wait for audio queue to finish before going back to listening
        break;

      case 'interrupt_ack':
        // Stop all audio playback
        stopAllAudio();
        setLlmText('');
        break;

      case 'error':
        setError(msg.message);
        setTimeout(() => setError(''), 3000);
        break;
    }
  }, []);

  // ─── Mic control ──────────────────────────────────────────
  const startMic = useCallback(async () => {
    if (streamRef.current || mediaRecorderRef.current?.state === 'recording') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;

      // Volume analyser
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      monitorVolume(analyser);

      // MediaRecorder — send chunks every 250ms
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === 1) {
          e.data.arrayBuffer().then(buf => {
            wsRef.current.send(buf);
          });
        }
      };

      recorder.start(250); // Send every 250ms
    } catch (err) {
      setError('Microphone access denied.');
    }
  }, []);

  const stopMic = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current?.state !== 'closed') {
      try { audioContextRef.current?.close(); } catch {}
    }
    setVolumeLevel(0);
  }, []);

  const monitorVolume = useCallback((analyser) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setVolumeLevel(Math.min(100, (data.reduce((a, b) => a + b, 0) / data.length) * 2));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // ─── Audio playback queue ─────────────────────────────────
  const playNextInQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;

    const audioData = audioQueueRef.current.shift();
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      currentAudioRef.current = null;

      if (audioQueueRef.current.length > 0) {
        playNextInQueue(); // Play next chunk
      } else {
        // All audio played — back to listening
        setStatus('listening');
      }
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      if (audioQueueRef.current.length > 0) playNextInQueue();
    };

    audio.play().catch(() => {
      isPlayingRef.current = false;
      currentAudioRef.current = null;
    });
  }, []);

  const stopAllAudio = useCallback(() => {
    audioQueueRef.current = [];
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // ─── Interrupt (user speaks while AI is talking) ──────────
  const handleInterrupt = useCallback(() => {
    stopAllAudio();
    stopMic();
    setLlmText('');
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
    }
  }, [stopAllAudio, stopMic]);

  // ─── End call ─────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    stopAllAudio();
    stopMic();
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'end_call' }));
    }
    wsRef.current?.close();
    onEndCall();
  }, [stopAllAudio, stopMic, onEndCall]);

  const cleanup = useCallback(() => {
    stopAllAudio();
    stopMic();
  }, [stopAllAudio, stopMic]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const stCfg = {
    connecting: { label: 'Connecting...', color: 'text-zinc-400', icon: faSpinner, spin: true },
    idle: { label: 'Ready', color: 'text-zinc-400', icon: faMicrophone },
    listening: { label: 'Listening...', color: 'text-emerald-400', icon: faWaveSquare },
    processing: { label: 'Thinking...', color: 'text-amber-400', icon: faSpinner, spin: true },
    speaking: { label: 'Speaking...', color: 'text-violet-400', icon: faComments },
  };
  const cfg = stCfg[status] || stCfg.idle;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* Dynamic glow */}
      <div className="absolute inset-0">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full transition-all duration-1000 ${
          status === 'speaking' ? 'bg-violet-500/8 blur-[120px]' :
          status === 'listening' ? 'bg-emerald-500/8 blur-[120px]' :
          status === 'processing' ? 'bg-amber-500/6 blur-[100px]' : 'bg-zinc-800/20 blur-[80px]'
        }`} />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[13px] font-medium text-zinc-300">Medha AI · Live</span>
          </div>
          <span className="text-[12px] text-zinc-600 font-mono">{formatTime(callDuration)}</span>
        </div>
        <div className="flex items-center gap-3">
          {detectedLang && (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
              <FontAwesomeIcon icon={faGlobe} className="text-cyan-400/60" />{detectedLang.toUpperCase()}
            </span>
          )}
          {status === 'speaking' && (
            <button onClick={handleInterrupt}
              className="text-[12px] px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/10 hover:bg-amber-500/20 transition-all">
              Interrupt
            </button>
          )}
          <button onClick={handleEndCall}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/20 transition-all text-[13px] font-medium">
            <FontAwesomeIcon icon={faPhoneSlash} /> End
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-65px)]">

        {/* Left — Avatar */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Avatar */}
          <div className="relative mb-10">
            <motion.div animate={status === 'speaking' ? { scale: [1, 1.04, 1] } : status === 'listening' ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-700 ${
                status === 'speaking' ? 'shadow-[0_0_80px_rgba(139,92,246,0.15)]' :
                status === 'listening' ? 'shadow-[0_0_80px_rgba(16,185,129,0.15)]' : ''
              }`}>
                <div className="w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBrain} className={`text-4xl transition-colors duration-500 ${
                    status === 'speaking' ? 'text-violet-400' : status === 'listening' ? 'text-emerald-400' :
                    status === 'processing' ? 'text-amber-400' : 'text-zinc-500'
                  }`} />
                </div>
              </div>
              {(status === 'speaking' || status === 'listening') && (
                <>
                  <motion.div className={`absolute inset-0 rounded-full border ${status === 'speaking' ? 'border-violet-500/20' : 'border-emerald-500/20'}`}
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                  <motion.div className={`absolute inset-0 rounded-full border ${status === 'speaking' ? 'border-violet-500/10' : 'border-emerald-500/10'}`}
                    animate={{ scale: [1, 2.2], opacity: [0.3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
                </>
              )}
            </motion.div>
          </div>

          {/* Status */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FontAwesomeIcon icon={cfg.icon} className={`text-sm ${cfg.color}`} spin={cfg.spin} />
              <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className="text-[12px] text-zinc-600">
              {status === 'listening' ? "I'll respond when you pause" :
               status === 'processing' ? 'Generating response...' :
               status === 'speaking' ? 'Tap "Interrupt" to cut in' : 'Speak naturally'}
            </p>
          </div>

          {/* Volume / waveform */}
          {status === 'listening' && (
            <div className="flex items-end gap-[3px] h-10 mb-6">
              {[...Array(24)].map((_, i) => (
                <motion.div key={i} className="w-[3px] rounded-full bg-emerald-400/70"
                  animate={{ height: Math.max(3, (volumeLevel / 100) * (20 + Math.sin(i * 0.7 + Date.now() / 200) * 15)) }}
                  transition={{ duration: 0.05 }} />
              ))}
            </div>
          )}
          {status === 'processing' && (
            <div className="flex gap-1.5 mb-6">
              {[0,1,2].map(d => <motion.div key={d} className="w-2 h-2 rounded-full bg-amber-400/50"
                animate={{ y: [0,-8,0], opacity: [0.5,1,0.5] }}
                transition={{ duration: 0.6, delay: d*0.15, repeat: Infinity }} />)}
            </div>
          )}
          {status === 'speaking' && (
            <div className="flex items-center gap-[2px] h-10 mb-6">
              {[...Array(20)].map((_, i) => <motion.div key={i} className="w-[3px] rounded-full bg-violet-400/60"
                animate={{ height: [4, 12 + Math.random()*20, 4] }}
                transition={{ duration: 0.4 + Math.random()*0.3, repeat: Infinity, delay: i*0.03 }} />)}
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/10 rounded-xl px-4 py-2.5 max-w-sm text-center">
              <p className="text-[13px] text-red-400/80">{error}</p>
            </motion.div>}
          </AnimatePresence>
        </div>

        {/* Right — Transcript + Live LLM */}
        <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col bg-white/[0.02]">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <FontAwesomeIcon icon={faComments} className="text-zinc-600 text-xs" />
            <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider">Live Transcript</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <AnimatePresence>
              {conversationLog.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/10 border border-emerald-500/10 rounded-br-sm'
                      : 'bg-white/5 border border-white/5 rounded-bl-sm'
                  }`}>
                    <p className={`text-[13px] leading-relaxed ${msg.role === 'user' ? 'text-emerald-300/90' : 'text-zinc-300'}`}>{msg.text}</p>
                    <p className="text-[10px] text-zinc-700 mt-1">{msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Live streaming LLM text */}
            {llmText && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl bg-violet-500/5 border border-violet-500/10 rounded-bl-sm">
                  <p className="text-[13px] leading-relaxed text-zinc-300">{llmText}<span className="animate-pulse text-violet-400">▊</span></p>
                </div>
              </motion.div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════
// RAG Mentor Page (Main)
// ═══════════════════════════════════════════════════════════

const RAGMentorPage = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [hasQueried, setHasQueried] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const resultRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (!voiceMode) inputRef.current?.focus(); }, [voiceMode]);
  useEffect(() => { if (result?.career_suggestions?.length > 0) setExpandedCards({ 0: true }); }, [result]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setLoading(true); setError(''); setResult(null); setHasQueried(true); setInput('');
    try {
      const res = await ragMentorAPI.chat(msg);
      const data = res.data?.data;
      if (data) { setResult(data); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300); }
      else setError('No response received.');
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  if (voiceMode) return <VoiceCallMode onEndCall={() => setVoiceMode(false)} />;

  return (
    <main className="min-h-screen bg-bg-base bg-tech-career pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-8 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow mx-auto mb-4">
            <FontAwesomeIcon icon={faBrain} className="text-black text-lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-main mb-2">Medha <span className="text-gradient-primary">Career Mentor</span></h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto mb-5">AI-powered career counselor — personality analysis, career matching, and roadmaps.</p>
          <button onClick={() => setVoiceMode(true)}
            className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-violet-500/10 to-cyan-500/10 border border-white/10 text-emerald-400 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] transition-all text-sm font-semibold">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faPhone} className="text-black text-xs" />
            </div>
            Voice Call · Real-time streaming
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="bg-bg-surface border border-border rounded-2xl p-4 sm:p-5">
            <div className="flex items-end gap-3">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Tell me about your interests, skills, and what excites you..."
                rows={2} className="flex-1 px-4 py-3 bg-bg-base border border-border rounded-xl text-text-main placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none text-sm"
                disabled={loading} />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="btn-primary px-5 py-3 rounded-xl disabled:opacity-40 flex items-center gap-2 text-sm font-bold whitespace-nowrap">
                {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Analyzing...</> : <><FontAwesomeIcon icon={faPaperPlane} /> Analyze</>}
              </button>
            </div>
          </div>
        </motion.div>

        {!hasQueried && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
            <p className="text-xs text-text-dim mb-3 text-center">Try one of these:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => { setInput(p.text); sendMessage(p.text); }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-bg-surface border border-border hover:border-primary/30 transition-all text-left group">
                  <FontAwesomeIcon icon={p.icon} className="text-text-dim group-hover:text-primary transition-colors mt-0.5 text-sm" />
                  <span className="text-sm text-text-muted group-hover:text-text-main transition-colors">{p.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faBrain} className="text-primary text-xl" />
              </motion.div>
              <h3 className="text-base font-bold text-text-main mb-1">Analyzing...</h3>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {result && !loading && (
          <div ref={resultRef} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2"><PersonalityCard analysis={result.personality_analysis} /></div>
              <ClarityGauge score={result.clarity_score} explanation={result.clarity_explanation} />
            </div>
            {result.career_suggestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4"><FontAwesomeIcon icon={faChartLine} className="text-primary text-sm" /><h2 className="text-lg font-bold text-text-main">Your Top Career Matches</h2></div>
                <div className="space-y-3">{result.career_suggestions.map((c, i) => <CareerCard key={i} career={c} index={i} isExpanded={!!expandedCards[i]} onToggle={() => setExpandedCards(p => ({...p, [i]: !p[i]}))} />)}</div>
              </div>
            )}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center pt-4">
              <button onClick={() => { setResult(null); setHasQueried(false); inputRef.current?.focus(); }}
                className="text-sm text-text-dim hover:text-primary transition-colors inline-flex items-center gap-2"><FontAwesomeIcon icon={faArrowRight} /> Ask another question</button>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
};

export default RAGMentorPage;
