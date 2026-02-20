import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faArrowUp, faArrowDown, faCheck, faCopy, faExternalLinkAlt,
  faChevronRight, faChevronDown, faLink, faBars, faTimes, faPlay, faPause,
  faForwardStep, faBackwardStep
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

/* ─── Soft glossy palette ─── */
const C = {
  rose: "rgba(244,114,182,0.12)", roseBorder: "rgba(244,114,182,0.25)",
  violet: "rgba(167,139,250,0.12)", violetBorder: "rgba(167,139,250,0.25)",
  sky: "rgba(56,189,248,0.12)", skyBorder: "rgba(56,189,248,0.25)",
  amber: "rgba(251,191,36,0.12)", amberBorder: "rgba(251,191,36,0.25)",
  emerald: "rgba(52,211,153,0.12)", emeraldBorder: "rgba(52,211,153,0.25)",
  slate: "rgba(148,163,184,0.10)", slateBorder: "rgba(148,163,184,0.20)",
};

/* ─── Apple-Tier Motion Physics ─── */
const APPLE_SPRING = { type: "spring", mass: 0.5, stiffness: 300, damping: 25 };
const APPLE_EASE = [0.25, 1, 0.5, 1];

/* ─── Knowledge Filters ─── */
const FILTERS = [
  { id: "web-basics", label: "I know web dev basics", icon: "🌐", sections: ["phase-0"] },
  { id: "tools-installed", label: "Dev tools installed", icon: "🔧", sections: ["setup-tools"] },
  { id: "accounts-setup", label: "Accounts set up", icon: "🔑", sections: ["setup-accounts"] },
  { id: "know-antigravity", label: "I know Antigravity", icon: "🚀", sections: ["phase-3"] },
  { id: "know-env", label: "I know env variables", icon: "🔐", sections: ["phase-6"] },
  { id: "know-git", label: "I know Git", icon: "📦", sections: ["phase-7"] },
  { id: "deployed-before", label: "Deployed before", icon: "☁️", sections: ["phase-8"] },
];

/* ─── Sidebar nav sections ─── */
const SECTIONS = [
  { id: "intro", label: "Introduction" },
  { id: "phase-0", label: "Phase 0 — Mental Model" },
  { id: "phase-1", label: "Phase 1 — Think First" },
  { id: "phase-2", label: "Phase 2 — Environment" },
  { id: "phase-3", label: "Phase 3 — Antigravity" },
  { id: "phase-4", label: "Phase 4 — Frontend" },
  { id: "phase-5", label: "Phase 5 — Backend" },
  { id: "phase-6", label: "Phase 6 — Security" },
  { id: "phase-7", label: "Phase 7 — Git" },
  { id: "phase-8", label: "Phase 8 — Deploy" },
  { id: "phase-9", label: "Phase 9 — AI Optimization" },
  { id: "phase-10", label: "Phase 10 — Quality" },
  { id: "phase-11", label: "Phase 11 — Ship & Win" },
  { id: "errors", label: "Common Errors" },
  { id: "learned", label: "What You Learned" },
];

/* ─── AI CTO Masterplan Prompt ─── */
const CTO_PROMPT = `You are a professional CTO who is very friendly and supportive. 
Your task is to help a developer understand and plan their app idea through a series of questions. Follow these instructions:
1. Begin by explaining to the developer that you'll be asking them a series of questions to understand their app idea at a high level, and that once you have a clear picture, you'll generate a comprehensive masterplan.md file as a blueprint for their application.
2. Ask questions one at a time in a conversational manner. Use the developer's previous answers to inform your next questions.
3. Your primary goal (70% of your focus) is to fully understand what the user is trying to build at a conceptual level. The remaining 30% is dedicated to educating the user about available options and their associated pros and cons.
4. When discussing technical aspects (e.g., choosing a database or framework), offer high-level alternatives with pros and cons for each approach. Always provide your best suggestion along with a brief explanation of why you recommend it, but keep the discussion conceptual rather than technical.
5. Be proactive in your questioning. If the user's idea seems to require certain technologies or services (e.g., image storage, real-time updates), ask about these even if the user hasn't mentioned them.
6. Try to understand the 'why' behind what the user is building. This will help you offer better advice and suggestions.
7. Ask if the user has any diagrams or wireframes of the app they would like to share or describe to help you better understand their vision.
8. Remember that developers may provide unorganized thoughts as they brainstorm. Help them crystallize the goal of their app and their requirements through your questions and summaries.
9. Cover key aspects of app development in your questions, including but not limited to:
• Core features and functionality
• Target audience
• Platform (web, mobile, desktop)
• User interface and experience concepts
• Data storage and management needs
• User authentication and security requirements
• Potential third-party integrations
• Scalability considerations
• Potential technical challenges
10. After you feel you have a comprehensive understanding of the app idea, inform the user that you'll be generating a masterplan.md file.
11. Generate the masterplan.md file. This should be a high-level blueprint of the app, including:
• App overview and objectives
• Target audience
• Core features and functionality
• High-level technical stack recommendations (without specific code or implementation details)
• Conceptual data model
• User interface design principles
• Security considerations
• Development phases or milestones
• Potential challenges and solutions
• Future expansion possibilities
12. Present the masterplan.md to the user and ask for their feedback. Be open to making adjustments based on their input.

Important: Do not generate any code during this conversation. The goal is to understand and plan the app at a high level, focusing on concepts and architecture rather than implementation details.

Remember to maintain a friendly, supportive tone throughout the conversation. Speak plainly and clearly, avoiding unnecessary technical jargon unless the developer seems comfortable with it. Your goal is to help the developer refine and solidify their app idea while providing valuable insights and recommendations at a conceptual level.

Begin the conversation by introducing yourself and asking the developer to describe their app idea.`;

