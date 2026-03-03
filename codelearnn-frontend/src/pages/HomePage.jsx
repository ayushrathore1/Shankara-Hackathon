import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import SEO from '../components/common/SEO';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

/* ─── Scroll-reveal Helpers ─── */
const Reveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const y = direction === 'up' ? 40 : direction === 'down' ? -40 : 0;
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}>
      {children}
    </motion.div>
  );
};

const StaggerChild = ({ children, className = '' }) => (
  <motion.div className={className}
    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] } } }}>
    {children}
  </motion.div>
);

const StaggerReveal = ({ children, className = '', stagger = 0.08 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} className={className}
      initial="hidden" animate={isInView ? 'show' : 'hidden'}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}>
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 1: HERO
   ═══════════════════════════════════════════════════════════ */
const HeroSection = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ roadmaps: 0, certs: 0, activeDevs: 0 });

  useEffect(() => {
    let currentStep = 0; const steps = 60;
    const targetStats = { roadmaps: 847, certs: 219, activeDevs: 142 };
    const timer = setInterval(() => {
      currentStep++;
      const easing = currentStep === steps ? 1 : 1 - Math.pow(2, -10 * (currentStep / steps));
      setStats({
        roadmaps: Math.floor(targetStats.roadmaps * easing),
        certs: Math.floor(targetStats.certs * easing),
        activeDevs: Math.floor(targetStats.activeDevs * easing)
      });
      if (currentStep >= steps) clearInterval(timer);
    }, 1500 / steps);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[100vh] flex flex-col text-center overflow-x-hidden" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Ambient glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[350px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] rounded-full blur-[60px] pointer-events-none" style={{ backgroundColor: 'rgba(0, 212, 255, 0.08)', willChange: 'transform' }} />
      
      {/* Decorative background text */}
      <div className="absolute top-[50vh] left-0 w-full -translate-y-1/2 text-center pointer-events-none select-none z-0 overflow-hidden" style={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: 'clamp(60px, 14.5vw, 200px)', lineHeight: 1, color: 'rgba(255,255,255,0.035)', letterSpacing: '-0.02em', transform: 'translateZ(0)' }}>
        DIRECTION
      </div>

      {/* Main content — 60px below navbar on mobile */}
      <div className="flex-1 flex flex-col items-center justify-center pt-[124px] sm:pt-[20vh] md:pt-[25vh] pb-8">
        <div className="max-w-[1000px] mx-auto px-5 sm:px-6 relative z-10 w-full">
          
          {/* Eyebrow — 9px on mobile */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-mono text-[9px] sm:text-xs md:text-sm tracking-[0.25em] sm:tracking-[0.2em] uppercase mb-5 sm:mb-8" 
            style={{ color: '#00D4FF' }}
          >
            The AI Career Platform For Developers
          </motion.p>

          {/* Headline — mobile: deliberate line breaks at 36px */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-heading font-bold leading-[1.15] tracking-tight text-white"
            style={{ marginBottom: '20px' }}
          >
            {/* Mobile headline */}
            <span className="sm:hidden block text-[36px]">
              <span className="block">You Don't Have</span>
              <span className="block">a Learning Problem.</span>
              <span className="block mt-4">You Have a</span>
              <span className="block">Direction Problem.</span>
            </span>
            {/* Desktop headline */}
            <span className="hidden sm:block text-[3.5rem] md:text-[5rem] lg:text-[6.5rem]">
              <StaggerReveal className="flex flex-wrap justify-center">
                {["You", "Don't", "Have", "a", "Learning", "Problem.", "You", "Have", "a", "Direction", "Problem."].map((word, i) => (
                  <StaggerChild key={i} className="mr-4 mb-2">{word}</StaggerChild>
                ))}
              </StaggerReveal>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <p className="sm:hidden font-sans text-[14px] text-white/70 leading-[1.7] mx-auto" style={{ marginBottom: '32px' }}>
              Every week without a roadmap, the developer with one pulls further ahead.
            </p>
            <p className="hidden sm:block font-sans text-lg md:text-xl text-white/80 max-w-[560px] mx-auto leading-relaxed mb-10">
              Every week without a clear roadmap is a week the developer with one pulls further ahead.
              <br/><br/>
              Medha gives you the map. Built from 12,400+ live job postings. Personalized to your goal. Free to start. Ready in 60 seconds.
            </p>
          </motion.div>

          {/* ═══ PRODUCT CARD ═══ */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <div className="flex justify-center" style={{ marginBottom: '36px' }}>
              <div
                className="relative w-full max-w-[420px] rounded-2xl p-5 sm:p-6 text-left"
                style={{
                  background: '#0D0D1A',
                  borderTop: '1px solid rgba(0,212,255,0.5)',
                  borderLeft: '1px solid rgba(0,212,255,0.25)',
                  borderRight: '1px solid rgba(0,212,255,0.25)',
                  borderBottom: '1px solid rgba(0,212,255,0.25)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,212,255,0.08)',
                }}
              >
                {/* Role header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <p className="font-mono text-[9px] tracking-wider mb-1" style={{ color: 'rgba(0,212,255,0.6)' }}>AI ROADMAP RESULT</p>
                    <h4 className="font-heading text-[22px] sm:text-lg text-white font-semibold leading-tight">Full Stack Developer</h4>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(57,255,20,0.1)' }}>
                    <span className="text-sm" style={{ color: '#39FF14' }}>✓</span>
                  </div>
                </div>

                {/* Skill chips */}
                <div className="flex gap-2 mb-4 sm:mb-5 overflow-x-auto">
                  {['React', 'Node.js', 'PostgreSQL'].map((skill) => (
                    <span key={skill} className="font-mono text-[12px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-md whitespace-nowrap" style={{ backgroundColor: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Data row — mobile: single-line with dots */}
                <div className="sm:hidden flex items-center gap-0 mb-4 pb-3 font-sans text-[13px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-white font-semibold">₹8–14 LPA</span>
                  <span className="mx-2" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span className="text-white/60">12 Weeks</span>
                  <span className="mx-2" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span className="text-white/60">Mumbai</span>
                </div>
                {/* Desktop: two columns */}
                <div className="hidden sm:flex justify-between items-center mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="font-mono text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>SALARY RANGE</p>
                    <p className="font-sans text-base font-semibold text-white">₹8 – 14 LPA</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>EST. TIMELINE</p>
                    <p className="font-sans text-base font-semibold text-white">12 Weeks</p>
                  </div>
                </div>

                {/* Career readiness bar */}
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="font-mono text-[9px] tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>CAREER READINESS</p>
                    <p className="font-mono text-[9px] sm:text-xs font-bold" style={{ color: '#39FF14' }}>73%</p>
                  </div>
                  <div className="w-full h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: '73%', background: 'linear-gradient(90deg, #00D4FF, #39FF14)', boxShadow: '0 2px 8px rgba(57,255,20,0.3)' }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ CTAs ═══ */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
            {/* Primary CTA — 48px height */}
            <button onClick={() => navigate('/join-waitlist')} 
              className="group font-sans font-bold text-[15px] sm:text-base h-12 sm:h-auto sm:py-4 px-8 rounded-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center mx-auto text-[#0A0A0F] hover:bg-white cursor-pointer"
              style={{ 
                backgroundColor: '#39FF14',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 30px rgba(57,255,20,0.2)'
              }}
            >
              Join Waitlist
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* Secondary CTA — 32px gap */}
            <button className="font-sans font-medium text-[13px] sm:text-sm px-4 py-2 rounded transition-colors flex items-center gap-2 mx-auto mt-8 sm:mt-6 cursor-pointer" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ color: '#00D4FF' }}>▶</span> See It In 90 Seconds
            </button>

            {/* Micro-copy */}
            <p className="font-mono text-[11px] mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              No credit card. No tutorial hell. Just your next move — waiting.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Ticker bar */}
      <div className="w-full relative z-10">
        <div className="w-full py-3 sm:py-4 overflow-hidden" style={{ backgroundColor: '#0D0D12', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex whitespace-nowrap" style={{ animation: 'slide-left 40s linear infinite', willChange: 'transform' }}>
            {[1, 2].map(n => (
              <div key={n} className="flex items-center gap-4 sm:gap-8 font-mono text-[10px] sm:text-sm px-4" style={{ color: '#00D4FF' }}>
                <span>⚡ Built in 23 days</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>{stats.roadmaps} career roadmaps generated</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>{stats.certs} certificates issued</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>{stats.activeDevs} developers active this week</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>Analyzing 12,400+ job postings in real time</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gradient bleed */}
      <div className="absolute -bottom-20 left-0 w-full h-[150px] bg-gradient-to-b from-transparent to-[#0D0A08] pointer-events-none" />
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 2: PROBLEM
   ═══════════════════════════════════════════════════════════ */
const ProblemSection = () => (
  <section className="relative pt-20 sm:pt-[140px] pb-16 sm:pb-32 px-5 sm:px-6" style={{ backgroundColor: '#0D0A08' }}>
    {/* Decorative background text */}
    <div className="bg-text-decoration top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(80px, 22vw, 350px)', color: 'rgba(245,166,35,0.035)' }}>
      BROKEN
    </div>

    <div className="max-w-[900px] mx-auto relative z-10">
      {/* Headline — mobile: 34px, centered, deliberate 2-line breaks */}
      <Reveal>
        <h2 className="font-heading font-bold text-center leading-[1.15] mb-5 sm:mb-10" style={{ color: '#F5A623' }}>
          <span className="sm:hidden block text-[34px]">
            <span className="block">You're Not Lazy.</span>
            <span className="block mt-1">The System Is Broken.</span>
          </span>
          <span className="hidden sm:block text-4xl md:text-5xl lg:text-6xl">
            You're Not Lazy.<br/>The System Is Broken.
          </span>
        </h2>

        {/* Body copy — left-aligned on mobile */}
        <div className="max-w-[600px] mx-auto mb-10 sm:mb-16">
          <p className="font-sans text-[14px] sm:text-lg md:text-xl text-left sm:text-center text-white/80 leading-[1.7] sm:leading-relaxed">
            You watch tutorials. Bookmark courses. Follow roadmaps.
            But six months later, you still can't build the projects companies want to see.
          </p>
          <p className="font-sans text-[14px] sm:text-lg md:text-xl text-left sm:text-center leading-[1.7] sm:leading-relaxed mt-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Because content <span style={{ color: '#F5A623' }}>≠</span> competence.
          </p>
        </div>
      </Reveal>

      {/* Evidence card — mobile: left accent border only, no box + scroll highlight */}
      <Reveal delay={0.2} className="w-full">
        <motion.div 
          className="mb-10 sm:mb-16 max-w-[700px] mx-auto relative overflow-hidden rounded-lg group"
          initial={{ borderColor: 'rgba(245,166,35,0.2)', boxShadow: 'none', scale: 1 }}
          whileInView={{ borderColor: 'rgba(245,166,35,1)', boxShadow: '0 0 30px rgba(245,166,35,0.15)', scale: 1.02 }}
          viewport={{ margin: "-35% 0px -35% 0px" }}
          transition={{ duration: 0.4 }}
          style={{
            backgroundColor: 'rgba(15,15,24,0.6)',
            borderLeft: '3px solid #F5A623',
            borderRightWidth: '1px', borderRightStyle: 'solid',
            borderTopWidth: '1px', borderTopStyle: 'solid',
            borderBottomWidth: '1px', borderBottomStyle: 'solid',
            padding: '20px',
          }}
        >
          {/* Subtle glow effect active when in view */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'radial-gradient(circle at top left, rgba(245,166,35,0.08) 0%, transparent 70%)' }} />
          
          <p className="font-sans text-[15px] sm:text-xl text-white font-medium leading-[1.55] sm:leading-snug text-left mb-4 sm:mb-6 relative z-10">
            The average engineering graduate in India applies to 200+ companies before their first relevant offer.
          </p>
          <p className="font-sans text-[13px] sm:text-base leading-[1.55] sm:leading-relaxed text-left relative z-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Not because they lack intelligence.<br className="hidden sm:block" />
            Because nobody ever showed them exactly what to learn, in what order, for the role they actually want.
          </p>
          <p className="font-sans text-[15px] sm:text-lg font-bold text-left mt-4 sm:mt-5 relative z-10 transition-colors duration-300 group-hover:text-white" style={{ color: '#F5A623' }}>
            Medha fixes that. Specifically. Personally. Free.
          </p>
        </motion.div>
      </Reveal>

      {/* Connector cards — stack vertically on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
        {[
          { label: "WHAT TO LEARN", text: "Curated skill paths built directly from what companies in your city are hiring for right now — not last year's blog post." },
          { label: "HOW TO LEARN IT", text: "Visual understanding through real projects, not documentation memorization. Mental models that survive interviews." },
          { label: "PROOF YOU LEARNED IT", text: "Verified certificates with unique codes any recruiter can check. Not a PDF. Actual proof. At medha.dev/verify — right now." }
        ].map((card, i) => (
          <Reveal key={i} delay={0.1 * i} className="h-full w-full block">
            <motion.div 
              className="rounded-lg p-5 sm:p-6 h-full w-full relative group flex flex-col"
              initial={{ borderColor: 'rgba(245,166,35,0.15)', boxShadow: 'none', y: 0 }}
              whileInView={{ borderColor: 'rgba(245,166,35,1)', boxShadow: '0 10px 30px rgba(245,166,35,0.1)', y: -4 }}
              viewport={{ margin: "-35% 0px -35% 0px" }}
              transition={{ duration: 0.4 }}
              style={{ 
                backgroundColor: 'rgba(20,20,30,0.6)', 
                borderTop: '2px solid #F5A623', 
                borderRightWidth: '1px', borderRightStyle: 'solid',
                borderBottomWidth: '1px', borderBottomStyle: 'solid',
                borderLeftWidth: '1px', borderLeftStyle: 'solid',
              }}>
              <p className="font-mono text-[11px] tracking-[0.15em] mb-3 sm:mb-4 pb-3 sm:pb-4 uppercase transition-colors duration-300 group-hover:text-white" style={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{card.label}</p>
              <p className="font-sans text-[13px] sm:text-sm leading-[1.55] text-left transition-colors duration-300 group-hover:text-white/80" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.text}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </div>
    {/* Gradient bleed */}
    <div className="absolute -bottom-20 left-0 w-full h-[150px] bg-gradient-to-b from-transparent to-[#0A0A0F] pointer-events-none" />
  </section>
);

/* ═══════════════════════════════════════════════════════════
   SECTION 3: WOW MOMENT (Live Demo)
   ═══════════════════════════════════════════════════════════ */
const WowMomentSection = () => {
  const [inputValue, setInputValue] = useState("");
  const [demoState, setDemoState] = useState("idle");
  const placeholderRoles = ["...Full Stack Developer", "...ML Engineer", "...Product Manager", "...UI/UX Designer", "...DevOps Engineer"];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    if (demoState !== "idle") return;
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholderRoles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [demoState]);

  const handleDemoSubmit = (e) => {
    e.preventDefault(); if (!inputValue) return;
    setDemoState("loading1");
    setTimeout(() => setDemoState("loading2"), 1500);
    setTimeout(() => setDemoState("loading3"), 3000);
    setTimeout(() => setDemoState("result"), 4500);
  };

  return (
    <section className="relative pt-20 sm:pt-[140px] pb-16 sm:pb-32 px-5 sm:px-6" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(57, 255, 20, 0.2) 0%, transparent 70%)' }} />
      {/* Decorative background text */}
      <div className="bg-text-decoration top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(80px, 22vw, 350px)', color: 'rgba(57,255,20,0.02)' }}>
        DISCOVER
      </div>
      <div className="max-w-[900px] mx-auto text-center relative z-10">
        <p className="font-mono text-[10px] sm:text-xs tracking-[0.2em] mb-4 sm:mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>THE 8-SECOND MOMENT</p>
        
        {/* Mobile typography: 34-38px max */}
        <Reveal>
          <h2 className="font-heading font-bold text-[34px] sm:text-4xl md:text-5xl lg:text-6xl text-white mb-10 sm:mb-16 leading-[1.1] sm:leading-[1.1]">
            Type One Sentence.<br/>Watch Your Entire<br/>Career Path Appear.
          </h2>
        </Reveal>

        <Reveal delay={0.2} className="w-full">
          <div className="rounded-2xl p-5 sm:p-6 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ backgroundColor: '#0F0F14', border: '1px solid rgba(255,255,255,0.05)' }}>
            {demoState === "idle" && (
              <form onSubmit={handleDemoSubmit} className="relative max-w-[600px] mx-auto group flex flex-col sm:block">
                <div className="hidden sm:flex absolute inset-y-0 left-4 items-center pointer-events-none">
                  <span className="font-sans text-lg text-white">I want to become a</span>
                </div>
                <label className="sm:hidden block text-left font-sans text-[13px] sm:text-sm text-white/60 mb-2">I want to become a...</label>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={placeholderRoles[placeholderIdx]}
                  className="w-full h-14 sm:h-auto rounded-xl sm:rounded-lg mb-3 sm:mb-0 sm:py-5 px-4 sm:pl-[180px] sm:pr-[160px] text-[15px] sm:text-lg text-white font-sans focus:outline-none transition-all duration-1000"
                  style={{ backgroundColor: '#0A0A0F', border: '1px solid rgba(57, 255, 20, 0.4)', boxShadow: '0 0 15px rgba(57, 255, 20, 0.2)' }}
                  onFocus={(e) => { e.target.style.borderColor = '#39FF14'; e.target.style.boxShadow = '0 0 30px rgba(57, 255, 20, 0.4)'; e.target.style.animation = 'pulseBorder 2s infinite'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(57, 255, 20, 0.4)'; e.target.style.boxShadow = '0 0 15px rgba(57, 255, 20, 0.2)'; e.target.style.animation = 'none'; }}
                />
                <button type="submit" className="w-full h-14 sm:h-auto sm:absolute sm:inset-y-2 sm:right-2 sm:w-auto font-sans font-bold text-[15px] sm:text-base px-6 sm:py-0 rounded-xl sm:rounded transition-colors text-black cursor-pointer" style={{ backgroundColor: '#39FF14' }}>
                  Show My Path →
                </button>
              </form>
            )}

            {demoState.startsWith("loading") && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <p className="font-mono text-sm type-writer" style={{ color: '#39FF14' }}>
                  {demoState === "loading1" && "> Analyzing 12,400+ job postings..."}
                  {demoState === "loading2" && "> Ranking skills by hiring demand in India..."}
                  {demoState === "loading3" && "> Building your personal roadmap..."}
                </p>
              </div>
            )}

            {demoState === "result" && (
              <div className="text-left animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 sm:pb-6 mb-4 sm:mb-6 gap-4 sm:gap-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div>
                    <h3 className="font-heading text-xl sm:text-2xl text-white mb-1 sm:mb-2">{inputValue} Roadmap</h3>
                    <p className="font-mono text-[10px] sm:text-xs" style={{ color: '#39FF14' }}>✓ Built from 1,248 active listings</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-sans text-[11px] sm:text-sm uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Est. Timeline</p>
                    <p className="font-mono text-base sm:text-lg text-white">12 Weeks</p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="rounded p-4 flex justify-between items-center" style={{ backgroundColor: '#0A0A0F', borderLeft: '2px solid #39FF14' }}>
                    <span className="font-sans text-[14px] sm:text-base text-white"><span style={{ color: '#6BFF3C' }}>1.</span> Core Fundamentals</span>
                    <span className="font-mono text-[11px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>4 wks</span>
                  </div>
                  <div className="rounded p-4 flex justify-between items-center" style={{ backgroundColor: '#0A0A0F', borderLeft: '2px solid #39FF14' }}>
                    <span className="font-sans text-[14px] sm:text-base text-white"><span style={{ color: '#6BFF3C' }}>2.</span> Advanced Configs</span>
                    <span className="font-mono text-[11px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>5 wks</span>
                  </div>
                </div>
                <button onClick={() => setDemoState("idle")} className="text-[13px] sm:text-sm font-sans transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>← Try another role</button>
              </div>
            )}
          </div>
        </Reveal>
        <p className="font-sans text-sm mt-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span className="font-medium" style={{ color: '#39FF14' }}>1,482</span> developers got their roadmap in the last 48 hours. Yours takes 8 seconds.
        </p>
      </div>
      <style>{`@keyframes pulseBorder { 0% { box-shadow: 0 0 15px rgba(57, 255, 20, 0.4); } 50% { box-shadow: 0 0 40px rgba(57, 255, 20, 0.8); } 100% { box-shadow: 0 0 15px rgba(57, 255, 20, 0.4); } }`}</style>
      {/* Bleed down into Section 4 */}
      {/* Fix 3: Stronger gradient — 150px */}
      <div className="absolute -bottom-20 left-0 w-full h-[150px] bg-gradient-to-b from-transparent to-[#F5F0E8] pointer-events-none" />
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 4: FEATURES
   ═══════════════════════════════════════════════════════════ */
const FeaturesSection = () => {
  const features = [
    {
      icon: "🤖", title: "AI Career Explorer", subtitle: "Powered by Groq LLM + 12,400 live job postings",
      benefits: ["Type any role → skills, salary, demand, roadmap in 8 seconds", "Built from real job postings, not opinions from 2021", "Career readiness score that updates as you learn"],
      stat: "8s", statLabel: "To generate",
      color: "#2563EB", bgIcon: "rgba(37, 99, 235, 0.1)"
    },
    {
      icon: "📚", title: "Learning Vault", subtitle: "Curated by ML quality scoring — not popularity",
      benefits: ["Step-by-step paths validated against hiring criteria", "AI quality score on every resource before you open it", "Zero outdated content — ML classifier filters it out"],
      stat: "0", statLabel: "Bad tutorials",
      color: "#16A34A", bgIcon: "rgba(22, 163, 74, 0.1)"
    },
    {
      icon: "🎮", title: "Career Ranks + XP", subtitle: "Intern → Junior → Developer → Senior → Lead",
      benefits: ["XP for every real action — projects, reviews, helping peers", "Global leaderboard your batchmates can see", "25+ achievements tied to things you actually did"],
      stat: "7", statLabel: "Rank levels",
      color: "#D97706", bgIcon: "rgba(217, 119, 6, 0.1)"
    },
    {
      icon: "🏗️", title: "Build + Prove", subtitle: "Real projects. Real peers. Real verification.",
      benefits: ["Team projects with real peers earning 200 XP", "Peer code reviews with structured feedback", "MEDHA-XXXX verified certificates any recruiter can check"],
      stat: "✓", statLabel: "Verifiable",
      color: "#7C3AED", bgIcon: "rgba(124, 58, 237, 0.1)"
    }
  ];

  return (
    <section data-theme-light className="relative py-16 sm:py-32 px-4 sm:px-6" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Fix 5: Decorative background text — dark on cream */}
      <div className="bg-text-decoration top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(80px, 20vw, 300px)', color: 'rgba(10,10,15,0.025)' }}>
        POWER
      </div>
      <div className="max-w-[1000px] mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <p className="font-mono text-[10px] sm:text-xs tracking-[0.2em] mb-3 sm:mb-4" style={{ color: 'rgba(10,10,15,0.5)' }}>PLATFORM</p>
          <h2 className="font-heading font-bold text-2xl sm:text-4xl md:text-5xl mb-4 sm:mb-6 leading-[1.1]" style={{ color: '#0A0A0F' }}>
            One System.<br/>Four Superpowers.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-white rounded-xl p-5 sm:p-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
                {/* Large stat badge — visual anchor */}
                <div className="absolute top-6 right-6 w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: f.bgIcon }}>
                  <span className="font-mono text-lg font-bold" style={{ color: f.color }}>{f.stat}</span>
                </div>
                <div className="absolute top-[72px] right-6">
                  <span className="font-mono text-[9px] tracking-wider uppercase" style={{ color: 'rgba(10,10,15,0.35)' }}>{f.statLabel}</span>
                </div>

                {/* Icon + Title */}
                <div className="mb-6">
                  <span className="text-3xl mb-3 block">{f.icon}</span>
                  <h3 className="font-heading font-bold text-xl mb-1" style={{ color: '#0A0A0F' }}>{f.title}</h3>
                  <p className="font-sans text-sm" style={{ color: 'rgba(10,10,15,0.5)' }}>{f.subtitle}</p>
                </div>

                {/* Divider */}
                <div className="w-8 h-[2px] rounded-full mb-5" style={{ backgroundColor: f.color }} />
                
                {/* Benefits — concise */}
                <ul className="space-y-3 flex-grow">
                  {f.benefits.map((item, j) => (
                    <li key={j} className="font-sans text-sm flex items-start gap-2.5" style={{ color: '#0A0A0F' }}>
                      <span className="mt-0.5 min-w-[16px]" style={{ color: f.color }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      {/* Bleed down into Section 5 */}
      {/* Fix 3: Stronger gradient — 150px */}
      <div className="absolute -bottom-20 left-0 w-full h-[150px] bg-gradient-to-b from-transparent to-[#111114] pointer-events-none" />
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 5: HOW IT WORKS
   ═══════════════════════════════════════════════════════════ */
const HowItWorksSection = () => {
  const steps = [
    { num: "01", time: "Takes 60 seconds", title: "SET YOUR GOAL", desc: "Tell Medha your dream role. 'I want to become a Full Stack Developer.' That's the only input we need. Your background, your timeline, your city — we figure the rest out from job market data. You will never again open your laptop and not know what to do next.", color: "#FFFFFF" },
    { num: "02", time: "Takes 8 seconds", title: "GET YOUR ROADMAP", desc: "Your AI roadmap appears. Built from 12,400+ live job postings. Skills ranked by actual hiring demand — not a syllabus. Estimated timeline based on your stated time commitment. Salary range for your target role. Not an opinion. A data model.", color: "#00D4FF" },
    { num: "03", time: "Ongoing — never boring", title: "LEARN + BUILD + COLLABORATE", desc: "Follow your path. Join a team project. Earn 200 XP when you ship it. Get your code reviewed by a peer. Earn 30 XP. Help someone stuck in the forum. Earn 10 XP. Maintain a 7-day streak. Watch your rank climb. Your batchmate can see your leaderboard position. That is not an accident. That is accountability.", color: "#F5A623" },
    { num: "04", time: "Shareable immediately", title: "PROVE IT TO THE WORLD", desc: "Certificate generated. Code: MEDHA-XXXX. Verifiable by any recruiter at medha.dev/verify. No login. No PDF. Real proof. Your public profile at /u/yourname goes live. Career rank. XP. Projects. Share it instead of a resume. Watch the conversation change.", color: "#39FF14" }
  ];

  return (
    <section className="relative py-16 sm:py-32 px-4 sm:px-6" style={{ backgroundColor: '#111114' }}>
      {/* Fix 5: Decorative background text */}
      <div className="bg-text-decoration top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(80px, 22vw, 300px)', color: 'rgba(255,255,255,0.02)' }}>
        JOURNEY
      </div>
      <div className="max-w-[800px] mx-auto relative z-10">
        <Reveal>
          <h2 className="font-heading font-bold text-2xl sm:text-4xl md:text-5xl text-white mb-4 sm:mb-6 leading-[1.1]">
            From "I Don't Know Where to Start" to Career-Ready.
          </h2>
          <p className="font-mono text-xs sm:text-sm mb-10 sm:mb-16" style={{ color: 'rgba(255,255,255,0.5)' }}>Four Steps. Real Timeline.</p>
        </Reveal>

        <div className="space-y-12">
          {steps.map((step, i) => (
            <Reveal key={i} delay={0.1}>
              <div className="rounded-xl p-5 sm:p-8 relative overflow-hidden group transition-colors" style={{ backgroundColor: '#1A1A1E', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Large Background Number */}
                <div className="absolute -right-4 -top-8 font-mono font-bold text-[120px] select-none pointer-events-none" style={{ color: 'rgba(255,255,255,0.02)' }}>{step.num}</div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-6 relative z-10" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <h3 className="font-mono font-bold text-lg transition-colors" style={{ color: step.color }}>
                    {step.num} ── {step.title}
                  </h3>
                  <span className="font-mono text-xs mt-2 sm:mt-0 flex items-center gap-2" style={{ color: step.color }}>
                    ⏱ {step.time}
                  </span>
                </div>
                <p className="font-sans text-base leading-relaxed whitespace-pre-line relative z-10" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {step.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      {/* Fix 3: Stronger gradient — 150px */}
      <div className="absolute -bottom-20 left-0 w-full h-[150px] bg-gradient-to-b from-transparent to-[#FAFAF7] pointer-events-none" />
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 6: SOCIAL PROOF
   ═══════════════════════════════════════════════════════════ */
const SocialProofSection = () => {
    return (
        <section data-theme-light className="relative py-16 sm:py-32 px-4 sm:px-6" style={{ backgroundColor: '#FAFAF7' }}>
            <div className="max-w-[1000px] mx-auto relative z-10">
                <Reveal>
                    <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl mb-8 sm:mb-12 text-center" style={{ color: '#1A1A1A' }}>
                        Don't Take Our Word For It.
                    </h2>
                </Reveal>
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {[
                        { text: "The roadmap gave me exactly what I needed to learn to crack my first internship. No BS.", name: "Rahul S.", role: "Frontend Developer" },
                        { text: "I actually finished a project for once because the XP system wouldn't let me quit.", name: "Priya M.", role: "Student" },
                        { text: "The certificate verification link is a game changer. Put it straight on my resume.", name: "Aman D.", role: "Backend Engineer" },
                    ].map((t, i) => (
                        <div key={i} className="rounded p-6 shadow-sm" style={{ backgroundColor: '#F0EEE8' }}>
                           <p className="font-sans text-sm italic mb-4" style={{ color: '#1A1A1A' }}>"{t.text}"</p>
                           <div className="flex justify-between items-center">
                               <div>
                                   <p className="font-sans text-sm font-bold" style={{ color: '#1A1A1A' }}>{t.name}</p>
                                   <p className="font-sans text-xs" style={{ color: '#1A1A1A', opacity: 0.6 }}>{t.role}</p>
                               </div>
                               <a href="#" style={{ color: '#0A66C2' }}><span className="font-sans text-xs border border-[#0A66C2] px-2 py-1 rounded">in</span></a>
                           </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap justify-around text-center border-t py-6 sm:py-8 gap-4" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                    <div>
                        <p className="font-mono text-2xl sm:text-3xl font-bold" style={{ color: '#1A1A1A' }}>1,248</p>
                        <p className="font-sans text-xs uppercase tracking-widest mt-2" style={{ color: '#666' }}>Active Users</p>
                    </div>
                    <div>
                        <p className="font-mono text-2xl sm:text-3xl font-bold" style={{ color: '#1A1A1A' }}>8,421</p>
                        <p className="font-sans text-xs uppercase tracking-widest mt-2" style={{ color: '#666' }}>Projects Shipped</p>
                    </div>
                    <div>
                        <p className="font-mono text-2xl sm:text-3xl font-bold" style={{ color: '#1A1A1A' }}>492</p>
                        <p className="font-sans text-xs uppercase tracking-widest mt-2" style={{ color: '#666' }}>Offers Received</p>
                    </div>
                </div>
                <p className="text-center font-mono text-xs mt-4" style={{ color: '#999' }}>These numbers update every 24 hours from our live database.</p>
            </div>
            <div className="absolute -bottom-20 left-0 w-full h-40 bg-gradient-to-b from-transparent to-[#0E0A0A] pointer-events-none" />
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 7: PLACEMENT COUNTDOWN
   ═══════════════════════════════════════════════════════════ */
const CountdownSection = () => {
    return (
        <section className="relative py-16 sm:py-32 px-4 sm:px-6 overflow-hidden" style={{ backgroundColor: '#0E0A0A' }}>
           <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at top right, rgba(255,0,0,0.1) 0%, transparent 60%)' }} />
           <div className="max-w-[700px] mx-auto text-center relative z-10">
              <p className="font-mono text-xs sm:text-sm tracking-widest mb-4 sm:mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>YOUR TARGET DATE</p>
              <h2 className="font-mono text-3xl sm:text-5xl md:text-7xl font-bold mb-8 sm:mb-12" style={{ color: '#FF6B35' }}>
                  128<span className="text-lg sm:text-2xl text-white/50">d</span> 14<span className="text-lg sm:text-2xl text-white/50">h</span> 42<span className="text-lg sm:text-2xl text-white/50">m</span>
              </h2>
              <div className="text-left bg-black/40 p-4 sm:p-6 rounded-xl border mb-8 sm:mb-10" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <p className="font-sans text-sm text-white mb-2">Probability of offer at current pace:</p>
                  <div className="w-full h-4 bg-gray-900 rounded-full mb-6 overflow-hidden">
                      <div className="h-full w-[34%] rounded-full" style={{ backgroundColor: '#AA4433' }}></div>
                  </div>
                  <p className="font-sans text-sm text-white mb-2">Probability if you add 1 hour/day:</p>
                  <div className="w-full h-4 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full w-[89%] rounded-full bg-gradient-to-r from-amber-500 to-green-500"></div>
                  </div>
              </div>
              <button className="font-sans font-bold px-8 py-4 rounded text-black transition-transform hover:scale-105" style={{ backgroundColor: '#FF6B35' }}>
                  Set My Placement Date →
              </button>
           </div>
           <div className="absolute -bottom-20 left-0 w-full h-40 bg-gradient-to-b from-transparent to-[#F8F8F6] pointer-events-none" />
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 8: TRUST AND TRANSPARENCY
   ═══════════════════════════════════════════════════════════ */
const TrustSection = () => {
    return (
        <section data-theme-light className="relative py-16 sm:py-32 px-4 sm:px-6" style={{ backgroundColor: '#F8F8F6' }}>
            <div className="max-w-[1000px] mx-auto relative z-10">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl" style={{ color: '#1A1A1A' }}>Built On Transparency.</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="p-6 rounded border-t-4 bg-white shadow-sm" style={{ borderTopColor: '#0D9488' }}>
                        <h3 className="font-sans font-bold mb-2" style={{ color: '#1A1A1A' }}>Certificate Verify</h3>
                        <p className="font-sans text-sm mb-4" style={{ color: '#666' }}>Every certificate we issue is cryptographically verifiable.</p>
                        <p className="font-mono text-xs font-bold" style={{ color: '#0D9488' }}>medha.dev/verify</p>
                    </div>
                    <div className="p-6 rounded border-t-4 bg-white shadow-sm" style={{ borderTopColor: '#4338CA' }}>
                        <h3 className="font-sans font-bold mb-2" style={{ color: '#1A1A1A' }}>Outcome Data</h3>
                        <p className="font-sans text-sm mb-4" style={{ color: '#666' }}>We publish aggregate placement rates and salary uplifts.</p>
                        <p className="font-mono text-xs font-bold" style={{ color: '#4338CA' }}>View 2025 Report</p>
                    </div>
                    <div className="p-6 rounded border-t-4 bg-white shadow-sm" style={{ borderTopColor: '#475569' }}>
                        <h3 className="font-sans font-bold mb-2" style={{ color: '#1A1A1A' }}>Open AI Logic</h3>
                        <p className="font-sans text-sm mb-4" style={{ color: '#666' }}>We tell you exactly how the AI decides your roadmap.</p>
                        <p className="font-mono text-xs font-bold" style={{ color: '#475569' }}>JSearch API + ML Classifier</p>
                    </div>
                </div>
                <div className="max-w-[600px] mx-auto p-8 rounded-xl" style={{ backgroundColor: '#1A1A2E' }}>
                     <p className="font-sans text-lg italic mb-6" style={{ color: '#F5F5F5' }}>
                         "We built Medha because the current education system treats developer careers like a black box. We are opening the box."
                     </p>
                     <p className="font-sans text-sm font-bold" style={{ color: '#00D4FF' }}>— Ayush Rathore</p>
                </div>
            </div>
            <div className="absolute -bottom-20 left-0 w-full h-40 bg-gradient-to-b from-transparent to-[#0C0A14] pointer-events-none" />
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 9: GAMIFICATION
   ═══════════════════════════════════════════════════════════ */
const GamificationSection = () => {
    return (
        <section className="relative py-16 sm:py-32 px-4 sm:px-6" style={{ backgroundColor: '#0C0A14' }}>
            <div className="max-w-[800px] mx-auto text-center relative z-10">
                <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-white mb-8 sm:mb-12">Level Up In Real Life.</h2>
                
                <div className="bg-black/40 rounded-xl p-5 sm:p-8 border mb-10 text-left" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex justify-between font-mono text-xs text-white/50 mb-2">
                        <span>INTERN</span>
                        <span style={{ color: '#39FF14' }}>CTO</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-900 overflow-hidden mb-8">
                        <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-gray-500 via-cyan-400 to-[#39FF14]"></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 p-4 rounded text-center">
                            <p className="font-mono text-lg font-bold mb-1" style={{ color: '#F5A623' }}>+200 XP</p>
                            <p className="font-sans text-xs text-white/60">Ship Project</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded text-center">
                            <p className="font-mono text-lg font-bold mb-1" style={{ color: '#F5A623' }}>+30 XP</p>
                            <p className="font-sans text-xs text-white/60">Code Review</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded text-center">
                            <p className="font-mono text-lg font-bold mb-1" style={{ color: '#F5A623' }}>+10 XP</p>
                            <p className="font-sans text-xs text-white/60">Daily Streak</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute -bottom-20 left-0 w-full h-40 bg-gradient-to-b from-transparent to-[#080808] pointer-events-none" />
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 10: MISSION
   ═══════════════════════════════════════════════════════════ */
const MissionSection = () => {
    return (
        <section className="relative py-20 sm:py-40 px-4 sm:px-6" style={{ backgroundColor: '#080808' }}>
            {/* Fix 5: Decorative background text */}
            <div className="bg-text-decoration top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(80px, 22vw, 350px)', color: 'rgba(255,255,255,0.02)' }}>
              PURPOSE
            </div>
            <div className="max-w-[800px] mx-auto text-center relative z-10">
                 <p className="font-sans text-lg sm:text-2xl md:text-3xl leading-relaxed mb-3 sm:mb-4" style={{ color: '#F5F2EB' }}>For the student from Nagpur.</p>
                 <p className="font-sans text-lg sm:text-2xl md:text-3xl leading-relaxed mb-3 sm:mb-4" style={{ color: '#888888' }}>For the developer from Patna.</p>
                 <p className="font-sans text-lg sm:text-2xl md:text-3xl leading-relaxed mb-10 sm:mb-16" style={{ color: '#F5F2EB' }}>For the first-generation engineer.</p>
                 
                 <p className="font-sans text-xl sm:text-3xl md:text-4xl font-medium mb-10 sm:mb-16" style={{ color: '#F5F2EB' }}>
                     Because direction should not be a <span style={{ color: '#F5A623' }}>luxury</span>.
                 </p>
                 
                 <button className="font-sans text-sm text-white/50 hover:text-white transition-colors">
                     Join Medha. It costs nothing. →
                 </button>
            </div>
            <div className="absolute -bottom-20 left-0 w-full h-40 bg-gradient-to-b from-transparent to-[#080C18] pointer-events-none" />
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 11: PRICING
   ═══════════════════════════════════════════════════════════ */
const PricingSection = () => {
    return (
        <section className="relative py-16 sm:py-32 px-4 sm:px-6" style={{ backgroundColor: '#080C18' }}>
            <div className="max-w-[1000px] mx-auto text-center relative z-10">
                <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-white mb-10 sm:mb-16">Invest In Your Reality.</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Free */}
                    <div className="p-5 sm:p-8 rounded-xl border" style={{ borderColor: 'rgba(148, 163, 184, 0.4)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <h3 className="font-sans font-bold text-xl mb-2 text-white">Free</h3>
                        <p className="font-mono text-3xl mb-6 text-white">₹0</p>
                        <p className="text-sm mb-6 text-left" style={{ color: '#94A3B8' }}>Basic roadmaps and access to the community forum.</p>
                        <button className="w-full py-3 rounded text-sm font-bold border" style={{ borderColor: '#94A3B8', color: '#94A3B8' }}>Start Free</button>
                    </div>
                    {/* Premium */}
                    <div className="p-5 sm:p-8 rounded-xl border relative transform md:-translate-y-4" style={{ borderColor: '#39FF14', backgroundColor: 'rgba(57, 255, 20, 0.05)', boxShadow: '0 0 20px rgba(57, 255, 20, 0.1)' }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-[#39FF14] text-black">Most Popular</div>
                        <h3 className="font-sans font-bold text-xl mb-2 text-white">Premium</h3>
                        <p className="font-mono text-3xl mb-6 text-white">₹499<span className="text-sm text-gray-400">/mo</span></p>
                        <p className="text-sm mb-6 text-left text-white/80">Verifiable certificates, AI reviews, and Gamification. <br/><br/> <span className="font-mono text-xs" style={{ color: '#39FF14' }}>= ₹16/day</span> <br/> <span className="font-sans" style={{ color: '#F5A623' }}>₹1.8 LPA avg uplift</span></p>
                        <button className="w-full py-3 rounded text-sm font-bold text-black" style={{ backgroundColor: '#39FF14' }}>Upgrade Now</button>
                    </div>
                    {/* Enterprise */}
                    <div className="p-5 sm:p-8 rounded-xl border" style={{ borderColor: 'rgba(245, 166, 35, 0.4)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <h3 className="font-sans font-bold text-xl mb-2 text-white">Pro</h3>
                        <p className="font-mono text-3xl mb-6 text-white">₹999<span className="text-sm text-gray-400">/mo</span></p>
                        <p className="text-sm mb-6 text-left" style={{ color: 'rgba(255,255,255,0.7)' }}>1-on-1 mentorship, mock interviews, and advanced projects.</p>
                        <button className="w-full py-3 rounded text-sm font-bold border" style={{ borderColor: '#F5A623', color: '#F5A623' }}>Get Pro</button>
                    </div>
                </div>
            </div>
            <div className="absolute -bottom-20 left-0 w-full h-40 bg-gradient-to-b from-transparent to-[#0A0A0F] pointer-events-none" />
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 12: FINAL CTA
   ═══════════════════════════════════════════════════════════ */
const FinalSection = () => {
    return (
        <section className="bg-bg-dark py-16 sm:py-32 px-4 sm:px-6 flex flex-col items-center justify-center text-center relative" style={{ backgroundColor: '#0A0A0F' }}>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl md:text-7xl mb-6 sm:mb-10 leading-[1.1]">
                <span className="block" style={{ color: '#F5F5F5' }}>Wake Up Tomorrow</span>
                <span className="block" style={{ color: '#00D4FF' }}>Knowing Exactly</span>
                <span className="block" style={{ color: '#39FF14' }}>What to Do Next.</span>
            </h2>
            
             <a href="/join-waitlist" className="font-sans font-bold text-base sm:text-xl px-8 sm:px-16 py-4 sm:py-6 rounded transition-transform hover:scale-105 flex items-center justify-center mb-8 text-black no-underline" style={{ backgroundColor: '#39FF14', boxShadow: '0 0 40px rgba(57, 255, 20, 0.3)' }}>
              Join Waitlist →
             </a>
            
            <p className="font-mono text-sm mb-16" style={{ color: '#00D4FF' }}>847 developers started their roadmap this week</p>
            
            <p className="font-mono text-2xl font-bold">
                 <span style={{ color: '#00D4FF' }}>&lt;</span><span className="text-white">Medha</span><span style={{ color: '#39FF14' }}>/&gt;</span>
            </p>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   ASSEMBLE PAGE
   ═══════════════════════════════════════════════════════════ */
const HomePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen selection:bg-accent-green selection:text-bg-dark" style={{ backgroundColor: '#0A0A0F' }}>
      <SEO title="Medha | Platform Built For Indian Coders" description="Get a clear data-driven roadmap to your dream developer role." />
      <Navbar />
      
      <main>
        <HeroSection />
        <ProblemSection />
        <WowMomentSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SocialProofSection />
        <CountdownSection />
        <TrustSection />
        <GamificationSection />
        <MissionSection />
        <PricingSection />
        <FinalSection />
      </main>
    </div>
  );
};

export default HomePage;
