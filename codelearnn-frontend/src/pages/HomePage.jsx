import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import SEO from '../components/common/SEO';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

/* ─── Scroll-reveal Helpers ─── */
const Reveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const y = direction === 'up' ? 60 : direction === 'down' ? -60 : 0;
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.25, 0.4, 0.25, 1] }}>
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
    <section className="relative min-h-[100vh] flex flex-col text-center" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Ambient glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: 'rgba(0, 212, 255, 0.08)' }} />
      
      {/* Fix 5: Decorative background text */}
      <div className="absolute top-[50vh] left-0 w-full -translate-y-1/2 text-center pointer-events-none select-none z-0 overflow-hidden" style={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '14.5vw', lineHeight: 1, color: 'rgba(255,255,255,0.035)', letterSpacing: '-0.02em' }}>
        DIRECTION
      </div>

      {/* Fix 2: Massive breathing room — headline starts ~35% from top */}
      <div className="flex-1 flex flex-col items-center justify-center pt-[20vh] sm:pt-[25vh] pb-8">
        <div className="max-w-[1000px] mx-auto px-6 relative z-10 w-full">
          <p className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase mb-8 animate-fade-in-up" style={{ color: '#00D4FF' }}>
            The AI Career Platform For Developers
          </p>

          <h1 className="font-heading font-bold text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6.5rem] leading-[1.05] tracking-tight mb-8 text-white">
            <StaggerReveal className="flex flex-wrap justify-center xgap-x-4">
              {["You", "Don't", "Have", "a", "Learning", "Problem.", "You", "Have", "a", "Direction", "Problem."].map((word, i) => (
                <StaggerChild key={i} className={`mr-4 mb-2`}>{word}</StaggerChild>
              ))}
            </StaggerReveal>
          </h1>

          <Reveal delay={0.6}>
            <p className="font-sans text-lg sm:text-xl text-white/80 max-w-[560px] mx-auto leading-relaxed mb-10">
              Every week without a clear roadmap is a week the developer with one pulls further ahead.
              <br/><br/>
              Medha gives you the map. Built from 12,400+ live job postings. Personalized to your goal. Free to start. Ready in 60 seconds.
            </p>
          </Reveal>

          {/* Fix 1: Floating Product Preview Card — THE most important visual addition */}
          <Reveal delay={0.7}>
            <div className="flex justify-center mb-12">
              <div
                className="relative w-full max-w-[420px] rounded-2xl p-6 text-left"
                style={{
                  animation: 'float 6s ease-in-out infinite',
                  background: 'linear-gradient(135deg, rgba(15,15,25,0.9) 0%, rgba(20,20,35,0.95) 100%)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  boxShadow: '0 0 40px rgba(0, 212, 255, 0.12), 0 20px 60px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Card glow accent */}
                <div className="absolute -inset-[1px] rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), transparent 50%, rgba(57,255,20,0.1))', zIndex: -1 }} />

                {/* Role title */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-mono text-[10px] tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>AI ROADMAP RESULT</p>
                    <h4 className="font-heading text-lg text-white font-semibold">Full Stack Developer</h4>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(57,255,20,0.1)' }}>
                    <span className="text-sm" style={{ color: '#39FF14' }}>✓</span>
                  </div>
                </div>

                {/* Skill chips */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {['React', 'Node.js', 'PostgreSQL'].map((skill) => (
                    <span key={skill} className="font-mono text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Salary + timeline row */}
                <div className="flex justify-between items-center mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="font-mono text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>SALARY RANGE</p>
                    <p className="font-sans text-base font-semibold text-white">₹8 – 14 LPA</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>EST. TIMELINE</p>
                    <p className="font-sans text-base font-semibold text-white">12 Weeks</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="font-mono text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>CAREER READINESS</p>
                    <p className="font-mono text-xs font-bold" style={{ color: '#39FF14' }}>73%</p>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: '73%', background: 'linear-gradient(90deg, #00D4FF, #39FF14)' }} />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* CTA buttons — Fix: strong primary, ghost secondary */}
          <Reveal delay={0.9}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <button onClick={() => navigate('/signup')} 
                className="group font-sans font-bold text-base px-8 py-4 rounded transition-all flex items-center gap-2 w-full sm:w-auto justify-center text-[#0A0A0F] hover:bg-white hover:shadow-[0_0_40px_rgba(57,255,20,0.3)]" style={{ backgroundColor: '#39FF14' }}>
                Get Your Roadmap Free
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button className="font-sans font-medium text-sm px-4 py-2 rounded transition-colors flex items-center gap-2 w-full sm:w-auto justify-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <span className="text-base">▶</span> See It In 90 Seconds
              </button>
            </div>
            {/* Micro-copy */}
            <p className="font-sans text-xs mb-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No credit card. No tutorial hell. Just your next move — waiting.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Ticker bar — Fix: distinct dark band, borders, flush placement */}
      <Reveal delay={1.0} className="w-full relative z-10">
        <div className="w-full py-4 overflow-hidden" style={{ backgroundColor: '#0D0D12', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex whitespace-nowrap" style={{ animation: 'slide-left 40s linear infinite' }}>
            {[1, 2].map(n => (
              <div key={n} className="flex items-center gap-8 font-mono text-sm px-4" style={{ color: '#00D4FF' }}>
                <span>⚡ Built in 23 days</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>{stats.roadmaps} career roadmaps generated</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>{stats.certs} certificates issued</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>{stats.activeDevs} developers active this week</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>Analyzing 12,400+ job postings in real time</span><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Fix 3: Stronger gradient bleed into Section 2 — 150px */}
      <div className="absolute -bottom-20 left-0 w-full h-[150px] bg-gradient-to-b from-transparent to-[#0D0A08] pointer-events-none" />
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION 2: PROBLEM
   ═══════════════════════════════════════════════════════════ */
const ProblemSection = () => (
  <section className="relative pt-[140px] pb-32 px-6" style={{ backgroundColor: '#0D0A08' }}>
    {/* Fix 5: Decorative background text */}
    <div className="bg-text-decoration top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(180px, 22vw, 350px)', color: 'rgba(245,166,35,0.035)' }}>
      BROKEN
    </div>

    <div className="max-w-[900px] mx-auto text-center relative z-10">
      <Reveal>
        <h2 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl mb-10 leading-[1.1]" style={{ color: '#F5A623' }}>
          You're Not Lazy.<br/>The System Is Broken.
        </h2>
        <p className="font-sans text-xl text-white max-w-[600px] mx-auto leading-relaxed mb-16">
          You watch tutorials. Bookmark courses. Follow roadmaps.
          But six months later, you still can't build the projects companies want to see.
          <br/><br/>
          Because content <span style={{ color: '#F5A623' }}>≠</span> competence.
        </p>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="rounded-xl p-8 sm:p-12 mb-16 max-w-[700px] mx-auto relative overflow-hidden" style={{ border: '1px solid #F5A623', background: 'radial-gradient(circle at center, rgba(245,166,35,0.05) 0%, transparent 100%)' }}>
          <p className="font-sans text-xl sm:text-2xl text-white font-medium mb-8 leading-snug">
            The average engineering graduate in India applies to 200+ companies before their first relevant offer.
          </p>
          <p className="font-sans text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Not because they lack intelligence.<br/>
            Because nobody ever showed them exactly what to learn, in what order, for the role they actually want.
          </p>
          <p className="font-sans text-lg font-semibold" style={{ color: '#F5A623' }}>
            Medha fixes that. Specifically. Personally. Free.
          </p>
        </div>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-6 text-left">
        {[
          { label: "WHAT TO LEARN", text: "Curated skill paths built directly from what companies in your city are hiring for right now — not last year's blog post." },
          { label: "HOW TO LEARN IT", text: "Visual understanding through real projects, not documentation memorization. Mental models that survive interviews." },
          { label: "PROOF YOU LEARNED IT", text: "Verified certificates with unique codes any recruiter can check. Not a PDF. Actual proof. At medha.dev/verify — right now." }
        ].map((card, i) => (
          <Reveal key={i} delay={0.1 * i}>
            <div className="rounded-lg p-6 h-full relative" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderTop: '1px solid #F5A623', boxShadow: 'inset 0 1px 10px rgba(245,166,35,0.1)' }}>
              <p className="font-mono text-xs tracking-wider mb-4 border-b pb-4" style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}>{card.label}</p>
              <p className="font-sans text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
    {/* Fix 3: Stronger gradient bleed — 150px */}
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
    <section className="relative py-32 px-6" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(57, 255, 20, 0.2) 0%, transparent 70%)' }} />
      {/* Fix 5: Decorative background text */}
      <div className="bg-text-decoration top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(180px, 22vw, 350px)', color: 'rgba(57,255,20,0.02)' }}>
        DISCOVER
      </div>
      <div className="max-w-[900px] mx-auto text-center relative z-10">
        <p className="font-mono text-xs tracking-[0.2em] mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>THE 8-SECOND MOMENT</p>
        <h2 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white mb-16 leading-[1.1]">
          Type One Sentence.<br/>Watch Your Entire<br/>Career Path Appear.
        </h2>

        <div className="rounded-2xl p-6 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ backgroundColor: '#0F0F14', border: '1px solid rgba(255,255,255,0.05)' }}>
          {demoState === "idle" && (
            <form onSubmit={handleDemoSubmit} className="relative max-w-[600px] mx-auto group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="font-sans text-lg text-white">I want to become a</span>
              </div>
              <input 
                type="text" 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={placeholderRoles[placeholderIdx]}
                className="w-full rounded-lg py-5 pl-[180px] pr-[160px] text-lg text-white font-sans focus:outline-none transition-all duration-1000"
                style={{ backgroundColor: '#0A0A0F', border: '1px solid rgba(57, 255, 20, 0.4)', boxShadow: '0 0 15px rgba(57, 255, 20, 0.2)' }}
                onFocus={(e) => { e.target.style.borderColor = '#39FF14'; e.target.style.boxShadow = '0 0 30px rgba(57, 255, 20, 0.4)'; e.target.style.animation = 'pulseBorder 2s infinite'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(57, 255, 20, 0.4)'; e.target.style.boxShadow = '0 0 15px rgba(57, 255, 20, 0.2)'; e.target.style.animation = 'none'; }}
              />
              <button type="submit" className="absolute inset-y-2 right-2 font-sans font-medium px-6 rounded transition-colors text-black" style={{ backgroundColor: '#39FF14' }}>
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
              <div className="flex items-start justify-between border-b pb-6 mb-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div>
                  <h3 className="font-heading text-2xl text-white mb-2">{inputValue} Roadmap</h3>
                  <p className="font-mono text-xs" style={{ color: '#39FF14' }}>✓ Built from 1,248 active listings</p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Est. Timeline</p>
                  <p className="font-mono text-lg text-white">12 Weeks</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="rounded p-4 flex justify-between items-center" style={{ backgroundColor: '#0A0A0F', borderLeft: '2px solid #39FF14' }}>
                  <span className="font-sans text-white"><span style={{ color: '#6BFF3C' }}>1.</span> Core Fundamentals</span>
                  <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>4 weeks</span>
                </div>
                <div className="rounded p-4 flex justify-between items-center" style={{ backgroundColor: '#0A0A0F', borderLeft: '2px solid #39FF14' }}>
                  <span className="font-sans text-white"><span style={{ color: '#6BFF3C' }}>2.</span> Advanced Implementations</span>
                  <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>5 weeks</span>
                </div>
              </div>
              <button onClick={() => setDemoState("idle")} className="text-sm font-sans transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>← Try another role</button>
            </div>
          )}
        </div>

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
    <section data-theme-light className="relative py-32 px-6" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Fix 5: Decorative background text — dark on cream */}
      <div className="bg-text-decoration top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(180px, 20vw, 300px)', color: 'rgba(10,10,15,0.025)' }}>
        POWER
      </div>
      <div className="max-w-[1000px] mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="font-mono text-xs tracking-[0.2em] mb-4" style={{ color: 'rgba(10,10,15,0.5)' }}>PLATFORM</p>
          <h2 className="font-heading font-bold text-4xl sm:text-5xl mb-6 leading-[1.1]" style={{ color: '#0A0A0F' }}>
            One System.<br/>Four Superpowers.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-white rounded-xl p-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
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
    <section className="relative py-32 px-6" style={{ backgroundColor: '#111114' }}>
      {/* Fix 5: Decorative background text */}
      <div className="bg-text-decoration top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(180px, 22vw, 300px)', color: 'rgba(255,255,255,0.02)' }}>
        JOURNEY
      </div>
      <div className="max-w-[800px] mx-auto relative z-10">
        <Reveal>
          <h2 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-6 leading-[1.1]">
            From "I Don't Know Where to Start" to Career-Ready.
          </h2>
          <p className="font-mono text-sm mb-16" style={{ color: 'rgba(255,255,255,0.5)' }}>Four Steps. Real Timeline.</p>
        </Reveal>

        <div className="space-y-12">
          {steps.map((step, i) => (
            <Reveal key={i} delay={0.1}>
              <div className="rounded-xl p-8 relative overflow-hidden group transition-colors" style={{ backgroundColor: '#1A1A1E', border: '1px solid rgba(255,255,255,0.05)' }}>
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
        <section data-theme-light className="relative py-32 px-6" style={{ backgroundColor: '#FAFAF7' }}>
            <div className="max-w-[1000px] mx-auto relative z-10">
                <Reveal>
                    <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-12 text-center" style={{ color: '#1A1A1A' }}>
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
                <div className="flex justify-around text-center border-t py-8" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                    <div>
                        <p className="font-mono text-3xl font-bold" style={{ color: '#1A1A1A' }}>1,248</p>
                        <p className="font-sans text-xs uppercase tracking-widest mt-2" style={{ color: '#666' }}>Active Users</p>
                    </div>
                    <div>
                        <p className="font-mono text-3xl font-bold" style={{ color: '#1A1A1A' }}>8,421</p>
                        <p className="font-sans text-xs uppercase tracking-widest mt-2" style={{ color: '#666' }}>Projects Shipped</p>
                    </div>
                    <div>
                        <p className="font-mono text-3xl font-bold" style={{ color: '#1A1A1A' }}>492</p>
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
        <section className="relative py-32 px-6 overflow-hidden" style={{ backgroundColor: '#0E0A0A' }}>
           <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at top right, rgba(255,0,0,0.1) 0%, transparent 60%)' }} />
           <div className="max-w-[700px] mx-auto text-center relative z-10">
              <p className="font-mono text-sm tracking-widest mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>YOUR TARGET DATE</p>
              <h2 className="font-mono text-5xl sm:text-7xl font-bold mb-12" style={{ color: '#FF6B35' }}>
                  128<span className="text-2xl text-white/50">d</span> 14<span className="text-2xl text-white/50">h</span> 42<span className="text-2xl text-white/50">m</span>
              </h2>
              <div className="text-left bg-black/40 p-6 rounded-xl border mb-10" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
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
        <section data-theme-light className="relative py-32 px-6" style={{ backgroundColor: '#F8F8F6' }}>
            <div className="max-w-[1000px] mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h2 className="font-heading font-bold text-4xl" style={{ color: '#1A1A1A' }}>Built On Transparency.</h2>
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
        <section className="relative py-32 px-6" style={{ backgroundColor: '#0C0A14' }}>
            <div className="max-w-[800px] mx-auto text-center relative z-10">
                <h2 className="font-heading font-bold text-4xl text-white mb-12">Level Up In Real Life.</h2>
                
                <div className="bg-black/40 rounded-xl p-8 border mb-10 text-left" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
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
        <section className="relative py-40 px-6" style={{ backgroundColor: '#080808' }}>
            {/* Fix 5: Decorative background text */}
            <div className="bg-text-decoration top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 'clamp(180px, 22vw, 350px)', color: 'rgba(255,255,255,0.02)' }}>
              PURPOSE
            </div>
            <div className="max-w-[800px] mx-auto text-center relative z-10">
                 <p className="font-sans text-2xl sm:text-3xl leading-relaxed mb-4" style={{ color: '#F5F2EB' }}>For the student from Nagpur.</p>
                 <p className="font-sans text-2xl sm:text-3xl leading-relaxed mb-4" style={{ color: '#888888' }}>For the developer from Patna.</p>
                 <p className="font-sans text-2xl sm:text-3xl leading-relaxed mb-16" style={{ color: '#F5F2EB' }}>For the first-generation engineer.</p>
                 
                 <p className="font-sans text-3xl sm:text-4xl font-medium mb-16" style={{ color: '#F5F2EB' }}>
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
        <section className="relative py-32 px-6" style={{ backgroundColor: '#080C18' }}>
            <div className="max-w-[1000px] mx-auto text-center relative z-10">
                <h2 className="font-heading font-bold text-4xl text-white mb-16">Invest In Your Reality.</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Free */}
                    <div className="p-8 rounded-xl border" style={{ borderColor: 'rgba(148, 163, 184, 0.4)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <h3 className="font-sans font-bold text-xl mb-2 text-white">Free</h3>
                        <p className="font-mono text-3xl mb-6 text-white">₹0</p>
                        <p className="text-sm mb-6 text-left" style={{ color: '#94A3B8' }}>Basic roadmaps and access to the community forum.</p>
                        <button className="w-full py-3 rounded text-sm font-bold border" style={{ borderColor: '#94A3B8', color: '#94A3B8' }}>Start Free</button>
                    </div>
                    {/* Premium */}
                    <div className="p-8 rounded-xl border relative transform md:-translate-y-4" style={{ borderColor: '#39FF14', backgroundColor: 'rgba(57, 255, 20, 0.05)', boxShadow: '0 0 20px rgba(57, 255, 20, 0.1)' }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-[#39FF14] text-black">Most Popular</div>
                        <h3 className="font-sans font-bold text-xl mb-2 text-white">Premium</h3>
                        <p className="font-mono text-3xl mb-6 text-white">₹499<span className="text-sm text-gray-400">/mo</span></p>
                        <p className="text-sm mb-6 text-left text-white/80">Verifiable certificates, AI reviews, and Gamification. <br/><br/> <span className="font-mono text-xs" style={{ color: '#39FF14' }}>= ₹16/day</span> <br/> <span className="font-sans" style={{ color: '#F5A623' }}>₹1.8 LPA avg uplift</span></p>
                        <button className="w-full py-3 rounded text-sm font-bold text-black" style={{ backgroundColor: '#39FF14' }}>Upgrade Now</button>
                    </div>
                    {/* Enterprise */}
                    <div className="p-8 rounded-xl border" style={{ borderColor: 'rgba(245, 166, 35, 0.4)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
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
        <section className="bg-bg-dark py-32 px-6 flex flex-col items-center justify-center text-center relative" style={{ backgroundColor: '#0A0A0F' }}>
            <h2 className="font-heading font-bold text-5xl sm:text-7xl mb-10 leading-[1.1]">
                <span className="block" style={{ color: '#F5F5F5' }}>Wake Up Tomorrow</span>
                <span className="block" style={{ color: '#00D4FF' }}>Knowing Exactly</span>
                <span className="block" style={{ color: '#39FF14' }}>What to Do Next.</span>
            </h2>
            
             <button className="font-sans font-bold text-xl px-16 py-6 rounded transition-transform hover:scale-105 flex items-center justify-center mb-8 text-black" style={{ backgroundColor: '#39FF14', boxShadow: '0 0 40px rgba(57, 255, 20, 0.3)' }}>
              Get My Free Pick-ax →
            </button>
            
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

      <Footer />
    </div>
  );
};

export default HomePage;