/* ─── Helpers ─── */
const Anim = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, amount: 0.01, margin: "100px 0px 0px 0px" }}
      transition={{ ...APPLE_SPRING, delay }} 
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Code = ({ code, lang = "bash" }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  
  /* Basic syntax highlighting */
  const highlightCode = (text) => {
    return text.split('\n').map((line, i) => {
      let highlighted = line;
      // Comments: # or //
      if (/^\s*(#|\/\/)/.test(line)) {
        return <span key={i} style={{ color: '#6b7280' }}>{line}{'\n'}</span>;
      }
      // Numbered list items for prompts
      if (lang === 'prompt' && /^\d+\./.test(line.trim())) {
        const match = line.match(/^(\s*)(\d+\.)(.*)/); 
        if (match) {
          return <span key={i}><span style={{ color: '#a78bfa', fontWeight: 600 }}>{match[1]}{match[2]}</span><span style={{ color: '#e2e8f0' }}>{match[3]}</span>{'\n'}</span>;
        }
      }
      // Bullet points
      if (/^\s*[•\-\*]/.test(line)) {
        return <span key={i} style={{ color: '#94a3b8' }}>{line}{'\n'}</span>;
      }
      // Bracket placeholders [SOMETHING]
      highlighted = [];
      const parts = line.split(/(\[[^\]]+\])/);
      parts.forEach((part, j) => {
        if (/^\[.+\]$/.test(part)) {
          highlighted.push(<span key={j} style={{ color: '#fbbf24', fontStyle: 'italic' }}>{part}</span>);
        } else if (lang === 'bash') {
          // Color bash commands and flags
          const bashParts = part.split(/(--?[a-zA-Z][a-zA-Z0-9-]*|"[^"]*"|'[^']*')/);
          bashParts.forEach((bp, k) => {
            if (/^--?[a-zA-Z]/.test(bp)) {
              highlighted.push(<span key={`${j}-${k}`} style={{ color: '#38bdf8' }}>{bp}</span>);
            } else if (/^["']/.test(bp)) {
              highlighted.push(<span key={`${j}-${k}`} style={{ color: '#34d399' }}>{bp}</span>);
            } else {
              highlighted.push(<span key={`${j}-${k}`} style={{ color: '#e2e8f0' }}>{bp}</span>);
            }
          });
        } else {
          // For prompt lang: highlight keywords
          const kwParts = part.split(/(Important:|Remember|Note:|STRUCTURE:|ENV VARS:|SERVER\.JS:|ROUTES:|SCHEMA:|HERO:|FEATURES:|Check:)/);
          kwParts.forEach((kp, k) => {
            if (/^(Important:|Remember|Note:|STRUCTURE:|ENV VARS:|SERVER\.JS:|ROUTES:|SCHEMA:|HERO:|FEATURES:|Check:)$/.test(kp)) {
              highlighted.push(<span key={`${j}-${k}`} style={{ color: '#f472b6', fontWeight: 600 }}>{kp}</span>);
            } else {
              highlighted.push(<span key={`${j}-${k}`} style={{ color: '#e2e8f0' }}>{kp}</span>);
            }
          });
        }
      });
      return <span key={i}>{highlighted}{'\n'}</span>;
    });
  };

  return (
    <div className="relative my-8 rounded-xl overflow-hidden group shadow-2xl" style={{ isolation: "isolate" }}>
      {/* Subtle animated border glow */}
      <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" 
           style={{ background: "linear-gradient(135deg, #a78bfa, transparent, #38bdf8)", zIndex: -1, padding: "1px", borderRadius: "12px" }}>
        <div className="w-full h-full rounded-[11px]" style={{ background: "#0c0e14" }} />
      </div>

      <div className="relative rounded-xl" style={{ background: "rgba(12, 14, 20, 0.95)", border: "1px solid rgba(148,163,184,0.15)" }}>
        {/* macOS Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(148,163,184,0.1)", background: "rgba(0,0,0,0.2)" }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-500/50" />
            <span className="ml-3 text-[11px] font-medium tracking-wide uppercase" style={{ color: "rgba(148,163,184,0.6)", fontFamily: "'Inter', sans-serif" }}>{lang}</span>
          </div>
          
          <button onClick={copy} className="relative flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-white/10" aria-label="Copy code">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <FontAwesomeIcon icon={faCheck} style={{ color: "#34d399", fontSize: "14px" }} />
                </motion.div>
              ) : (
                <motion.div key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="opacity-60 group-hover:opacity-100 transition-opacity">
                  <FontAwesomeIcon icon={faCopy} style={{ color: "#94a3b8", fontSize: "14px" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
        
        {/* Code Content */}
        <pre className="p-5 overflow-x-auto text-[13px] leading-[1.8] font-mono whitespace-pre custom-scrollbar" style={{ color: "#e2e8f0", tabSize: 2 }}>
          <code>{highlightCode(code)}</code>
        </pre>
      </div>
    </div>
  );
};

/* Collapsible Code - shows first N lines with gradient fade, copy copies ALL */
const CollapsibleCode = ({ code, lang = "prompt", previewLines = 6 }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  
  const lines = code.split('\n');
  const previewText = lines.slice(0, previewLines).join('\n');
  const displayText = expanded ? code : previewText;
  
  /* Basic syntax highlighting (same as Code) */
  const highlightCode = (text) => {
    return text.split('\n').map((line, i) => {
      if (/^\s*(#|\/\/)/.test(line)) return <span key={i} style={{ color: '#6b7280' }}>{line}{'\n'}</span>;
      if (/^\d+\./.test(line.trim())) {
        const match = line.match(/^(\s*)(\d+\.)(.*)/); 
        if (match) return <span key={i}><span style={{ color: '#a78bfa', fontWeight: 600 }}>{match[1]}{match[2]}</span><span style={{ color: '#e2e8f0' }}>{match[3]}</span>{'\n'}</span>;
      }
      if (/^\s*[•\-\*]/.test(line)) return <span key={i} style={{ color: '#94a3b8' }}>{line}{'\n'}</span>;
      const parts = line.split(/(\[[^\]]+\])/);
      const highlighted = [];
      parts.forEach((part, j) => {
        if (/^\[.+\]$/.test(part)) highlighted.push(<span key={j} style={{ color: '#fbbf24', fontStyle: 'italic' }}>{part}</span>);
        else {
          const kwParts = part.split(/(Important:|Remember|Note:)/);
          kwParts.forEach((kp, k) => {
            if (/^(Important:|Remember|Note:)$/.test(kp)) highlighted.push(<span key={`${j}-${k}`} style={{ color: '#f472b6', fontWeight: 600 }}>{kp}</span>);
            else highlighted.push(<span key={`${j}-${k}`} style={{ color: '#e2e8f0' }}>{kp}</span>);
          });
        }
      });
      return <span key={i}>{highlighted}{'\n'}</span>;
    });
  };

  return (
    <div className="relative my-8 rounded-xl overflow-hidden group shadow-2xl" style={{ isolation: "isolate" }}>
      <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" 
           style={{ background: "linear-gradient(135deg, #a78bfa, transparent, #38bdf8)", zIndex: -1, padding: "1px", borderRadius: "12px" }}>
        <div className="w-full h-full rounded-[11px]" style={{ background: "#0c0e14" }} />
      </div>

      <div className="relative rounded-xl" style={{ background: "rgba(12, 14, 20, 0.95)", border: "1px solid rgba(148,163,184,0.15)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(148,163,184,0.1)", background: "rgba(0,0,0,0.2)" }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-500/50" />
            <span className="ml-3 text-[11px] font-medium tracking-wide uppercase" style={{ color: "rgba(148,163,184,0.6)" }}>{lang}</span>
          </div>
          <button onClick={copy} className="relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-all hover:bg-white/10" aria-label="Copy full prompt">
            <span className="text-[11px] font-medium" style={{ color: copied ? '#34d399' : '#94a3b8' }}>{copied ? 'Copied!' : 'Copy Full Prompt'}</span>
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} style={{ color: copied ? "#34d399" : "#94a3b8", fontSize: "12px" }} />
          </button>
        </div>
        
        <div className="relative">
          <pre className="p-5 overflow-x-auto text-[13px] leading-[1.8] font-mono whitespace-pre-wrap custom-scrollbar" style={{ color: "#e2e8f0", tabSize: 2 }}>
            <code>{highlightCode(displayText)}</code>
          </pre>
          {!expanded && lines.length > previewLines && (
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" 
              style={{ background: "linear-gradient(transparent, rgba(12, 14, 20, 0.98))" }} />
          )}
        </div>
        
        {lines.length > previewLines && (
          <div className="px-5 pb-4 flex justify-center">
            <button 
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:bg-white/10"
              style={{ color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}
            >
              {expanded ? '▲ Collapse' : `▼ Show Full Prompt (${lines.length} lines)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto my-8 rounded-xl shadow-lg" style={{ border: "1px solid rgba(148,163,184,0.15)" }}>
    <table className="w-full text-[15px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
      <thead>
        <tr style={{ background: "rgba(148,163,184,0.08)" }}>
          {headers.map((h, i) => <th key={i} className="px-5 py-4 text-left font-semibold tracking-wide" style={{ color: "#f8fafc", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? "rgba(12,14,20,0.4)" : "rgba(148,163,184,0.03)" }} className="transition-colors hover:bg-white/[0.02]">
            {row.map((cell, j) => <td key={j} className="px-5 py-4" style={{ color: "#cbd5e1", borderBottom: "1px solid rgba(148,163,184,0.08)" }}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Callout = ({ children, bg = C.violet, border = C.violetBorder, emoji = "💡" }) => (
  <div className="my-5 p-5 rounded-lg flex gap-3 items-start" style={{ background: bg, border: `1px solid ${border}` }}>
    <span className="text-lg mt-0.5 shrink-0">{emoji}</span>
    <div className="text-[15px] leading-relaxed" style={{ color: "#cbd5e1", fontFamily: "'Inter', sans-serif" }}>{children}</div>
  </div>
);

const SectionTitle = ({ id, phase, title }) => (
  <div id={id} className="scroll-mt-36 mb-10 pt-20 first:pt-0 max-w-[800px]">
    {phase && <p className="text-sm font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "rgba(167,139,250,0.8)", fontFamily: "'Inter', sans-serif" }}>{phase}</p>}
    <h2 className="text-[36px] md:text-[48px] font-bold leading-[1.1]" style={{ color: "#f8fafc", letterSpacing: "-0.03em", fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h2>
  </div>
);

const H3 = ({ children, id }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if(!id) return;
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <h3 id={id} className="text-2xl font-semibold mt-14 mb-4 group relative max-w-[800px] scroll-mt-32 flex items-center" style={{ color: "#f1f5f9", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}>
      {children}
      {id && (
        <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity ml-3 p-1 rounded-md hover:bg-white/5" aria-label="Copy link to heading">
          <FontAwesomeIcon icon={copied ? faCheck : faLink} style={{ color: copied ? "#34d399" : "#64748b", fontSize: "14px" }} />
        </button>
      )}
    </h3>
  );
};
const P = ({ children }) => <p className="text-[18px] md:text-[20px] leading-[1.8] mb-6 max-w-[800px] font-normal" style={{ color: "#94a3b8", fontFamily: "'Inter', sans-serif" }}>{children}</p>;
const ExtLink = ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="relative group inline-block font-medium" style={{ color: "#a78bfa", fontFamily: "'Inter', sans-serif" }}>
  {children}
  <span className="absolute -bottom-0.5 left-0 w-full h-[1px] bg-indigo-400 opacity-30 group-hover:opacity-100 transition-opacity" />
</a>;
const Divider = () => null; // Disabled in favor of Card UI
const IL = ({ children }) => <code style={{ color: "#c4b5fd", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)", padding: "2px 6px", borderRadius: "6px", fontSize: "14px" }}>{children}</code>;

/* ─── Phase Step Card (for structural filtering) ─── */
const CollapsibleSection = ({ id, title, hidden, children }) => {
  const [expanded, setExpanded] = useState(false);
  
  const CardWrapper = ({ children, className = "" }) => (
    <div className={`relative p-8 md:p-12 mb-12 rounded-3xl overflow-hidden group ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.3) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-400 ease-out" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out pointer-events-none" />
      {children}
    </div>
  );

  if (!hidden) return <section id={id} className="scroll-mt-28"><CardWrapper>{children}</CardWrapper></section>;
  
  return (
    <section id={id} className="scroll-mt-28 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 rounded-2xl text-left transition-all hover:scale-[1.005]"
        style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.06), rgba(56,189,248,0.06))", border: "1px solid rgba(52,211,153,0.15)", fontFamily: "'Inter', sans-serif" }}
      >
        <div className="flex items-center gap-4">
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", boxShadow: "0 0 15px rgba(52,211,153,0.2)" }}>
            <FontAwesomeIcon icon={faCheck} />
          </span>
          <span className="text-[15px] font-medium tracking-wide" style={{ color: "#94a3b8" }}>
            {title} <span style={{ color: "#475569", marginLeft: "8px" }}>— Completed</span>
          </span>
        </div>
        <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} style={{ color: "#475569", fontSize: "14px" }} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }} 
            transition={{ duration: 0.4, ease: APPLE_EASE }} 
            className="overflow-hidden"
          >
            <CardWrapper className="mt-6">{children}</CardWrapper>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const MASTERPLAN_URL = "https://github.com/Siddhant-Goswami/100x-LLM/blob/main/prompts/AI_CTO.md";

/* ═══════════════════════════════════════════════ */
/*                 MAIN PAGE                       */
/* ═══════════════════════════════════════════════ */

const VibeCodingGuidePage = () => {
  const progressRef = useRef(null);
  const [showTop, setShowTop] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [activeFilters, setActiveFilters] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vibe-guide-filters") || "[]"); } catch { return []; }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  
  /* Sidebar independent scroll - capture wheel events when cursor is over sidebar */
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const handleWheel = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = sidebar;
      const atTop = scrollTop === 0 && e.deltaY < 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
      // Only prevent default if sidebar can scroll in that direction
      if (!atTop && !atBottom) {
        e.preventDefault();
        e.stopPropagation();
      }
      sidebar.scrollTop += e.deltaY;
    };
    sidebar.addEventListener('wheel', handleWheel, { passive: false });
    return () => sidebar.removeEventListener('wheel', handleWheel);
  }, []);
  
  /* Audio Player State */
  const AUDIO_TRACKS = [
    { label: 'Audio 1', url: 'https://res.cloudinary.com/dhzedzxcx/video/upload/v1771618107/vibeCodingGuide2_onzupu.mp4' },
    { label: 'Audio 2', url: 'https://res.cloudinary.com/dhzedzxcx/video/upload/v1771618096/vibeCodingGuide3_xildnm.mp4' },
  ];
  const audioRef = useRef(null);
  const progressRefBar = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTrack, setActiveTrack] = useState(0);

  const switchTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
    }
    setActiveTrack(prev => (prev === 0 ? 1 : 0));
  };

  // Load new source when activeTrack changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [activeTrack]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    if (progressRefBar.current && audioRef.current) {
      const rect = progressRefBar.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * audioRef.current.duration;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isHidden = useCallback((sectionId) => {
    return FILTERS.some(f => activeFilters.includes(f.id) && f.sections.includes(sectionId));
  }, [activeFilters]);

  const toggleFilter = useCallback((filterId) => {
    setActiveFilters(prev => {
      const next = prev.includes(filterId) ? prev.filter(id => id !== filterId) : [...prev, filterId];
      localStorage.setItem("vibe-guide-filters", JSON.stringify(next));
      return next;
    });
  }, []);

  /* inject Google Fonts */
  useEffect(() => {
    if (!document.getElementById("vibe-guide-fonts")) {
      const link = document.createElement("link");
      link.id = "vibe-guide-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  /* scroll tracking — throttled via rAF, refs to avoid re-renders */
  useEffect(() => {
    let ticking = false;
    let lastShowTop = false;
    let lastSection = SECTIONS[0].id;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        /* progress bar — direct DOM update, no setState */
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = Math.min((window.scrollY / total) * 100, 100);
        if (progressRef.current) progressRef.current.style.width = `${pct}%`;

        /* show/hide scroll-to-top — only setState when value changes */
        const shouldShow = window.scrollY > 500;
        if (shouldShow !== lastShowTop) { setShowTop(shouldShow); lastShowTop = shouldShow; }

        /* active sidebar section — only setState when section changes */
        let current = SECTIONS[0].id;
        for (let i = SECTIONS.length - 1; i >= 0; i--) {
          const el = document.getElementById(SECTIONS[i].id);
          if (el && el.getBoundingClientRect().top <= 140) { current = SECTIONS[i].id; break; }
        }
        if (current !== lastSection) { setActiveSection(current); lastSection = current; }

        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "#08090d", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Progress bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: "rgba(148,163,184,0.08)" }}>
        <div ref={progressRef} className="h-full" style={{ width: "0%", background: "linear-gradient(90deg, #a78bfa, #f472b6)", transition: "none" }} />
      </div>

      {/* ── Scroll to top ── */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: showTop ? 1 : 0 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{ background: "linear-gradient(135deg, #a78bfa, #f472b6)", color: "#0f0f14", boxShadow: "0 4px 24px rgba(167,139,250,0.3)" }}>
        <FontAwesomeIcon icon={faArrowUp} />
      </motion.button>

      {/* ── Cinematic Hero ── */}
      <header className="relative pt-32 pb-24 min-h-[85vh] flex flex-col justify-center">
        
        {/* Breathing Aurora Background (Moved to global scope conceptually, contained here for layout) */}
        <div className="absolute inset-x-0 top-0 h-[150vh] z-0 overflow-hidden pointer-events-none">
          {/* Base ambient glow */}
          <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)" }} />
          
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-30%] left-[-20%] w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw] lg:w-[80vw] lg:h-[80vw] rounded-full mix-blend-screen"
            style={{ 
              background: "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 60%)",
              filter: "blur(120px)"
            }}
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[10%] right-[-20%] w-[140vw] h-[180vw] md:w-[90vw] md:h-[120vw] lg:w-[70vw] lg:h-[90vw] rounded-full mix-blend-screen"
            style={{ 
              background: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 60%)",
              filter: "blur(140px)"
            }}
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-[0%] left-[10%] w-[160vw] h-[140vw] md:w-[110vw] md:h-[90vw] lg:w-[90vw] lg:h-[70vw] rounded-full mix-blend-screen"
            style={{ 
              background: "radial-gradient(circle, rgba(244,114,182,0.25) 0%, transparent 60%)",
              filter: "blur(100px)"
            }}
          />
        </div>

        <div className="px-8 md:px-16 lg:px-24 relative z-10 max-w-5xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <Link to="/blogs" className="inline-flex items-center gap-2 text-sm mb-16 hover:opacity-70 transition-opacity" style={{ color: "#64748b" }}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Articles
            </Link>
          </motion.div>

          <div className="flex items-center gap-3 mb-8 opacity-0 animate-[fadeIn_0.5s_ease-out_0.2s_forwards]">
            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest backdrop-blur-md" 
                  style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(244,114,182,0.1))", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
              Builder's Playbook v3.0
            </span>
            <span className="text-[13px] font-medium" style={{ color: "#64748b" }}>60 min read</span>
          </div>

          <h1 className="text-[48px] md:text-[72px] lg:text-[96px] font-extrabold leading-[1] mb-8 relative" style={{ color: "#f8fafc", fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.04em" }}>
            <motion.span initial={{ opacity: 0, y: 40, rotateX: -20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="block origin-bottom">The Vibe Coding</motion.span>
            <motion.span initial={{ opacity: 0, y: 40, rotateX: -20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }} className="block origin-bottom text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #f8fafc, #a78bfa)" }}>Playbook</motion.span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="text-xl md:text-2xl leading-relaxed max-w-2xl mb-6 font-medium" style={{ color: "#94a3b8" }}>
            Build Anything. Ship Fast. Think Like a Founder.
          </motion.p>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}
            className="text-sm md:text-base border-l-2 pl-4 py-1" style={{ borderColor: "rgba(167,139,250,0.4)", color: "#64748b" }}>
            A senior engineer's field guide for turning any idea — web app, AI tool, SaaS product, startup MVP — into working, deployed software using AI.
          </motion.p>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#475569" }}>Begin</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
            <FontAwesomeIcon icon={faArrowDown} style={{ color: "#64748b", fontSize: "14px" }} />
          </motion.div>
        </motion.div>
      </header>


      {/* ── App Layout: Split Pane ── */}
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 lg:px-12 flex flex-col lg:flex-row gap-8 lg:gap-16 relative">
        
        {/* ── Mobile Sidebar Backdrop ── */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* ── Left Sidebar: Navigation & Progress ── */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 border-r border-white/5 p-8 overflow-y-auto custom-scrollbar transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0 shadow-2xl bg-[#08090d]" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:block lg:bg-transparent lg:shadow-none lg:pr-8 lg:py-8 lg:h-[calc(100vh-100px)] lg:sticky lg:top-24
        `} style={{ overscrollBehavior: 'contain' }} ref={sidebarRef}>
          
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end mb-6">
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          {/* Progress Tracker / Checklist */}
          <div className="mb-10">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: "#475569" }}>My Progress</h4>
            <div className="space-y-2">
              {FILTERS.map(f => {
                const checked = activeFilters.includes(f.id);
                return (
                  <motion.button key={f.id} onClick={() => toggleFilter(f.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={APPLE_SPRING}
                    className="group flex flex-col items-start w-full text-left p-2.5 rounded-lg transition-all duration-200"
                    style={{ 
                      background: checked ? "rgba(255,255,255,0.03)" : "transparent",
                      border: `1px solid ${checked ? "rgba(52,211,153,0.2)" : "transparent"}` 
                    }}>
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                        style={{ 
                          borderColor: checked ? "#34d399" : "rgba(148,163,184,0.3)",
                          background: checked ? "rgba(52,211,153,0.1)" : "transparent"
                        }}>
                        <AnimatePresence mode="wait">
                          {checked && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={APPLE_SPRING}>
                              <FontAwesomeIcon icon={faCheck} className="text-[10px] text-emerald-400" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className="text-[13px] font-medium transition-colors" style={{ color: checked ? "#e2e8f0" : "#94a3b8" }}>
                        {f.icon} {f.label}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Table of Contents */}
          <nav>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: "#475569" }}>Curriculum</h4>
            <ul className="space-y-0.5 relative">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/[0.05] z-0" />
              {SECTIONS.map((s) => (
                <li key={s.id} className="relative z-10">
                  <button
                    onClick={() => { scrollToSection(s.id); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 text-left py-1.5 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-center w-[19px] shrink-0">
                      <motion.div 
                        initial={false}
                        animate={{ 
                          scale: activeSection === s.id ? 1.5 : 1,
                          backgroundColor: activeSection === s.id ? "#a78bfa" : "rgba(148,163,184,0.3)",
                          boxShadow: activeSection === s.id ? "0 0 10px rgba(167,139,250,0.5)" : "none"
                        }}
                        transition={APPLE_SPRING}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                    </div>
                    <span 
                      className="text-[13px] leading-snug group-hover:text-white transition-colors"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        color: activeSection === s.id ? "#f8fafc" : "#64748b",
                        fontWeight: activeSection === s.id ? "600" : "500"
                      }}
                    >
                      {s.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* ── Main Content Area ── */}
        <article className="flex-1 min-w-0 pb-32">

          {/* ═══ INTRO ═══ */}
          <Anim>
            <div id="intro" className="scroll-mt-28 mb-8">
              {/* Audio player moved to floating component */}

              <Callout emoji="🧠" bg="rgba(167,139,250,0.06)" border="rgba(167,139,250,0.12)">
                This is not a web development tutorial. It is a <strong style={{ color: "#e2e8f0" }}>builder's playbook</strong> — for web apps, AI tools, SaaS products, internal tools, startup MVPs, hackathon projects, or anything that lives on a screen. Every section has the <em>why</em> before the <em>what</em>, step-by-step instructions, and exact copy-paste prompts.<br /><br />
                <strong style={{ color: "#e2e8f0" }}>Estimated time:</strong> 10–14 hours for your first project. 3–5 hours after that.
              </Callout>

              <H3>What You'll Learn to Do</H3>
              <ul className="space-y-2 my-4">
                {[
                  "Turn any vague idea into a concrete technical specification",
                  "Use the right AI tools (Claude, Gemini, ChatGPT, Antigravity) for the right tasks",
                  "Build frontend interfaces that look and feel like real products",
                  "Build backends that handle data, logic, and external services",
                  "Protect secrets and credentials like a professional",
                  "Push code to GitHub and deploy to the internet",
                  "Think about quality, security, and user experience from day one"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed" style={{ color: "#94a3b8" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <H3>Before You Begin — The Tools</H3>
              <P>Install and sign up for all of these before starting anything else. Every one is free.</P>
              <div className="overflow-x-auto my-6">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
                      <th className="text-left py-2 pr-4 font-semibold" style={{ color: "#e2e8f0" }}>Tool</th>
                      <th className="text-left py-2 pr-4 font-semibold" style={{ color: "#e2e8f0" }}>What it does</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Antigravity", "AI-powered coding workspace — your primary build environment"],
                      ["VS Code", "Code editor — view, edit, and manage your files"],
                      ["Node.js (LTS)", "Runs JavaScript on your machine — required for most projects"],
                      ["Git", "Version control — tracks every change, lets you undo anything"],
                      ["GitHub", "Hosts your code online — connects to deployment platforms"],
                      ["Claude", "Best AI for logic, planning, backend, debugging"],
                      ["ChatGPT", "Great for brainstorming, writing, research"],
                      ["Groq", "Free, fast AI API — add intelligence to your app"],
                      ["MongoDB Atlas", "Free cloud database — stores your app's data"],
                      ["Vercel", "Deploys your frontend to the internet — free"],
                      ["Render", "Deploys your backend to the internet — free"],
                    ].map(([tool, desc], i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                        <td className="py-2.5 pr-4 font-medium" style={{ color: "#a78bfa" }}>{tool}</td>
                        <td className="py-2.5" style={{ color: "#94a3b8" }}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Anim>

          <Divider />

          {/* ═══ PHASE 0 ═══ */}
          <CollapsibleSection id="phase-0" title="Phase 0 — The Mental Model" hidden={isHidden("phase-0")}>
            <Anim>
              <SectionTitle id="phase-0-title" phase="Phase 0" title="The Mental Model" />

              <H3>0.1 — How Software Actually Works</H3>
              <P>Every piece of software — Instagram, Uber, Figma, a simple notes app — is built on the same three-part foundation:</P>
              <div className="grid md:grid-cols-3 gap-4 my-6">
                <div className="p-5 rounded-lg" style={{ background: C.sky, border: `1px solid ${C.skyBorder}` }}>
                  <p className="font-semibold text-sm mb-2" style={{ color: "#38bdf8" }}>🖥️ Frontend</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>Everything the user sees and touches. Runs in the browser. Layout, visuals, interactions, animations. Built with HTML, CSS, JavaScript — and React.</p>
                </div>
                <div className="p-5 rounded-lg" style={{ background: C.emerald, border: `1px solid ${C.emeraldBorder}` }}>
                  <p className="font-semibold text-sm mb-2" style={{ color: "#34d399" }}>⚙️ Backend</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>The invisible logic engine on a server. Receives requests, processes them, talks to databases and external services. Auth, payments, AI calls — all backend.</p>
                </div>
                <div className="p-5 rounded-lg" style={{ background: C.amber, border: `1px solid ${C.amberBorder}` }}>
                  <p className="font-semibold text-sm mb-2" style={{ color: "#fbbf24" }}>💾 Database</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>Permanent storage. Without it, every time a user closes your app, all data disappears. When your content persists across sessions — that's the database.</p>
                </div>
              </div>
              <div className="my-8 rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ width: 'fit-content' }}>
                <img src="/guide-architecture.png" alt="Frontend → Backend → Database architecture" className="w-full" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }} />
              </div>
              <P>These three communicate over <strong style={{ color: "#e2e8f0" }}>HTTP requests</strong>. The frontend sends a request, the backend receives it, does the work, and sends back a response. This structure is true for virtually every software product in existence.</P>
              <Callout emoji="💡" bg={C.violet} border={C.violetBorder}>
                When something doesn't work, always ask: <strong style={{ color: "#e2e8f0" }}>"Is this a frontend problem, a backend problem, or a database problem?"</strong> That question alone will solve 80% of your bugs.
              </Callout>

              <H3>0.2 — What an API Is, Simply</H3>
              <Callout emoji="🍽️" bg={C.amber} border={C.amberBorder}>
                <strong style={{ color: "#fbbf24" }}>Restaurant analogy:</strong> You (your app) sit at a table. There's a <strong style={{ color: "#e2e8f0" }}>menu</strong> (the API docs) listing what you can order. The <strong style={{ color: "#e2e8f0" }}>waiter</strong> (the HTTP request) carries your order to the kitchen (the backend/service) and brings back the food (the response). Neither side needs to know how the other works internally.
              </Callout>
              <P>There are also <strong style={{ color: "#e2e8f0" }}>third-party APIs</strong> — services built by other companies you plug into your app: weather data, payments (Stripe), maps (Google Maps), AI (Groq, OpenAI), SMS (Twilio), email (SendGrid). These are ready-made capabilities you can drop into any project.</P>
              <div className="my-8 rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ width: 'fit-content' }}>
                <img src="/guide-api-flow.png" alt="API restaurant analogy — Your App orders, HTTP carries, Kitchen serves" className="w-full" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }} />
              </div>

              <H3>0.3 — What Vibe Coding Is</H3>
              <P><strong style={{ color: "#e2e8f0" }}>Vibe coding</strong> is building software by describing what you want in plain language, and letting AI write the code. The term was coined by <strong style={{ color: "#e2e8f0" }}>Andrej Karpathy</strong> — a founding member of OpenAI, former Director of AI at Tesla. You're immersed in the <em>problem and the idea</em> — not tangled in syntax.</P>
              <div className="my-8 rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ width: 'fit-content' }}>
                <img src="/guide-vibe-vs-traditional.png" alt="Traditional coding vs Vibe coding comparison" className="w-full" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }} />
              </div>
              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="p-4 rounded-lg" style={{ background: C.rose, border: `1px solid ${C.roseBorder}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#f472b6" }}>Traditional coding</p>
                  <Code lang="javascript" code={`const form = document.querySelector('#submit-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: form.querySelector('#input').value })
    });
    const result = await res.json();
  } catch (err) { console.error(err); }
  finally { btn.disabled = false; }
});`} />
                </div>
                <div className="p-4 rounded-lg" style={{ background: C.emerald, border: `1px solid ${C.emeraldBorder}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>Vibe coding prompt</p>
                  <p className="text-sm italic leading-relaxed mt-3" style={{ color: "#94a3b8" }}>"When the user submits the form, disable the submit button, change text to 'Processing...'. Send a POST to /api/process with the input value. On success display the result. On error show a red error message below the form. Re-enable and reset the button when done."</p>
                </div>
              </div>
              <P>Your job is not to know the syntax. Your job is to <em>think clearly and describe precisely</em>. That is the real skill, and it is a learnable skill.</P>

              <H3>0.4 — Where This Works</H3>
              <P>Vibe coding applies across all software domains. The same principles map universally:</P>
              <div className="overflow-x-auto my-6">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
                      {["Domain", "Frontend", "Backend", "AI API", "Database"].map(h => (
                        <th key={h} className="text-left py-2 pr-3 font-semibold" style={{ color: "#e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Web App / SaaS", "React UI", "Node + Express", "Groq / OpenAI", "MongoDB"],
                      ["AI Tool", "Chat interface", "API wrapper", "Groq / OpenAI", "History DB"],
                      ["Dashboard", "Charts, tables", "Data processing", "Optional", "SQL / MongoDB"],
                      ["E-commerce", "Product catalog", "Orders, payments", "Recs", "PostgreSQL"],
                      ["Marketplace", "Listings, profiles", "Matching logic", "AI matching", "MongoDB"],
                      ["Education", "Lessons, quizzes", "Progress tracking", "AI tutoring", "Any"],
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                        {row.map((cell, j) => (
                          <td key={j} className="py-2 pr-3" style={{ color: j === 0 ? "#a78bfa" : "#94a3b8", fontWeight: j === 0 ? 500 : 400 }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <H3>0.5 — The Standard Tech Stack</H3>
              <P>You don't need to memorize details — the AI knows them. You just need to know what each piece does to make informed decisions.</P>
              <Table headers={["Technology", "In One Sentence", "When to Use"]} rows={[
                [<strong style={{ color: "#e2e8f0" }}>React.js</strong>, "Component-based UI library", "Any dynamic web interface"],
                [<strong style={{ color: "#e2e8f0" }}>Tailwind CSS</strong>, "Write styles as class names", "Fast, consistent styling"],
                [<strong style={{ color: "#e2e8f0" }}>Framer Motion</strong>, "Animation library for React", "Smooth UI animations"],
                [<strong style={{ color: "#e2e8f0" }}>Node.js + Express</strong>, "JavaScript backend server", "Building your own API"],
                [<strong style={{ color: "#e2e8f0" }}>MongoDB Atlas</strong>, "Flexible JSON document storage", "User content, variable structures"],
                [<strong style={{ color: "#e2e8f0" }}>Groq API</strong>, "Fast free AI inference", "AI features in your app"],
                [<strong style={{ color: "#e2e8f0" }}>Vercel + Render</strong>, "Frontend + backend deployment", "Free, auto-deploy from GitHub"],
              ]} />
            </Anim>
          </CollapsibleSection>

          <Divider />

          {/* ═══ PHASE 1 ═══ */}
          <Anim>
            <SectionTitle id="phase-1" phase="Phase 1" title="Think Before You Build" />
            <Callout emoji="⚠️" bg={C.amber} border={C.amberBorder}>
              <strong style={{ color: "#fbbf24" }}>Never open a code editor or an AI chat without knowing exactly what you're building.</strong> Planning compresses 10 hours of confusion into 1 hour of clarity.
            </Callout>

            <H3>1.1 — The Three Questions</H3>
            <P>Before touching Antigravity, you must be able to answer these from memory:</P>
            <div className="grid md:grid-cols-3 gap-4 my-6">
              {[
                ["1", "What does the user do in this app, step by step?", C.violet, C.violetBorder, "#a78bfa"],
                ["2", "What data gets stored, and in what shape?", C.sky, C.skyBorder, "#38bdf8"],
                ["3", "What does the backend need to do that the frontend can't?", C.emerald, C.emeraldBorder, "#34d399"],
              ].map(([num, q, bg, border, color]) => (
                <div key={num} className="p-4 rounded-lg" style={{ background: bg, border: `1px solid ${border}` }}>
                  <p className="font-bold text-lg mb-2" style={{ color }}>{num}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{q}</p>
                </div>
              ))}
            </div>

            <H3>1.2 — The Idea Pressure Test</H3>
            <P>Complete this in one sentence: <em>"[YOUR APP] helps [SPECIFIC USER] do [SPECIFIC ACTION] so that [SPECIFIC BENEFIT]."</em> If you can't fill it in cleanly, the idea isn't clear enough yet.</P>
            <Callout emoji="🎯" bg={C.violet} border={C.violetBorder}>
              <strong style={{ color: "#a78bfa" }}>Pressure test questions:</strong> Who uses this — name a type of person, not "everyone"? What pain does it solve? How does a user discover value within the first 60 seconds? What's the one feature without which the app is worthless?
            </Callout>

            <H3>1.3 — Build the Masterplan with an AI CTO</H3>
            <P>The <strong style={{ color: "#e2e8f0" }}>Masterplan</strong> is a structured document that captures every important decision before you write a line of code. Instead of a static prompt, use this <strong style={{ color: "#a78bfa" }}>AI CTO prompt</strong> — paste it into <ExtLink href="https://claude.ai">claude.ai</ExtLink> and have a conversation. It will interview you about your idea and generate the masterplan for you:</P>
            <CollapsibleCode code={CTO_PROMPT} lang="prompt" previewLines={6} />
            <P>Save the output as <IL>MASTERPLAN.md</IL>. This becomes your project's source of truth.</P>

            <p className="text-[13px] mb-4" style={{ color: '#64748b' }}>
              Prompt credit: <strong style={{ color: '#94a3b8' }}>100x Engineers</strong>
            </p>

            <a href={MASTERPLAN_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-80 my-4"
              style={{ background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.2)", color: "#e2e8f0" }}>
              <FontAwesomeIcon icon={faGithub} style={{ color: "#94a3b8" }} />
              View AI CTO Masterplan on GitHub
              <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" style={{ color: "#64748b" }} />
            </a>

            <H3>1.4 — Generate Your Technical Spec</H3>
            <P>Use <strong style={{ color: "#e2e8f0" }}>Module 0 (Master Orchestrator)</strong> from the SKILL.md with your project details. This generates architecture, design system, components, and animations. Save as <IL>TECHNICAL-SPEC.md</IL>.</P>
          </Anim>

          <Divider />

          {/* ═══ PHASE 2 — Environment Setup ═══ */}
          <Anim>
            <SectionTitle id="phase-2" phase="Phase 2" title="Set Up Your Environment" />
            <P>Do this once. Every future project inherits the same setup. Total time: 30–45 minutes.</P>
          </Anim>

          {/* 2.1–2.3: Dev tools (filterable) */}
          <CollapsibleSection id="setup-tools" title="Install VS Code, Node.js & Git" hidden={isHidden("setup-tools")}>
            <Anim>
              <H3>2.1 — Install VS Code</H3>
              <P>Download from <ExtLink href="https://code.visualstudio.com">code.visualstudio.com</ExtLink>. Open the terminal: <IL>Ctrl + `</IL>. This is where you run commands.</P>

              <H3>2.2 — Install Node.js</H3>
              <P>Download the <strong style={{ color: "#e2e8f0" }}>LTS version</strong> from <ExtLink href="https://nodejs.org">nodejs.org</ExtLink>. Verify:</P>
              <Code lang="bash" code={`node --version   # should show v20.x.x or similar
npm --version    # should show 10.x.x or similar`} />

              <H3>2.3 — Install Git</H3>
              <P>Download from <ExtLink href="https://git-scm.com">git-scm.com</ExtLink>. Verify and configure:</P>
              <Code lang="bash" code={`git --version
git config --global user.name "Your Full Name"
git config --global user.email "your@email.com"`} />
            </Anim>
          </CollapsibleSection>

          {/* 2.4–2.6: Accounts (filterable) */}
          <CollapsibleSection id="setup-accounts" title="GitHub, Groq API & MongoDB Atlas" hidden={isHidden("setup-accounts")}>
            <Anim>
              <H3>2.4 — Create a GitHub Account</H3>
              <P>Go to <ExtLink href="https://github.com">github.com</ExtLink> → Sign up. Keep your username professional — it'll be in your deployed app URLs.</P>

              <H3>2.5 — Get Your Groq API Key</H3>
              <P><strong style={{ color: "#e2e8f0" }}>Groq</strong> gives free access to LLaMA 3, Mixtral, and more. Fastest free AI API — responses in under a second.</P>
              <ol className="text-sm leading-[2] mb-4 pl-5 list-decimal" style={{ color: "#94a3b8" }}>
                <li>Go to <ExtLink href="https://console.groq.com">console.groq.com</ExtLink> → sign up (no credit card)</li>
                <li>Click <strong style={{ color: "#e2e8f0" }}>"API Keys"</strong> in left sidebar → <strong style={{ color: "#e2e8f0" }}>"Create API Key"</strong></li>
                <li>Name it <IL>my-app-dev</IL>, click Submit</li>
                <li><strong style={{ color: "#fbbf24" }}>Copy it immediately</strong> — starts with <IL>gsk_</IL>, you'll NEVER see it again</li>
              </ol>
              <Table headers={["Model", "Best For", "Speed"]} rows={[
                [<strong style={{ color: "#e2e8f0" }}>llama3-70b-8192</strong>, "Smart responses, complex tasks", "Fast"],
                [<strong style={{ color: "#e2e8f0" }}>llama3-8b-8192</strong>, "Simple tasks, max speed", "Very fast"],
                [<strong style={{ color: "#e2e8f0" }}>mixtral-8x7b-32768</strong>, "Long documents, big context", "Fast"],
              ]} />

              <H3>2.6 — Set Up MongoDB Atlas</H3>
              <P>MongoDB stores data as <strong style={{ color: "#e2e8f0" }}>documents</strong> (JSON objects). Atlas is its free cloud service (512MB free).</P>
              <ol className="text-sm leading-[2] mb-4 pl-5 list-decimal" style={{ color: "#94a3b8" }}>
                <li>Go to <ExtLink href="https://mongodb.com/atlas">mongodb.com/atlas</ExtLink> → "Try Free" → sign up</li>
                <li>Create a project named <IL>my-app</IL></li>
                <li>Deploy a cluster → <strong style={{ color: "#e2e8f0" }}>M0 Free</strong> tier → AWS → closest region</li>
                <li>Create a database user (save the username &amp; password!)</li>
                <li>Network Access → Add <IL>0.0.0.0/0</IL> (allow from anywhere)</li>
                <li>Click "Connect" → "Drivers" → Node.js → copy the connection string</li>
              </ol>
              <Code lang="text" code={`mongodb+srv://your-user:YOURPASSWORD@cluster0.abc123.mongodb.net/myapp?retryWrites=true&w=majority`} />
              <P>Replace <IL>&lt;password&gt;</IL> with your actual password. Add <IL>/myapp</IL> before the <IL>?</IL> for your database name.</P>
            </Anim>
          </CollapsibleSection>

          <Anim>
            <H3>2.7 — Your Secrets File</H3>
            <Callout emoji="🔐" bg={C.rose} border={C.roseBorder}>
              At this point you should have saved: <strong style={{ color: "#e2e8f0" }}>Groq API key</strong> (<IL>gsk_...</IL>), <strong style={{ color: "#e2e8f0" }}>MongoDB URI</strong> (<IL>mongodb+srv://...</IL>), and your MongoDB username/password. Keep this text file safe. Do not share it anywhere.
            </Callout>
          </Anim>

          <Divider />

          {/* ═══ PHASE 3 ═══ */}
          <CollapsibleSection id="phase-3" title="Phase 3 — Master Antigravity" hidden={isHidden("phase-3")}>
            <Anim>
              <SectionTitle id="phase-3-title" phase="Phase 3" title="Master Antigravity" />

              <H3>3.1 — What is Antigravity?</H3>
              <P>An AI-powered coding workspace with a chat interface where you describe what to build, a file editor showing generated code, and a live preview. The core loop: <strong style={{ color: "#e2e8f0" }}>describe → generate → review → refine</strong>.</P>
              <div className="my-8 rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ width: 'fit-content' }}>
                <img src="/guide-vibe-loop.png" alt="Describe → Generate → Review → Refine workflow" className="w-full" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }} />
              </div>
              <P>Go to <ExtLink href="https://antigravity.ai">antigravity.ai</ExtLink> → New Project → Name it your project name.</P>

              <H3>3.2 — Model Selection Strategy</H3>
              <P>Different AI models have different strengths. Knowing when to switch gives you a real edge.</P>
              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="p-5 rounded-lg" style={{ background: C.violet, border: `1px solid ${C.violetBorder}` }}>
                  <p className="font-semibold text-sm mb-3" style={{ color: "#a78bfa" }}>🧠 Claude — Logic + Backend</p>
                  <ul className="text-sm leading-[2] pl-4 list-disc" style={{ color: "#94a3b8" }}>
                    <li>Planning &amp; architecture</li>
                    <li>Backend logic &amp; API routes</li>
                    <li>Debugging &amp; error fixing</li>
                    <li>Data modeling &amp; database queries</li>
                    <li>Security &amp; auth flows</li>
                  </ul>
                </div>
                <div className="p-5 rounded-lg" style={{ background: C.sky, border: `1px solid ${C.skyBorder}` }}>
                  <p className="font-semibold text-sm mb-3" style={{ color: "#38bdf8" }}>✨ Gemini — UI + Frontend</p>
                  <ul className="text-sm leading-[2] pl-4 list-disc" style={{ color: "#94a3b8" }}>
                    <li>Frontend UI generation</li>
                    <li>Animations &amp; transitions</li>
                    <li>Color choices &amp; layouts</li>
                    <li>Responsive design &amp; polish</li>
                    <li>CSS and visual aesthetics</li>
                  </ul>
                </div>
              </div>
              <Callout emoji="💡" bg={C.amber} border={C.amberBorder}>
                <strong style={{ color: "#fbbf24" }}>Rule of thumb:</strong> If the task is about <em>how something works</em>, use Claude. If it's about <em>how something looks</em>, use Gemini. When in doubt, start with Claude.
              </Callout>

              <H3>3.3 — Prompt Architecture</H3>
              <P>A good prompt has 5 parts: <strong style={{ color: "#e2e8f0" }}>ROLE</strong> (who is the AI?), <strong style={{ color: "#e2e8f0" }}>CONTEXT</strong> (what exists?), <strong style={{ color: "#e2e8f0" }}>TASK</strong> (what to do?), <strong style={{ color: "#e2e8f0" }}>RULES</strong> (constraints), <strong style={{ color: "#e2e8f0" }}>OUTPUT</strong> (expected format).</P>
              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="p-4 rounded-lg" style={{ background: C.rose, border: `1px solid ${C.roseBorder}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#f472b6" }}>❌ Vague prompt</p>
                  <p className="text-sm italic" style={{ color: "#94a3b8" }}>"make the dashboard page"</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: C.emerald, border: `1px solid ${C.emeraldBorder}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>✅ Precise prompt</p>
                  <p className="text-sm italic" style={{ color: "#94a3b8" }}>"You are an expert React dev. Build a Dashboard page for my app. Dark mode (#0D0D0D bg, #E8E8E8 text), #6C63FF accent. Include a stat cards row, a table of recent entries, and a line chart of weekly activity. Use Framer Motion fade-ins, responsive grid, and Tailwind."</p>
                </div>
              </div>

              <H3>3.4 — Context Management</H3>
              <P>Antigravity remembers context within a session, but the key to excellent output is feeding it the right information at the right time:</P>
              <ul className="space-y-2 my-4">
                {[
                  "Start each major feature with a fresh context that includes relevant MASTERPLAN sections",
                  "Reference existing file names and component names explicitly",
                  "When fixing bugs, paste the exact error message and the relevant code",
                  "If results degrade, start a new chat thread and re-establish context",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed" style={{ color: "#94a3b8" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Callout emoji="✦" bg={C.violet} border={C.violetBorder}>
                <strong style={{ color: "#e2e8f0" }}>The golden rule:</strong> If you can't describe it clearly in words, you don't know clearly enough what you want. Clarity of description = clarity of thought.
              </Callout>
            </Anim>
          </CollapsibleSection>

          <Divider />

          {/* ═══ PHASE 4 ═══ */}
          <Anim>
            <SectionTitle id="phase-4" phase="Phase 4" title="Build the Frontend" />
            <P>We start with what the user sees. <strong style={{ color: "#e2e8f0" }}>Gemini</strong> is our primary tool for visuals, <strong style={{ color: "#e2e8f0" }}>Claude</strong> for architecture.</P>

            <H3>4.1 — Create the Project Structure</H3>
            <P>Use <strong style={{ color: "#e2e8f0" }}>Claude</strong> for scaffolding (it's architecture). Paste into Antigravity:</P>
            <Code lang="prompt" code={`You are a senior React developer. Create the initial project structure for [YOUR APP NAME].

Set up: Vite + React, react-router-dom, framer-motion, axios, tailwindcss.

File structure:
src/
├── components/    (reusable UI: Navbar, Footer, etc.)
├── pages/         (one per route: Home, Dashboard, etc.)
├── services/api.js (API communication layer)
├── App.jsx        (routing setup)
└── index.css      (Tailwind imports, global styles)

Design tokens:
- Background: #0D0D0D, Text: #E8E8E8
- Primary accent: [YOUR COLOR, e.g. #6C63FF]
- Font: [YOUR FONT, e.g. DM Sans / Inter]

Include all pages from my MASTERPLAN. Show every file's complete content.`} />

            <H3>4.2 — Build the Landing / Home Page</H3>
            <P>Switch to <strong style={{ color: "#e2e8f0" }}>Gemini</strong> for all visual UI work:</P>
            <Code lang="prompt" code={`Build the HomePage for [YOUR APP]. Dark mode, [ACCENT COLOR] primary, Tailwind + Framer Motion.

HERO: Full viewport. Heading "[YOUR HEADLINE]" (serif font).
Subheading "[YOUR VALUE PROPOSITION IN ONE LINE]."
Two CTAs: "[PRIMARY ACTION]" (filled, glow hover) + "[SECONDARY ACTION]" (outline).
Ambient background glow (blurred gradient orb).

FEATURES: 3 glassmorphism cards highlighting core value props.
Hover: lift with shadow. Icons in accent color.

Animations: hero fades in from below (staggered), cards stagger in 0.1s apart.
Responsive: single column mobile, 3 columns desktop.`} />

            <H3>4.3 — Build Core Feature Pages</H3>
            <P>For each core page in your Masterplan, create a focused prompt following the same pattern:</P>
            <Code lang="prompt" code={`Build [PAGE NAME] for [YOUR APP]. Same design system.

[SECTION 1]:
- [Describe layout, components, interactions]
- [Describe data displayed and states]

[SECTION 2]:
- [Describe secondary content area]
- [Loading states, empty states, error states]

Use hardcoded placeholder data for now.
Desktop: [LAYOUT]. Mobile: stacked.`} />

            <H3>4.4 — Review the Frontend</H3>
            <P>Navigate all pages. Check routing, animation smoothness, and responsiveness. Use this refinement template if anything needs fixing:</P>
            <Code lang="prompt" code={`There's an issue with [COMPONENT NAME].
What's happening: [describe what you see]
What should happen: [describe expected behavior]
Please fix this while keeping the existing design system intact.`} />
          </Anim>

          <Divider />

          {/* ═══ PHASE 5 ═══ */}
          <Anim>
            <SectionTitle id="phase-5" phase="Phase 5" title="Build the Backend" />
            <P>Switch to <strong style={{ color: "#e2e8f0" }}>Claude</strong>. We're building logic now, not visuals.</P>

            <H3>5.1 — What the Backend Does</H3>
            <P>Your Node.js + Express server: (1) receives requests from the frontend, (2) calls external APIs (Groq, etc.), (3) reads/writes to MongoDB. The frontend never calls APIs or databases directly — the backend keeps secrets safe and enforces rules.</P>

            <H3>5.2 — Generate the Backend</H3>
            <Code lang="prompt" code={`You are a senior Node.js developer. Build the complete backend for [YOUR APP].

STRUCTURE:
backend/
├── server.js          (entry point)
├── models/            (Mongoose schemas from MASTERPLAN)
├── routes/            (API endpoints from MASTERPLAN)
├── services/          (external API wrappers)
└── package.json

ENV VARS: MONGODB_URI, GROQ_API_KEY, PORT (default 5000), FRONTEND_URL

SERVER.JS: Express + CORS + dotenv + Mongoose connection.

IMPLEMENT ALL ENDPOINTS FROM MY MASTERPLAN.

Include proper try/catch, input validation, and console logging.
Use async/await throughout.`} />

            <H3>5.3 — Test the Backend Locally</H3>
            <P>Create a <IL>.env</IL> file in <IL>backend/</IL>:</P>
            <Code lang="bash" code={`MONGODB_URI=mongodb+srv://your-user:YOURPASSWORD@cluster0.abc123.mongodb.net/myapp
GROQ_API_KEY=gsk_youractualgroqkeyhere
PORT=5000
FRONTEND_URL=http://localhost:3000`} />
            <Code lang="bash" code={`npm install
node server.js
# Should see: Server running on port 5000, MongoDB connected successfully`} />
            <Callout emoji="🧪" bg={C.sky} border={C.skyBorder}>
              Install <strong style={{ color: "#e2e8f0" }}>Thunder Client</strong> in VS Code to test your API. Send requests to your endpoints with sample data. Verify each one returns the expected response shape.
            </Callout>

            <H3>5.4 — Connect Frontend to Backend</H3>
            <Code lang="prompt" code={`Connect my React frontend to my Express backend for [YOUR APP].

Create src/services/api.js with axios instance (baseURL from import.meta.env.VITE_API_URL).
Export functions for each API endpoint from my MASTERPLAN.

Update each page: replace hardcoded data with real API calls.
Add states: isLoading, data, error. Show loading skeletons and error messages.
Handle empty states with helpful messages.`} />

            <H3>5.5 — Full Integration Test</H3>
            <P>With both servers running, test every user flow from your MASTERPLAN end-to-end. If all flows work, your app is fully functional locally.</P>
          </Anim>

          <Divider />

          {/* ═══ PHASE 6 ═══ */}
          <CollapsibleSection id="phase-6" title="Phase 6 — Environment Variables & Security" hidden={isHidden("phase-6")}>
            <Anim>
              <SectionTitle id="phase-6-title" phase="Phase 6" title="Environment Variables & Security" />
              <div className="my-8 rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ width: 'fit-content' }}>
                <img src="/guide-env-security.png" alt="Exposed API key vs protected .env file" className="w-full" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }} />
              </div>

              <H3>6.1 — What Are Environment Variables?</H3>
              <P>Values that exist <em>outside</em> your code, specific to the <em>environment</em> (dev vs production). Your Groq API key shouldn't be in code — it goes in a <IL>.env</IL> file.</P>
              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="p-4 rounded-lg" style={{ background: C.rose, border: `1px solid ${C.roseBorder}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#f472b6" }}>❌ Never do this</p>
                  <Code lang="javascript" code={`const API_KEY = "gsk_abc123realkey";
const DB_URI = "mongodb+srv://user:pass@cluster.net";`} />
                </div>
                <div className="p-4 rounded-lg" style={{ background: C.emerald, border: `1px solid ${C.emeraldBorder}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>✅ Always do this</p>
                  <Code lang="javascript" code={`const API_KEY = process.env.GROQ_API_KEY;
const DB_URI = process.env.MONGODB_URI;`} />
                </div>
              </div>

              <H3>6.2 — Backend .env Setup</H3>
              <P>Create <IL>backend/.env</IL>:</P>
              <Code lang="bash" code={`MONGODB_URI=mongodb+srv://user:pass@cluster0.abc.mongodb.net/myapp
GROQ_API_KEY=gsk_yourkeyhere
PORT=5000
FRONTEND_URL=http://localhost:5173`} />
              <P>Access in code: <IL>process.env.GROQ_API_KEY</IL>. The <IL>dotenv</IL> package loads these on startup.</P>

              <H3>6.3 — Frontend .env Setup</H3>
              <P>Create <IL>frontend/.env</IL>:</P>
              <Code lang="bash" code={`VITE_API_URL=http://localhost:5000`} />
              <P>Access in code: <IL>import.meta.env.VITE_API_URL</IL>. Vite requires the <IL>VITE_</IL> prefix.</P>

              <H3>6.4 — .gitignore</H3>
              <P>This file tells Git to <strong style={{ color: "#e2e8f0" }}>never track</strong> certain files. Both frontend and backend need one:</P>
              <Code lang="bash" code={`.env
node_modules/
dist/
.DS_Store`} />
              <Callout emoji="⚠️" bg={C.amber} border={C.amberBorder}>
                <strong style={{ color: "#fbbf24" }}>Critical:</strong> If you already committed <IL>.env</IL> before adding <IL>.gitignore</IL>, it's still in Git history. Run <IL>git rm --cached .env</IL> then commit again. Once a secret is pushed to GitHub, consider it compromised — rotate the key immediately.
              </Callout>

              <H3>6.5 — Production Environment Variables</H3>
              <P>On Render/Vercel, you set env vars in their dashboard — not in files. The <IL>.env</IL> file is <em>only for local development</em>.</P>
            </Anim>
          </CollapsibleSection>

          <Divider />

          {/* ═══ PHASE 7 ═══ */}
          <CollapsibleSection id="phase-7" title="Phase 7 — Git & GitHub" hidden={isHidden("phase-7")}>
            <Anim>
              <SectionTitle id="phase-7-title" phase="Phase 7" title="Git & GitHub" />

              <H3>7.1 — Why Git?</H3>
              <P>Git saves <strong style={{ color: "#e2e8f0" }}>snapshots</strong> of your code at every point. If you break something, you can go back. It's version control — undo for your entire project.</P>
              <div className="my-8 rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ width: 'fit-content' }}>
                <img src="/guide-git-workflow.png" alt="Git workflow: init → add → commit → push" className="w-full" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }} />
              </div>

              <H3>7.2 — Core Concepts</H3>
              <Table headers={["Concept", "What It Means"]} rows={[
                [<strong style={{ color: "#e2e8f0" }}>Repository (repo)</strong>, "A folder tracked by Git"],
                [<strong style={{ color: "#e2e8f0" }}>Commit</strong>, "A saved snapshot of your code"],
                [<strong style={{ color: "#e2e8f0" }}>Branch</strong>, "A parallel version (default: main)"],
                [<strong style={{ color: "#e2e8f0" }}>Push</strong>, "Upload commits to GitHub"],
                [<strong style={{ color: "#e2e8f0" }}>Pull</strong>, "Download commits from GitHub"],
                [<strong style={{ color: "#e2e8f0" }}>Clone</strong>, "Copy a GitHub repo to your computer"],
              ]} />

              <H3>7.3 — Your First Commit</H3>
              <Code lang="bash" code={`cd my-app
git init                    # Initialize Git in this folder
git add .                   # Stage ALL files for commit
git commit -m "Initial commit: project setup"`} />

              <H3>7.4 — Push to GitHub</H3>
              <ol className="text-sm leading-[2] mb-4 pl-5 list-decimal" style={{ color: "#94a3b8" }}>
                <li>Go to <ExtLink href="https://github.com/new">github.com/new</ExtLink> → name it <IL>my-app</IL> → keep it public → <strong style={{ color: "#e2e8f0" }}>don't</strong> add README</li>
                <li>Copy the commands GitHub shows and run them:</li>
              </ol>
              <Code lang="bash" code={`git remote add origin https://github.com/YOURUSERNAME/my-app.git
git branch -M main
git push -u origin main`} />

              <H3>7.5 — Daily Git Workflow</H3>
              <Code lang="bash" code={`# After making changes:
git add .
git commit -m "Add [feature name]"
git push`} />
              <Callout emoji="📝" bg={C.violet} border={C.violetBorder}>
                <strong style={{ color: "#e2e8f0" }}>Commit messages matter.</strong> Bad: "fix stuff", "update". Good: "Add user authentication", "Fix dashboard loading state". Describe <em>what changed</em> in imperative mood.
              </Callout>
            </Anim>
          </CollapsibleSection>

          <Divider />

          {/* ═══ PHASE 8 ═══ */}
          <CollapsibleSection id="phase-8" title="Phase 8 — Deployment" hidden={isHidden("phase-8")}>
            <Anim>
              <SectionTitle id="phase-8-title" phase="Phase 8" title="Deploy to the Internet" />
              <P>Your app currently only works on <IL>localhost</IL>. Time to put it on the real internet. We use two free platforms:</P>
              <div className="my-8 rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ width: 'fit-content' }}>
                <img src="/guide-deploy-flow.png" alt="Local → GitHub → Vercel + Render deployment flow" className="w-full" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }} />
              </div>
              <Table headers={["Service", "Deploys", "Free Tier"]} rows={[
                [<strong style={{ color: "#e2e8f0" }}>Render</strong>, "Backend (Node.js server)", "750 hrs/mo, sleeps after 15 min idle"],
                [<strong style={{ color: "#e2e8f0" }}>Vercel</strong>, "Frontend (React app)", "Unlimited for personal, instant deploys"],
              ]} />

              <H3>8.1 — Deploy Backend on Render</H3>
              <ol className="text-sm leading-[2] mb-4 pl-5 list-decimal" style={{ color: "#94a3b8" }}>
                <li>Go to <ExtLink href="https://render.com">render.com</ExtLink> → sign up with GitHub</li>
                <li>New → Web Service → Connect your repo</li>
                <li>Root Directory: <IL>backend</IL></li>
                <li>Build Command: <IL>npm install</IL></li>
                <li>Start Command: <IL>node server.js</IL></li>
                <li>Instance Type: <strong style={{ color: "#e2e8f0" }}>Free</strong></li>
                <li>Environment → add all your env vars from <IL>.env</IL></li>
                <li>Deploy — wait for "Your service is live" ✅</li>
              </ol>
              <P>Your backend URL will be something like <IL>https://my-app-api.onrender.com</IL>.</P>

              <H3>8.2 — Deploy Frontend on Vercel</H3>
              <ol className="text-sm leading-[2] mb-4 pl-5 list-decimal" style={{ color: "#94a3b8" }}>
                <li>Go to <ExtLink href="https://vercel.com">vercel.com</ExtLink> → sign up with GitHub</li>
                <li>Import your repo</li>
                <li>Root Directory: <IL>frontend</IL></li>
                <li>Framework Preset: <strong style={{ color: "#e2e8f0" }}>Vite</strong></li>
                <li>Environment Variables → add <IL>VITE_API_URL</IL> = your Render backend URL</li>
                <li>Deploy → you'll get a URL like <IL>my-app.vercel.app</IL></li>
              </ol>

              <H3>8.3 — Update CORS</H3>
              <P>Go back to Render → Environment → update <IL>FRONTEND_URL</IL> to your Vercel URL. Redeploy. Otherwise your frontend can't talk to your backend.</P>

              <H3>8.4 — The Cold Start Problem</H3>
              <Callout emoji="❄️" bg={C.sky} border={C.skyBorder}>
                Render's free tier <strong style={{ color: "#e2e8f0" }}>spins down after 15 minutes of inactivity</strong>. First request after idle takes 30–60 seconds. Solutions: add a loading state that explains "Server waking up...", or use <ExtLink href="https://cron-job.org">cron-job.org</ExtLink> to ping your server every 14 minutes.
              </Callout>

              <H3>8.5 — Custom Domain (Optional)</H3>
              <P>Buy a domain from Namecheap/GoDaddy (~$10/year). In Vercel → Settings → Domains → add it. Point your domain's DNS to Vercel's nameservers. HTTPS is automatic.</P>
            </Anim>
          </CollapsibleSection>

          <Divider />

          {/* ═══ PHASE 9 ═══ */}
          <Anim>
            <SectionTitle id="phase-9" phase="Phase 9" title="AI Tool Optimization" />
            <P>This phase is your <strong style={{ color: "#e2e8f0" }}>cheat sheet</strong>. Come back here whenever you're stuck.</P>

            <H3>9.1 — The RCTRO Framework</H3>
            <P>Every prompt should have these 5 components:</P>
            <Table headers={["Component", "Description", "Example"]} rows={[
              [<strong style={{ color: "#a78bfa" }}>R</strong>, "Role — who is the AI?", "You are a senior full-stack developer"],
              [<strong style={{ color: "#a78bfa" }}>C</strong>, "Context — what exists?", "Building [YOUR APP], dark mode, [COLOR] primary"],
              [<strong style={{ color: "#a78bfa" }}>T</strong>, "Task — what to do?", "Build the [SPECIFIC PAGE/FEATURE]"],
              [<strong style={{ color: "#a78bfa" }}>R</strong>, "Rules — constraints?", "Use Framer Motion, responsive grid, existing design system"],
              [<strong style={{ color: "#a78bfa" }}>O</strong>, "Output — format?", "Complete JSX component with all styles and logic"],
            ]} />

            <H3>9.2 — Common Prompt Templates</H3>
            <p className="text-xs uppercase tracking-wider font-semibold mt-6 mb-3" style={{ color: "#f472b6" }}>Bug Fix Prompt</p>
            <Code lang="prompt" code={`There's a bug in [FILENAME].
What I expect: [describe expected behavior]
What actually happens: [describe actual behavior]
Error message (if any): [paste exact error]
Here's the relevant code: [paste code]
Please fix it and explain what was wrong.`} />

            <p className="text-xs uppercase tracking-wider font-semibold mt-6 mb-3" style={{ color: "#38bdf8" }}>Feature Addition Prompt</p>
            <Code lang="prompt" code={`Add [FEATURE] to [COMPONENT/FILE].
Current behavior: [what it does now]
Desired behavior: [what it should do after]
Constraints: [design system, patterns to follow]
Show the complete updated file.`} />

            <p className="text-xs uppercase tracking-wider font-semibold mt-6 mb-3" style={{ color: "#34d399" }}>Refactoring Prompt</p>
            <Code lang="prompt" code={`Refactor [FILENAME] to improve [readability/performance/structure].
Current issues: [describe problems]
Keep: [things that must not change]
Change: [things that should change]
Show the complete refactored file with comments explaining changes.`} />

            <H3>9.3 — Anti-Patterns to Avoid</H3>
            <Table headers={["❌ Don't", "✅ Instead"]} rows={[
              ["\"make it better\"", "\"increase contrast of text to WCAG AA, add hover states to all buttons\""],
              ["\"fix the errors\"", "\"fix the TypeError on line 42: cannot read property 'map' of undefined\""],
              ["\"add a database\"", "\"add MongoDB with Mongoose. Schema: { title: String, body: String, createdAt: Date }\""],
              ["paste 500 lines of code", "paste only the relevant function + error message"],
              ["ask 5 things in one prompt", "one task per prompt, build incrementally"],
            ]} />
          </Anim>

          <Divider />

          {/* ═══ PHASE 10 ═══ */}
          <Anim>
            <SectionTitle id="phase-10" phase="Phase 10" title="Quality & Polish" />

            <H3>10.1 — The Polish Checklist</H3>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              {[
                { title: "Loading States", items: ["Every API call has loading indicator", "Buttons disable while loading", "Skeleton screens for data fetching"] },
                { title: "Error Handling", items: ["Network errors show user-friendly messages", "Empty states have helpful copy", "Form validation with inline errors"] },
                { title: "Responsiveness", items: ["Works on mobile (375px+)", "Text readable without zooming", "Touch targets min 44×44px"] },
                { title: "UX Details", items: ["Favicon and page titles set", "Proper meta descriptions", "Smooth route transitions"] },
              ].map(cat => (
                <div key={cat.title} className="p-4 rounded-lg" style={{ background: C.slate, border: `1px solid ${C.slateBorder}` }}>
                  <p className="font-semibold text-sm mb-2" style={{ color: "#e2e8f0" }}>{cat.title}</p>
                  <ul className="text-sm leading-[2] pl-4 list-disc" style={{ color: "#94a3b8" }}>
                    {cat.items.map(i => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <H3>10.2 — Polish Prompt</H3>
            <Code lang="prompt" code={`Review the entire [YOUR APP] frontend for polish issues.

Check:
- Missing loading states on any API call
- Missing error handling (network errors, empty states)
- Accessibility (alt text, aria labels, focus rings)
- Mobile responsiveness (test at 375px width)
- Console warnings or errors
- Consistent typography and spacing

Fix all issues. Show me a summary of what you changed.`} />

            <H3>10.3 — Performance Quick Wins</H3>
            <P>Before shipping: lazy-load routes with <IL>React.lazy()</IL>, compress images (use WebP), add <IL>loading="lazy"</IL> to images, minimize bundle with <IL>npm run build -- --analyze</IL>.</P>
          </Anim>

          <Divider />

          {/* ═══ PHASE 11 ═══ */}
          <Anim>
            <SectionTitle id="phase-11" phase="Phase 11" title="Startup & Hackathon Playbook" />
            <div className="my-8 rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ width: 'fit-content' }}>
              <img src="/guide-hackathon.png" alt="Hackathon timeline: Plan → Scaffold → Build → Connect → Polish → Deploy → Demo" className="w-full" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }} />
            </div>

            <H3>11.1 — The Hackathon Timeline</H3>
            <Table headers={["Time", "Phase", "What To Do"]} rows={[
              [<strong style={{ color: "#a78bfa" }}>Hour 0–1</strong>, "Plan", "Masterplan in Claude. Lock scope. Don't debate tech stack."],
              [<strong style={{ color: "#a78bfa" }}>Hour 1–3</strong>, "Scaffold", "Project structure, routes, placeholder pages, database schema"],
              [<strong style={{ color: "#a78bfa" }}>Hour 3–8</strong>, "Core Build", "Build the ONE FEATURE that makes your app unique"],
              [<strong style={{ color: "#a78bfa" }}>Hour 8–10</strong>, "Connect", "Wire frontend to backend, test full flow"],
              [<strong style={{ color: "#a78bfa" }}>Hour 10–12</strong>, "Polish", "Loading states, error handling, animations, responsive"],
              [<strong style={{ color: "#a78bfa" }}>Hour 12–14</strong>, "Deploy", "Render + Vercel. Test production URL. Fix CORS."],
              [<strong style={{ color: "#a78bfa" }}>Hour 14–16</strong>, "Demo Prep", "Record demo video. Write README. Practice pitch."],
            ]} />

            <H3>11.2 — Scope Discipline</H3>
            <Callout emoji="🎯" bg={C.rose} border={C.roseBorder}>
              <strong style={{ color: "#f472b6" }}>The #1 mistake:</strong> building too many features. Ship ONE thing that works flawlessly rather than five things that are buggy. Investors and judges remember <em>impact</em>, not feature count.
            </Callout>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-lg" style={{ background: C.rose, border: `1px solid ${C.roseBorder}` }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#f472b6" }}>❌ Scope creep</p>
                <ul className="text-sm pl-4 list-disc leading-[2]" style={{ color: "#94a3b8" }}>
                  <li>"Let's add social features"</li><li>"We need user profiles"</li><li>"Payment system"</li><li>"Chat"</li><li>"Push notifications"</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg" style={{ background: C.emerald, border: `1px solid ${C.emeraldBorder}` }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>✅ Focused MVP</p>
                <ul className="text-sm pl-4 list-disc leading-[2]" style={{ color: "#94a3b8" }}>
                  <li>Core feature works perfectly</li><li>Beautiful, polished UI</li><li>Smooth micro-animations</li><li>Deployed and live</li><li>Clear demo narrative</li>
                </ul>
              </div>
            </div>

            <H3>11.3 — The Demo Formula</H3>
            <P>Your demo is more important than your code. Judges see your app for 3 minutes. Make those 3 minutes count.</P>
            <ol className="text-sm leading-[2] mb-4 pl-5 list-decimal" style={{ color: "#94a3b8" }}>
              <li><strong style={{ color: "#e2e8f0" }}>Start with the problem</strong> — "Have you ever..." (10 seconds)</li>
              <li><strong style={{ color: "#e2e8f0" }}>Show, don't tell</strong> — live demo &gt; slides (2 minutes)</li>
              <li><strong style={{ color: "#e2e8f0" }}>End with impact</strong> — "This could help [SPECIFIC PEOPLE] do [SPECIFIC THING]" (30 seconds)</li>
            </ol>

            <H3>11.4 — Beyond the Hackathon</H3>
            <P>If your project has real traction — add auth, payments, analytics, and a proper landing page. The stack you learned here scales to production. Every professional startup started exactly where you are now.</P>
          </Anim>

          <Divider />

          {/* ═══ APPENDIX A ═══ */}
          <Anim>
            <SectionTitle id="errors" title="Appendix A — Common Errors" />
            <Table headers={["Error", "Cause", "Fix"]} rows={[
              [<IL>CORS error</IL>, "Backend doesn't allow frontend origin", <span>Add frontend URL to CORS config: <IL>cors({`{ origin: process.env.FRONTEND_URL }`})</IL></span>],
              [<IL>MongoNetworkError</IL>, "Can't connect to MongoDB", "Check MONGODB_URI, ensure IP 0.0.0.0/0 in Network Access"],
              [<IL>Cannot find module</IL>, <span>Missing <IL>npm install</IL></span>, <span>Run <IL>npm install</IL> in the correct directory</span>],
              [<IL>401 Unauthorized</IL>, "Invalid or missing API key", <span>Check <IL>.env</IL> has correct API key values</span>],
              [<IL>Port already in use</IL>, "Another process on same port", <span>Kill process or change PORT in <IL>.env</IL></span>],
              [<IL>Module not found</IL>, "Import path is wrong", "Check relative path — ./components not /components"],
              [<IL>Build fails on Vercel</IL>, "TypeScript or lint errors", <span>Run <IL>npm run build</IL> locally first and fix all warnings</span>],
              [<span>Blank page after deploy</span>, "Wrong build settings or base path", "Check Vercel root directory and framework preset"],
              [<IL>"data" is undefined</IL>, "API response shape mismatch", "Console.log the response object and check structure"],
              [<IL>Hydration mismatch</IL>, "Server/client HTML differs", "Ensure no random values or browser APIs in initial render"],
            ]} />
          </Anim>

          <Divider />

          {/* ═══ APPENDIX B ═══ */}
          <Anim>
            <SectionTitle id="learned" title="Appendix B — What You Can Now Build" />
            <P>If you followed this guide, you can now confidently build and ship:</P>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-6">
              {[
                "Frontend vs Backend", "API Design & Integration", "React Components & Routing", "State Management",
                "Tailwind CSS", "Framer Motion", "Node.js & Express", "RESTful APIs",
                "MongoDB & Mongoose", "AI API Integration", "Environment Variables", "Git & GitHub",
                "CI/CD with Vercel", "Cloud Deployment", "CORS & Security", "Prompt Engineering",
                "Debugging with AI", "Product Thinking",
              ].map(skill => (
                <span key={skill} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium" style={{ background: C.emerald, color: "#34d399", border: `1px solid ${C.emeraldBorder}` }}>
                  <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> {skill}
                </span>
              ))}
            </div>
            <Callout emoji="🚀" bg="rgba(167,139,250,0.06)" border="rgba(167,139,250,0.12)">
              <strong style={{ color: "#e2e8f0" }}>You're not a "vibe coder."</strong> You're a builder who uses AI as a power tool — like a filmmaker uses cameras. The craft is in the thinking: knowing what to build, how to describe it, and when to refine. That's what separates builders from everyone else. Now go ship something real.
            </Callout>

            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "#475569" }}>
                Version 3.0 · Built for <strong style={{ color: "#64748b" }}>CodeLearnn</strong> · Updated Feb 2026
              </p>
            </div>
          </Anim>

        </article>

      </div>

      {/* ── Mobile FAB for Curriculum Menu ── */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(167,139,250,0.5)] transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #a78bfa, #f472b6)", color: "#0f0f14" }}
      >
        <FontAwesomeIcon icon={faBars} className="text-xl" />
      </button>

      {/* ── Floating AI Podcast Player ── */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...APPLE_SPRING, delay: 1 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[600px]"
      >
        <div className="p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group backdrop-blur-xl" 
          style={{ 
            background: "linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.6) 100%)", 
            border: "1px solid rgba(167,139,250,0.25)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(167,139,250,0.1)"
          }}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-purple-500/30" 
            style={{ 
              background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))", 
              boxShadow: "0 0 20px rgba(167,139,250,0.15)" 
            }}>
            <span className="text-xl drop-shadow-md">🎧</span>
          </div>
          
          <div className="flex-1 min-w-0 relative z-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="text-[13px] font-bold tracking-wide truncate" style={{ color: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>Vibe Coding Podcast</h4>
              <span className="px-1.5 py-0.5 text-[8px] uppercase font-bold tracking-wider rounded border shrink-0" style={{ color: "#a78bfa", background: "rgba(167,139,250,0.1)", borderColor: "rgba(167,139,250,0.2)" }}>AI Generated</span>
            </div>
            
            {/* Custom Audio Controls */}
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center gap-3 w-full">
                
                {/* Track Switcher */}
                <button onClick={switchTrack} className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 transition-all hover:bg-white/10" 
                  style={{ color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', minWidth: '56px' }}
                  title={`Switch to ${AUDIO_TRACKS[activeTrack === 0 ? 1 : 0].label}`}>
                  {AUDIO_TRACKS[activeTrack].label}
                </button>

                {/* Skip Backward */}
                <button onClick={() => skip(-10)} className="w-6 h-6 flex items-center justify-center shrink-0 opacity-60 hover:opacity-100 transition-opacity" style={{ color: "#f8fafc" }}>
                  <FontAwesomeIcon icon={faBackwardStep} className="text-[10px]" />
                </button>

                {/* Play/Pause */}
                <button onClick={togglePlay} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95" 
                  style={{ background: isPlaying ? "rgba(167,139,250,0.2)" : "#a78bfa", color: isPlaying ? "#a78bfa" : "#08090d" }}>
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-[11px] ml-0.5" />
                </button>

                {/* Skip Forward */}
                <button onClick={() => skip(10)} className="w-6 h-6 flex items-center justify-center shrink-0 opacity-60 hover:opacity-100 transition-opacity" style={{ color: "#f8fafc" }}>
                  <FontAwesomeIcon icon={faForwardStep} className="text-[10px]" />
                </button>
                
                {/* Scrub Bar */}
                <div 
                  ref={progressRefBar}
                  onClick={handleSeek}
                  className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group ml-2"
                >
                  {/* Hover preview track could go here */}
                  <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear" 
                    style={{ width: `${progress}%`, background: "linear-gradient(90deg, #a78bfa, #f472b6)", boxShadow: "0 0 10px rgba(167,139,250,0.5)" }} />
                  
                  {/* Draggable Scrubber Knob (Simulated via hover state for desktop fidelity) */}
                  <div className="absolute top-1/2 -mt-1 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                       style={{ left: `calc(${progress}% - 4px)`, boxShadow: "0 0 10px rgba(255,255,255,0.8)" }} />
                </div>
                
                {/* Timecodes */}
                <div className="text-[10px] font-mono tracking-wider w-20 text-right opacity-60" style={{ color: "#e2e8f0" }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>

            {/* Hidden Native Audio Element */}
            <audio 
              ref={audioRef} 
              onTimeUpdate={handleTimeUpdate} 
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)} 
              className="hidden"
            >
              <source src={AUDIO_TRACKS[activeTrack].url} type="audio/mp4" />
            </audio>
          </div>
        </div>
      </motion.div>

    </main>
  );
};

export default VibeCodingGuidePage;
