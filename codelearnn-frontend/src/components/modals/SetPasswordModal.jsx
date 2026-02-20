import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShieldAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const SetPasswordModal = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { setUserPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await setUserPassword(password);
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    // Store dismissal in sessionStorage so it doesn't nag again this session
    sessionStorage.setItem('passwordPromptDismissed', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-text-dim hover:text-text-main transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faShieldAlt} className="text-primary text-2xl" />
              </div>
              <h3 className="text-h4 text-text-main mb-2">Password set!</h3>
              <p className="text-text-muted text-sm">
                You can now log in with your email and password.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faLock} className="text-primary text-xl" />
                </div>
                <h3 className="text-h4 text-text-main mb-2">Set a password</h3>
                <p className="text-text-muted text-sm">
                  Add a password so you can log in with email and password next time. This is optional.
                </p>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-lg mb-4"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password */}
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">Password</label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faLock} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pl-11 bg-bg-elevated border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-text-dim mt-1">Minimum 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">Confirm password</label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faLock} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pl-11 bg-bg-elevated border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Setting password...
                      </span>
                    ) : (
                      'Set password'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full text-center text-sm text-text-dim hover:text-text-muted transition-colors py-2"
                  >
                    Maybe later
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SetPasswordModal;
