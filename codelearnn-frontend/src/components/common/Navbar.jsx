import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOverLight, setIsOverLight] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Combined scroll handler with RAF throttle
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20);
        const lightSections = document.querySelectorAll('[data-theme-light]');
        const navbarBottom = 80;
        let overLight = false;
        for (const section of lightSections) {
          const rect = section.getBoundingClientRect();
          if (rect.top < navbarBottom && rect.bottom > 0) {
            overLight = true;
            break;
          }
        }
        setIsOverLight(overLight);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { path: "/join-waitlist", label: "Dashboard" },
    { path: "/join-waitlist", label: "Career Discovery" },
    { path: "/join-waitlist", label: "AI Mentor" },
    { path: "/join-waitlist", label: "Learning Plan" },
  ];

  // Desktop: transparent → blur on scroll, adapts over light sections
  const navBg = isScrolled
    ? isOverLight
      ? "bg-[#F5F0E8]/90 backdrop-blur-md border-b border-[#e0dbd0]"
      : "bg-bg-dark/80 backdrop-blur-md border-b border-glass-border"
    : "bg-transparent";

  const textColor = isOverLight && isScrolled ? "text-[#1A1A1A]" : "text-white";
  const mutedColor = isOverLight && isScrolled ? "text-[#666]" : "text-text-muted-dark";

  /* ── Asymmetric hamburger icon ── */
  const HamburgerIcon = () => (
    <div className="flex flex-col items-end gap-[5px]">
      <div className="w-6 h-[2px] bg-white rounded-full" />
      <div className="w-4 h-[2px] bg-white rounded-full" />
    </div>
  );

  const CloseIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 ${navBg}`}>
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 h-16 sm:h-20 flex justify-between items-center">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-0.5 group relative z-[1001]">
          <span className={`font-mono ${mutedColor} group-hover:${textColor} transition-colors`}>&lt;</span>
          <span className={`font-mono ${textColor} text-lg font-medium transition-colors`}>Medha</span>
          <span className={`font-mono ${mutedColor} group-hover:${textColor} transition-colors`}>/&gt;</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`text-sm font-sans transition-colors ${mutedColor} hover:${textColor}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth / CTA */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className={`text-sm font-sans ${mutedColor} hover:text-red-400 transition-colors cursor-pointer`}
            >
              Logout
            </button>
          )}
          <button
            onClick={() => navigate("/join-waitlist")}
            className={`text-sm font-sans ${mutedColor} hover:${textColor} transition-colors cursor-pointer`}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/join-waitlist")}
            className={`group flex items-center gap-2 ${isOverLight && isScrolled ? 'bg-[#0A0A0F] text-white hover:bg-[#1a1a2e]' : 'bg-text-on-dark text-bg-dark hover:bg-white'} px-5 py-2.5 rounded transition-colors font-sans text-sm font-medium cursor-pointer`}
          >
            Join Waitlist
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="md:hidden p-2 relative z-[1001] cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* ═══ MOBILE SLIDE-IN PANEL ═══ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-[999] bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-in panel from right — 85% width */}
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="md:hidden fixed top-0 right-0 bottom-0 z-[1000] w-[85%] max-w-[360px] flex flex-col"
              style={{ backgroundColor: '#0A0A14' }}
            >
              {/* Panel header with close button */}
              <div className="flex items-center justify-end px-5 h-16">
                <button
                  className="p-2 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Nav links — large serif, generous spacing */}
              <div className="flex-1 flex flex-col px-8 pt-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-4 group"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span className="font-heading text-xl text-white/80 group-hover:text-white transition-colors">
                        {link.label}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm" style={{ color: '#39FF14' }}>→</span>
                    </Link>
                  </motion.div>
                ))}

                {/* Sign In */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate("/join-waitlist"); }}
                    className="flex items-center justify-between py-4 w-full group cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="font-heading text-xl text-white/60 group-hover:text-white transition-colors">Sign In</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm" style={{ color: '#39FF14' }}>→</span>
                  </button>
                </motion.div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom actions */}
                <div className="pb-10 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); navigate("/join-waitlist"); }}
                      className="w-full py-4 rounded-lg font-sans text-[15px] font-bold text-[#0A0A0F] cursor-pointer flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: '#39FF14',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px rgba(57,255,20,0.15)'
                      }}
                    >
                      Join Waitlist <span>→</span>
                    </button>
                  </motion.div>

                  {isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                        className="w-full py-3 text-center font-sans text-sm text-red-400/80 hover:text-red-400 cursor-pointer transition-colors"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
