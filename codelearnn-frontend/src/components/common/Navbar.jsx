import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faUser,
  faCrown,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ProModal from "../modals/ProModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Main navigation links — Core features
  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/career-discovery", label: "Career Discovery" },
    { path: "/learning-paths", label: "Learning Plan" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-bg-base/90 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 h-[72px] flex justify-between items-center">
          {/* Logo - Links to dashboard when authenticated, home when not */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="font-heading font-bold text-2xl text-text-main hover:text-primary transition-colors"
            >
              <span className="text-primary">&lt;</span>
              <span className="text-metallic">Medha</span>
              <span className="text-secondary">/&gt;</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <NavLink
                  to={link.path}
                  className={({ isActive }) => `
                    nav-link relative font-medium text-sm tracking-wide
                    ${isActive ? "text-primary" : "text-text-muted hover:text-text-main transition-colors"}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute -bottom-1 left-0 right-0 h-px bg-primary shadow-[0_0_10px_var(--primary-glow)]"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Right Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:flex items-center gap-3"
          >
            {isAuthenticated ? (
              <>
                {/* Upgrade Button */}
                {user?.plan !== "pro" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProModalOpen(true)}
                    className="btn-primary text-xs py-2 px-4 h-9 uppercase tracking-wider"
                  >
                    <FontAwesomeIcon icon={faCrown} className="mr-2" />
                    Pro
                  </motion.button>
                )}

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm"
                  >
                    <FontAwesomeIcon icon={faUser} />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-bg-surface border border-border rounded-xl shadow-surface overflow-hidden py-2"
                      >
                        <div className="px-4 py-3 border-b border-border bg-bg-elevated/30">
                          <p className="text-sm font-medium text-text-main truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {user?.email}
                          </p>
                        </div>

                        <div className="py-2">
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-bg-elevated hover:text-primary transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <div className="w-5 flex justify-center">
                              <FontAwesomeIcon icon={faUser} />
                            </div>
                            Profile
                          </Link>
                        </div>

                        <div className="border-t border-border py-2 px-4">
                          <p className="text-[10px] font-mono text-text-dim mb-2 uppercase tracking-wider">
                            Theme
                          </p>
                          <div className="space-y-1">
                            {themes.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                                  theme === t.id
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-text-muted hover:bg-bg-elevated border border-transparent"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{t.icon}</span>
                                  {t.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-border pt-2">
                          <button
                            onClick={logout}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <div className="w-5 flex justify-center">
                              <FontAwesomeIcon icon={faSignOutAlt} />
                            </div>
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  className="text-sm text-text-muted hover:text-primary transition-colors font-medium"
                >
                  Sign In
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/signup')}
                  className="btn-primary text-sm h-10 px-6"
                >
                  Sign Up
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-text-muted text-xl z-[101] cursor-pointer hover:text-primary transition-colors"
            onClick={toggleMenu}
          >
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
          </button>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                  onClick={() => setIsOpen(false)}
                />

                <motion.nav
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="fixed top-0 right-0 w-[min(85vw,360px)] h-screen bg-bg-surface border-l border-border z-50 lg:hidden flex flex-col shadow-2xl"
                >
                  <div className="p-6 pt-24 flex flex-col gap-2 overflow-y-auto flex-1">
                    {navLinks.map((link) => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) => `
                          block py-3 px-4 rounded-lg font-medium transition-all
                          ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-text-muted hover:bg-bg-elevated hover:text-text-main"}
                        `}
                      >
                        {link.label}
                      </NavLink>
                    ))}

                    {/* Theme Switcher Mobile */}
                    <div className="mt-8 mb-6 p-4 bg-bg-elevated/50 rounded-xl border border-border">
                      <p className="text-xs font-mono text-text-dim mb-3 uppercase tracking-wider">
                        Appearance
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {themes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                              theme === t.id
                                ? "bg-primary/10 border-primary/50 text-primary"
                                : "border-transparent bg-bg-surface text-text-muted hover:text-text-main"
                            }`}
                          >
                            <span className="text-xl">{t.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-border bg-bg-elevated/30">
                    {isAuthenticated ? (
                      <div className="flex flex-col gap-3">
                        {user?.plan !== "pro" && (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              setIsProModalOpen(true);
                            }}
                            className="btn-primary w-full text-center py-3"
                          >
                            <FontAwesomeIcon icon={faCrown} className="mr-2" />{" "}
                            Upgrade to Pro
                          </button>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setIsOpen(false)}
                          className="btn-secondary w-full text-center py-3"
                        >
                          <FontAwesomeIcon icon={faUser} className="mr-2" />{" "}
                          Profile
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full text-center text-red-500 py-3 text-sm hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Link
                          to="/signup"
                          onClick={() => setIsOpen(false)}
                          className="btn-primary w-full text-center py-3"
                        >
                          Sign Up
                        </Link>
                        <Link
                          to="/login"
                          onClick={() => setIsOpen(false)}
                          className="btn-secondary w-full text-center py-3"
                        >
                          Sign In
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.nav>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Pro Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
