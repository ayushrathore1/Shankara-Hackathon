import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheckCircle, faSpinner, faEye, faEyeSlash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await authAPI.resetPassword(token, password);

      // Auto-login: store the token and user data
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          updateUser(res.data.user);
        }
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
        <div className="card-bento p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-text-main">
              <span className="text-primary">&lt;</span>CodeLearnn<span className="text-secondary">/&gt;</span>
            </h1>
          </div>

          {success ? (
            /* Success state */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-text-main mb-3">Password Reset!</h2>
              <p className="text-sm text-text-muted mb-4">
                Your password has been updated successfully. Redirecting to dashboard...
              </p>
              <div className="flex items-center justify-center gap-2 text-primary text-sm">
                <FontAwesomeIcon icon={faSpinner} spin />
                Redirecting...
              </div>
            </motion.div>
          ) : (
            /* Form state */
            <>
              <h2 className="text-xl font-bold text-text-main text-center mb-2">
                Set New Password
              </h2>
              <p className="text-sm text-text-muted text-center mb-8">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-sm"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="w-full pl-11 pr-12 py-3 bg-bg-elevated border border-border rounded-xl text-text-main placeholder-text-dim text-sm focus:border-primary/50 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-sm"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      minLength={6}
                      className="w-full pl-11 pr-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-main placeholder-text-dim text-sm focus:border-primary/50 focus:outline-none transition-colors"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                      Passwords don't match
                    </p>
                  )}
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
                  disabled={isLoading || !password || !confirmPassword}
                  className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-xs text-text-muted hover:text-primary transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
};

export default ResetPasswordPage;
