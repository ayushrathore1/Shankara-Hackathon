import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const FlowLandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    sessionStorage.setItem('medhaFlowStarted', '1');
    if (isAuthenticated) {
      // Already signed in — go to degree picker
      navigate('/name');
    } else {
      // Not signed in — send to login, then redirect back
      sessionStorage.setItem('medhaFlowReturn', '/name');
      navigate('/login');
    }
  };

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-2xl relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-10"
        >
          <span className="text-primary font-bold text-sm tracking-wider">MEDHA</span>
          <span className="text-text-dim text-xs">•</span>
          <span className="text-text-muted text-xs">Find Your Path. Own Your Future.</span>
        </motion.div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-text-main leading-tight mb-6">
          You don't know what career fits you.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Find out in 5 minutes.
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-text-muted text-lg sm:text-xl leading-relaxed mb-12 max-w-xl mx-auto">
          Answer 5 questions honestly. Get 3 careers matched to how you actually think and work.
          See what that life looks like before you commit to it.
        </p>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          className="px-8 py-4 bg-primary hover:bg-primary/90 text-bg-base font-bold text-lg rounded-xl transition-all shadow-xl shadow-primary/20"
        >
          {isAuthenticated ? 'Find My Career Path →' : 'Sign In & Find My Career Path →'}
        </motion.button>

        {/* Footer link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16"
        >
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="text-text-dim text-sm hover:text-text-muted transition-colors"
          >
            Already have an account? Explore all features →
          </button>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default FlowLandingPage;
