import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOverLight, setIsOverLight] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Listen to scroll to add backdrop blur when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Detect when navbar overlaps light-background sections
  useEffect(() => {
    const checkLightSection = () => {
      const lightSections = document.querySelectorAll('[data-theme-light]');
      const navbarBottom = 80; // navbar height
      let overLight = false;
      lightSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < navbarBottom && rect.bottom > 0) {
          overLight = true;
        }
      });
      setIsOverLight(overLight);
    };
    window.addEventListener('scroll', checkLightSection, { passive: true });
    checkLightSection();
    return () => window.removeEventListener('scroll', checkLightSection);
  }, []);

  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/career-discovery", label: "Career Discovery" },
    { path: "/rag-mentor", label: "AI Mentor" },
    { path: "/learning-paths", label: "Learning Plan" },
  ];

  const navBg = isScrolled
    ? isOverLight
      ? "bg-[#F5F0E8]/90 backdrop-blur-md border-b border-[#e0dbd0]"
      : "bg-bg-dark/80 backdrop-blur-md border-b border-glass-border"
    : "bg-transparent py-2";

  const textColor = isOverLight && isScrolled ? "text-[#1A1A1A]" : "text-white";
  const mutedColor = isOverLight && isScrolled ? "text-[#666]" : "text-text-muted-dark";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-[1280px] mx-auto px-6 h-20 flex justify-between items-center">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-1 group">
          <span className={`font-mono ${mutedColor} group-hover:${textColor} transition-colors`}>&lt;</span>
          <span className={`font-mono ${textColor} text-lg font-medium transition-colors`}>Medha</span>
          <span className={`font-mono ${mutedColor} group-hover:${textColor} transition-colors`}>/&gt;</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `text-sm font-sans transition-colors ${
                  isActive
                    ? `${textColor} font-medium`
                    : `${mutedColor} hover:${textColor}`
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Auth / CTA Links */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigate("/login")}
            className={`text-sm font-sans ${mutedColor} hover:${textColor} transition-colors`}
          >
            Sign In
          </button>
          
          <button
            onClick={() => navigate("/signup")}
            className={`group flex items-center gap-2 ${isOverLight && isScrolled ? 'bg-[#0A0A0F] text-white hover:bg-[#1a1a2e]' : 'bg-text-on-dark text-bg-dark hover:bg-white'} px-5 py-2.5 rounded transition-colors font-sans text-sm font-medium`}
          >
            Get Started — Free
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button 
          className={`md:hidden ${textColor} p-2`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-bg-dark border-b border-glass-border overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-sans block ${
                      isActive ? "text-white" : "text-text-muted-dark"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <hr className="border-glass-border my-2" />
              <button
                onClick={() => { setIsMobileMenuOpen(false); navigate("/login"); }}
                className="text-sm font-sans text-left text-text-muted-dark"
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); navigate("/signup"); }}
                className="bg-white text-bg-dark px-4 py-2 mt-2 rounded font-sans text-sm font-medium w-full text-center flex items-center justify-center gap-2"
              >
                Get Started — Free →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
