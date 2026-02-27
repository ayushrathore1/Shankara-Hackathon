import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { authAPI } from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-tech-dashboard pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors mb-8"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Back to Sign In
        </Link>

        <div className="card-bento p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-text-main">
              <span className="text-primary">&lt;</span>Medha<span className="text-secondary">/&gt;</span>
            </h1>
          </div>

          {sent ? (
            /* Success state */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-text-main mb-3">Check Your Email</h2>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                If an account exists with <strong className="text-text-main">{email}</strong>, we've sent a password reset link. It expires in 30 minutes.
              </p>
              <p className="text-xs text-text-dim mb-6">
                Don't see it? Check your spam folder.
              </p>
              <Link
                to="/login"
                className="btn-primary w-full py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                Return to Sign In
              </Link>
            </motion.div>
          ) : (
            /* Form state */
            <>
              <h2 className="text-xl font-bold text-text-main text-center mb-2">
                Forgot Password?
              </h2>
              <p className="text-sm text-text-muted text-center mb-8">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-sm"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-main placeholder-text-dim text-sm focus:border-primary/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
};

export default ForgotPasswordPage;
