import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, 
  faBookOpen, 
  faChartLine, 
  faBrain,
  faRocket,
  faPlay,
  faCode,
  faGraduationCap,
  faLayerGroup,
  faCheck,
  faBolt,
  faXmark,
  faCheckCircle,
  faClock,
  faUsers,
  faBriefcase
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube, faLinkedin} from '@fortawesome/free-brands-svg-icons';
import SEO from '../components/common/SEO';

const HomePage = () => {
  const navigate = useNavigate();

  // Check for reduced motion preference (accessibility + performance)
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  // Lighter animations for mobile and reduced motion
  const fadeInUp = prefersReducedMotion || isMobile 
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? 0.05 : 0.1,
        delayChildren: isMobile ? 0.1 : 0.2
      }
    }
  };

  const features = [
    {
      icon: faBookOpen,
      title: '🗂️ Learning Vault',
      description: 'Structured learning paths that engineering recruiters actually respect.',
      instead: [
        '147 bookmarked YouTube videos you\'ll never watch',
        '12 half-finished Udemy courses',
        'Zero idea what to learn next'
      ],
      youGet: [
        'Step-by-step roadmaps validated by industry professionals',
        'No duplicated or outdated content—AI filters the noise',
        'Clear progression from "complete beginner" to "hire-ready"'
      ],
      outcome: 'Know exactly what to learn today to land your dream role tomorrow.',
      to: '/vault',
      color: 'primary'
    },
    {
      icon: faBrain,
      title: '🧠 Visual Learning Engine',
      description: 'Understand complex engineering concepts in minutes, not months.',
      instead: [
        'Confusing text-heavy documentation',
        'Abstract jargon that makes no sense',
        'Copy-paste without understanding'
      ],
      youGet: [
        'The mental models behind the code',
        'How systems connect and communicate',
        'Why things work, not just how to copy-paste'
      ],
      outcome: 'Ace technical interviews by understanding fundamentals deeply.',
      to: '/visualizations',
      color: 'secondary'
    },
    {
      icon: faYoutube,
      title: '🎯 AI Tutorial Evaluator',
      description: 'Stop wasting 40 hours on outdated tutorials.',
      instead: [
        'Guessing if a tutorial is worth your time',
        'Watching 3 hours to realize it\'s outdated',
        'No idea about prerequisites'
      ],
      youGet: [
        'Quality score (is this worth your time?)',
        'Difficulty level & content freshness',
        'Key topics covered & prerequisites needed'
      ],
      outcome: 'Learn from the top 1% of content, skip the rest.',
      to: '/analyzer',
      color: 'warning'
    },
    {
      icon: faChartLine,
      title: '🚀 Career Intelligence System',
      description: 'From "I want to code" to "I got the offer."',
      instead: [
        'No idea what roles exist',
        'Learning random skills that don\'t matter',
        'Confused about salary expectations'
      ],
      youGet: [
        'What roles exist and what each actually does',
        'What skills you need for each role',
        'What companies are hiring & salary to expect'
      ],
      outcome: 'Learn skills that companies pay for, not just "resume fillers."',
      to: '/career',
      color: 'success'
    }
  ];

  const stats = [
    { value: '120+', label: 'Career Paths Structured' },
    { value: '10,000+', label: 'Tutorials Validated' },
    { value: '50+', label: 'Visual Concept Lessons' },
  ];

  const comparisonData = [
    { traditional: 'Random tutorials, no structure', medha: 'Career-aligned learning paths' },
    { traditional: 'Certificates you can\'t use', medha: 'Projects that prove competence' },
    { traditional: 'Learn alone, fail alone', medha: 'AI-guided, outcome-focused' },
    { traditional: 'No idea if content is good', medha: 'Every resource AI-validated' },
    { traditional: 'Confusing jargon everywhere', medha: 'Visual understanding first' },
    { traditional: '"Complete the course"', medha: '"Build something real"' },
  ];

  return (
    <main className="min-h-screen selection:bg-primary selection:text-black">
      <SEO 
        title="Home"
        description="The Learning Operating System for Engineering Students. Stop learning random tutorials and start building a real career with structured roadmaps and AI guidance."
        keywords="coding roadmap, engineering career, learn to code, full stack development, system design, data structures"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Medha",
          "url": "https://medha.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://medha.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION - ABOVE THE FOLD
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="min-h-screen flex items-center pt-28 pb-20 px-6 relative overflow-hidden">
        {/* High-tech background */}
        <div className="absolute inset-0 bg-tech-hero pointer-events-none z-0" />
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] pointer-events-none" />

        {/* Static Tilted Logos Background - hidden on mobile for performance */}
        <div className="hidden md:block absolute inset-0 pointer-events-none select-none z-0">
          {/* LinkedIn */}
          <motion.div
            initial={{ opacity: 0, rotate: -12 }}
            animate={{ opacity: 0.3, rotate: -12 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-[40%] left-[45%] p-5 bg-bg-elevated/10 backdrop-blur-[2px] rounded-2xl border border-white/5 shadow-xl"
          >
            <div className="flex gap-1 items-center font-heading font-bold text-white/80 tracking-wider">
                <FontAwesomeIcon icon={faLinkedin} className="text-3xl text-blue-500/80 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
                <span className="text-xs opacity-60">LinkedIn</span>
            </div>
          </motion.div>

          {/* YouTube */}
          <motion.div
            initial={{ opacity: 0, rotate: 12 }}
            animate={{ opacity: 0.3, rotate: 12 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            className="absolute top-[10%] right-[5%] p-4 bg-bg-elevated/10 backdrop-blur-[2px] rounded-2xl border border-white/5 shadow-xl"
          >
            <FontAwesomeIcon icon={faYoutube} className="text-4xl text-red-500/80 drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
          </motion.div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Tag */}
              <motion.div variants={fadeInUp} className="mb-8 relative z-10">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium tracking-wide">
                  <FontAwesomeIcon icon={faBolt} className="text-yellow-400" />
                  <span className="text-metallic">Medha OS 2.0 • Early Access Open</span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1 
                variants={fadeInUp}
                className="text-hero mb-6 tracking-tight"
              >
                Stop Learning Random Tutorials.<br />
                <span className="text-gradient-primary">Start Building a Real Engineering Career.</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p 
                variants={fadeInUp}
                className="text-body-lg text-text-muted max-w-xl mb-8 font-light"
              >
                The only learning OS that transforms scattered YouTube videos and courses into structured, career-ready roadmaps—validated by AI, built for engineering students.
              </motion.p>

              {/* CTAs */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap gap-4 mb-6"
              >
                <button 
                  onClick={() => navigate('/signup')}
                  className="btn-primary px-6 py-3 shadow-[0_0_40px_-5px_var(--primary-glow)] hover:shadow-[0_0_60px_-10px_var(--primary-glow)]"
                >
                  <FontAwesomeIcon icon={faRocket} className="text-sm mr-2" />
                  Get Started Free →
                </button>
                <button 
                  onClick={() => navigate('/vault')}
                  className="btn-secondary group"
                >
                  <FontAwesomeIcon icon={faBookOpen} className="text-sm mr-2" />
                  Explore Platform
                </button>
              </motion.div>

              {/* Trust Line */}
              <motion.div variants={fadeInUp} className="flex items-center gap-4 text-xs text-text-dim flex-wrap">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary" />
                  Free to get started
                </span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="text-secondary" />
                  No credit card required
                </span>
              </motion.div>

              {/* Stats - Mobile only */}
              <motion.div 
                variants={fadeInUp}
                className="flex gap-8 mt-12 lg:hidden"
              >
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-2xl font-heading font-bold text-text-main">{stat.value}</div>
                    <div className="text-xs text-text-dim">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - Animated Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative card-bento p-1 bg-bg-surface/50 backdrop-blur-sm border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50 pointer-events-none" />
                
                <div className="bg-bg-elevated/50 rounded-xl p-6 relative overflow-hidden">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-border" />
                        <div className="w-2.5 h-2.5 rounded-full bg-border" />
                      </div>
                      <span className="text-xs text-text-dim font-mono">career_dashboard.tsx</span>
                    </div>
                    <div className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">v2.0</div>
                  </div>

                  {/* Bento Grid Mockup */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Path Card */}
                    <div className="card-bento p-5 bg-bg-surface border-border/40 hover:border-primary/50 transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FontAwesomeIcon icon={faCode} />
                        </div>
                        <div className="text-[10px] font-mono text-primary uppercase tracking-wider">Active</div>
                      </div>
                      <div className="text-sm font-medium text-text-main mb-1">Full Stack Dev</div>
                      <div className="h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3 group-hover:animate-pulse" />
                      </div>
                      <div className="text-[10px] text-text-dim mt-2">67% Complete</div>
                    </div>

                    {/* Stats Card */}
                    <div className="card-bento p-5 bg-bg-surface border-border/40 hover:border-secondary/50 transition-colors">
                      <div className="text-xs text-text-dim font-mono mb-2">XP GAINED</div>
                      <div className="text-3xl font-heading font-bold text-text-main mb-1">
                        2,450
                      </div>
                      <div className="text-xs text-secondary flex items-center gap-1">
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>+12% this week</span>
                      </div>
                    </div>

                    {/* Visual Card - Wide */}
                    <div className="col-span-2 card-bento p-4 flex items-center gap-4 bg-bg-surface border-border/40 hover:border-primary/50 transition-colors">
                      <div className="w-16 h-12 rounded bg-gradient-to-br from-secondary/20 to-primary/5 border border-white/5 flex items-center justify-center">
                        <FontAwesomeIcon icon={faPlay} className="text-text-main/70 text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-secondary font-mono mb-0.5">NEXT LESSON</div>
                        <div className="text-sm font-medium text-text-main">System Design Patterns</div>
                      </div>
                      <div className="ml-auto">
                        <FontAwesomeIcon icon={faArrowRight} className="text-text-dim text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Float Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary to-secondary opacity-20 blur-2xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED LEARNING GUIDE BANNER
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => navigate('/learning-guides/vibe-coding')}
            className="max-w-4xl mx-auto cursor-pointer group"
          >
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-bg-elevated/50 backdrop-blur-md p-8 md:p-10 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_60px_-10px_var(--primary-glow)]">
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">📖</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">Free Guide</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary">60 min read</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-text-main mb-1 group-hover:text-primary transition-colors">
                    The Vibe Coding Playbook
                  </h3>
                  <p className="text-text-muted text-sm">
                    Build anything with AI. No coding background needed. Copy-paste prompts, step-by-step deployment, and the exact workflow to go from idea to shipped product.
                  </p>
                </div>

                {/* CTA Arrow */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0 text-primary group-hover:translate-x-1 transition-transform">
                  <span className="text-sm font-medium">Read Now</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PROBLEM → SOLUTION BRIDGE
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="section px-6 border-t border-border/50 bg-bg-surface/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-h2 mb-6"
            >
              You're Not Lazy.<br />
              <span className="text-primary">The System Is Broken.</span>
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-body-lg text-text-muted mb-8"
            >
              <p className="mb-4">
                You watch tutorials. Bookmark courses. Follow roadmaps. But six months later, you still can't build the projects companies want to see.
              </p>
              <p className="text-xl font-medium text-text-main">
                Why? Because <span className="text-primary">content ≠ competence.</span>
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-bg-elevated/50 rounded-2xl p-8 border border-border text-left"
            >
              <p className="text-text-muted mb-6">
                Medha isn't another learning platform. It's the <span className="text-text-main font-medium">operating system</span> that finally connects:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faCheck} className="text-primary mt-1" />
                  <div>
                    <div className="font-medium text-text-main">What to learn</div>
                    <div className="text-sm text-text-muted">Curated paths aligned with real job roles</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faCheck} className="text-primary mt-1" />
                  <div>
                    <div className="font-medium text-text-main">How to learn it</div>
                    <div className="text-sm text-text-muted">Visual understanding, not rote memorization</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faCheck} className="text-primary mt-1" />
                  <div>
                    <div className="font-medium text-text-main">Proof you learned it</div>
                    <div className="text-sm text-text-muted">Validated projects, not certificates</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES SECTION - ONE SYSTEM, FOUR SUPERPOWERS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="section px-6 relative">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-h2 mb-4">
              One System.<br />
              <span className="text-gradient-primary">Four Superpowers.</span>
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-bento p-8 hover:-translate-y-1 transition-transform duration-300"
              >
                <h3 className="text-xl font-bold text-text-main mb-4">{feature.title}</h3>
                <p className="text-text-muted mb-6">{feature.description}</p>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Instead of */}
                  <div>
                    <div className="text-xs font-mono text-red-400 mb-3 uppercase tracking-wider">Instead of:</div>
                    <ul className="space-y-2">
                      {feature.instead.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-dim">
                          <FontAwesomeIcon icon={faXmark} className="text-red-400 mt-0.5 text-xs" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* You get */}
                  <div>
                    <div className="text-xs font-mono text-primary mb-3 uppercase tracking-wider">You get:</div>
                    <ul className="space-y-2">
                      {feature.youGet.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                          <FontAwesomeIcon icon={faCheck} className="text-primary mt-0.5 text-xs" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="text-xs font-mono text-primary mb-1">REAL OUTCOME:</div>
                  <p className="text-sm text-text-main font-medium">{feature.outcome}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="section px-6 border-t border-border/50 bg-bg-surface/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h2">
              How Medha <span className="text-primary">Actually Works</span>
            </h2>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-20 right-20 h-px bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20" />

            <div className="grid md:grid-cols-3 gap-12 relative">
              {[
                { step: '01', title: 'Define Your Goal', desc: 'Select a career path (Frontend, Backend, ML, DevOps, etc.) or analyze a specific resource you found online.', icon: faLayerGroup },
                { step: '02', title: 'Learn Systematically', desc: 'Follow structured learning sequences → Watch AI-validated tutorials → Understand concepts through visual stories → Track real progress.', icon: faBrain },
                { step: '03', title: 'Prove Your Skills', desc: 'Build portfolio projects that demonstrate mastery → Get feedback → Show proof-of-work to recruiters → Land interviews.', icon: faRocket },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center relative group"
                >
                  {/* Step Circle */}
                  <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-bg-base border border-border group-hover:border-primary/50 transition-colors flex items-center justify-center relative z-10 shadow-surface">
                    <FontAwesomeIcon icon={item.icon} className="text-3xl text-text-muted group-hover:text-primary transition-colors" />
                  </div>

                  <div className="font-mono text-xs text-primary mb-3 uppercase tracking-wider">Step {item.step}</div>
                  <h3 className="text-h3 text-text-main mb-3">{item.title}</h3>
                  <p className="text-text-muted text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 border-y border-border/50 bg-bg-elevated/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-h3 text-text-main">Built by Students, For Students</h3>
          </div>
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
            {stats.map((stat, index) => (
              <div key={index} className="py-8 md:py-0 text-center">
                <div className="text-5xl md:text-6xl font-heading font-bold text-text-main mb-2 tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-sm font-mono text-text-muted uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY MEDHA (COMPARISON)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="section px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h2 mb-4">
              Why Every Other Learning Platform<br />
              <span className="text-primary">Fails You</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Comparison Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface/50">
              <div className="grid grid-cols-2">
                <div className="px-6 py-4 bg-bg-elevated/50 border-b border-r border-border text-sm font-mono text-text-dim uppercase tracking-wider">
                  Traditional Platforms
                </div>
                <div className="px-6 py-4 bg-primary/5 border-b border-border text-sm font-mono text-primary uppercase tracking-wider">
                  Medha OS
                </div>
              </div>
              {comparisonData.map((row, index) => (
                <div key={index} className="grid grid-cols-2">
                  <div className="px-6 py-4 border-b border-r border-border text-text-dim flex items-center gap-2">
                    <FontAwesomeIcon icon={faXmark} className="text-red-400 text-xs" />
                    <span>{row.traditional}</span>
                  </div>
                  <div className="px-6 py-4 border-b border-border text-text-main flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="text-primary text-xs" />
                    <span>{row.medha}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Supporting Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <p className="text-text-muted mb-6">
                Udemy gives you courses. YouTube gives you content. LinkedIn gives you job posts.<br />
                <span className="text-text-main font-medium">Nobody connects them.</span>
              </p>
              <p className="text-body-lg text-text-main font-medium">
                This isn't education. It's <span className="text-primary">career infrastructure.</span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY CHOOSE MEDHA
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 bg-primary/5 border-t border-b border-primary/10">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-h3 text-text-main mb-2">Why Choose Medha?</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: faGraduationCap, text: 'Structured learning paths aligned with real engineering careers' },
              { icon: faBolt, text: 'AI-powered content evaluation saves you hundreds of hours' },
              { icon: faUsers, text: 'Built by students, for students — your feedback shapes the product' },
              { icon: faBriefcase, text: 'Career intelligence to bridge the gap from learning to landing offers' },
            ].map((item, i) => (
              <div key={i} className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={item.icon} className="text-primary" />
                </div>
                <p className="text-sm text-text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA - SIGN UP
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="section px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-primary/5 radial-gradient" />
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-bento max-w-4xl mx-auto p-12 md:p-20 bg-bg-surface/50 backdrop-blur-md border-primary/20"
          >
            <h2 className="text-h1 mb-6">
              Ready to Stop Wandering and<br />
              <span className="text-primary">Start Building?</span>
            </h2>
            <p className="text-body-lg text-text-muted max-w-2xl mx-auto mb-10">
              Join engineering students who are done with random tutorials and ready for structured growth.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/signup')}
                className="btn-primary px-8 py-4 text-lg shadow-[0_0_40px_-5px_var(--primary-glow)] hover:shadow-[0_0_60px_-10px_var(--primary-glow)]"
              >
                <FontAwesomeIcon icon={faRocket} className="mr-2" />
                Create Free Account →
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-secondary px-8 py-4 text-lg"
              >
                Sign In
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-text-dim">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faCheck} className="text-primary" />
                No credit card needed
              </span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faCheck} className="text-primary" />
                Free to get started
              </span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faCheck} className="text-primary" />
                Cancel anytime
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
