import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faSpinner, faComments } from '@fortawesome/free-solid-svg-icons';
import { careerMentorAPI } from '../../services/api';
import { saveMentorChat, loadMentorChat } from '../../services/persistenceService';

const MentorChat = ({ career, userProfile, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inactivityTimer = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initialize on first open
  useEffect(() => {
    if (!isOpen || isInitialized || !career?.slug) return;

    const init = async () => {
      // Try loading from DB first
      try {
        const saved = await loadMentorChat(career.slug);
        if (saved?.messages?.length > 0) {
          setMessages(saved.messages);
          setIsInitialized(true);
          return;
        }
      } catch {}

      // Generate new opening message
      setIsLoading(true);
      try {
        const res = await careerMentorAPI.initialize({ career, userProfile });
        const msg = res.data?.data?.message || res.data?.message;
        if (msg) {
          const newMsg = { role: 'assistant', content: msg, timestamp: new Date().toISOString() };
          setMessages([newMsg]);
          saveMentorChat(career.slug, [newMsg]).catch(() => {});
        }
      } catch (err) {
        const fallback = { role: 'assistant', content: `Hi ${userProfile?.name || 'there'}. I have been working in ${career.title} for over a decade. What is your honest understanding of what this job actually involves day to day?`, timestamp: new Date().toISOString() };
        setMessages([fallback]);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    init();
  }, [isOpen, isInitialized, career?.slug]);

  // Inactivity timer
  const startInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      if (messages.length === 0) return;
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistant) return;
      try {
        const res = await careerMentorAPI.suggest({
          career, userProfile,
          lastExchangeContext: lastAssistant.content,
        });
        const sugg = res.data?.data?.suggestions;
        if (sugg?.length) {
          setSuggestions(sugg);
          setShowSuggestions(true);
        }
      } catch {}
    }, 90000);
  }, [messages, career, userProfile]);

  useEffect(() => {
    if (isOpen && messages.length > 0) startInactivityTimer();
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, [isOpen, messages.length, startInactivityTimer]);

  // Send message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || text.length > 500 || isLoading) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setShowSuggestions(false);
    setIsLoading(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    try {
      const res = await careerMentorAPI.message({
        career, userProfile,
        messageHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        newMessage: text,
      });
      const reply = res.data?.data?.message || 'I lost my train of thought for a moment. Could you repeat what you just said?';
      const assistantMsg = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      saveMentorChat(career.slug, finalMessages).catch(() => {});
    } catch {
      const fallbackMsg = { role: 'assistant', content: 'I lost my train of thought for a moment. Could you repeat what you just said?', timestamp: new Date().toISOString() };
      const finalMessages = [...updatedMessages, fallbackMsg];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
      startInactivityTimer();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full z-50 flex flex-col bg-bg-surface border-l border-border shadow-2xl"
        style={{ width: 'min(380px, 100vw)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated flex-shrink-0">
          <div>
            <h3 className="text-text-main font-bold text-sm">{career?.title} Mentor</h3>
            <p className="text-text-dim text-[10px]">10 years experience · Confidential</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-bg-base border border-border flex items-center justify-center text-text-dim hover:text-text-main hover:border-border transition-colors">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary text-bg-base rounded-br-sm'
                  : 'bg-bg-elevated border border-border text-text-main rounded-bl-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-bg-base/50' : 'text-text-dim'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-bg-elevated border border-border rounded-xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-text-dim"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border">
              <div className="flex gap-2 px-4 py-2 overflow-x-auto">
                {suggestions.map((s, i) => (
                  <button key={i}
                    onClick={() => { setInputText(s); setShowSuggestions(false); textareaRef.current?.focus(); }}
                    className="flex-shrink-0 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors whitespace-nowrap">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="border-t border-border p-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value.slice(0, 500)); setShowSuggestions(false); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this career..."
              rows={1}
              disabled={isLoading}
              className="flex-1 px-3 py-2.5 bg-bg-base border border-border rounded-xl text-text-main text-sm placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none leading-relaxed transition-all disabled:opacity-50"
              style={{ maxHeight: '80px' }}
            />
            <button onClick={handleSend}
              disabled={!inputText.trim() || inputText.length > 500 || isLoading}
              className="w-10 h-10 rounded-xl bg-primary text-bg-base flex items-center justify-center flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors">
              <FontAwesomeIcon icon={isLoading ? faSpinner : faPaperPlane} spin={isLoading} className="text-sm" />
            </button>
          </div>
          {inputText.length > 400 && (
            <p className={`text-[10px] text-right mt-1 ${inputText.length > 500 ? 'text-red-400' : 'text-text-dim'}`}>
              {inputText.length}/500
            </p>
          )}
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40 sm:hidden" />
    </AnimatePresence>
  );
};

// Floating trigger button
export const MentorTrigger = ({ onClick, isOpen, showPulse }) => (
  <motion.button
    onClick={onClick}
    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}
    className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all ${
      isOpen ? 'bg-bg-elevated border border-border text-text-dim' : 'bg-primary text-bg-base hover:bg-primary/90'
    }`}
  >
    <FontAwesomeIcon icon={isOpen ? faTimes : faComments} className="text-lg" />
    {showPulse && !isOpen && (
      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-bg-base">
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
      </span>
    )}
  </motion.button>
);

export default MentorChat;
