import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faArrowRight, faArrowLeft, faKey } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [otpStep, setOtpStep] = useState('email'); // 'email' or 'verify'
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { login, sendLoginOTP, verifyLoginOTP } = useAuth();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await sendLoginOTP(email);
      setOtpStep('verify');
      setCountdown(60);
    } catch (err) {
      if (err.waitTime) {
        setCountdown(err.waitTime);
      }
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await verifyLoginOTP(email, otp);
      navigate('/dashboard');
    } catch (err) {
      if (err.attemptsRemaining !== undefined) {
        setError(`${err.message}. ${err.attemptsRemaining} attempts remaining.`);
      } else {
        setError(err.message || 'Verification failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setError('');
    setOtp('');
    
    try {
      await sendLoginOTP(email);
      setCountdown(60);
    } catch (err) {
      if (err.waitTime) {
        setCountdown(err.waitTime);
      }
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const resetToEmail = () => {
    setOtpStep('email');
    setOtp('');
    setError('');
  };

  const switchLoginMethod = (method) => {
    setLoginMethod(method);
    setOtpStep('email');
    setError('');
    setOtp('');
  };

  return (
    <main className="min-h-screen flex selection:bg-primary selection:text-black">
      {/* Left Side - Brand */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-bg-surface border-r border-border flex-col justify-center px-16 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-tech-auth" />
        </div>

        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <Link to="/" className="font-heading font-bold text-3xl text-text-main inline-block mb-8">
            <span className="text-primary">&lt;</span>
            CodeLearnn
            <span className="text-secondary">/&gt;</span>
          </Link>

          {/* Tagline */}
          <h1 className="text-h2 text-text-main mb-6">
            Learn like an engineer,<br />
            <span className="text-gradient-primary">not like a consumer.</span>
          </h1>

          <p className="text-body text-text-muted mb-8">
            Structure your learning. Understand deeply. Build real skills with the 
            Learning Operating System for developers.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              'Structured learning paths',
              'Interactive visualizations',
              'AI-powered tutorial analysis',
              'Career guidance'
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 text-text-muted"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-bg-base"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="font-heading font-bold text-2xl text-text-main inline-block">
              <span className="text-primary">&lt;</span>
              CodeLearnn
              <span className="text-secondary">/&gt;</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-h3 text-text-main mb-2">Welcome back</h2>
            <p className="text-text-muted">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-primary-glow transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-bg-surface rounded-lg border border-border">
            <button
              type="button"
              onClick={() => switchLoginMethod('password')}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'password'
                  ? 'bg-primary text-black shadow-lg'
                  : 'text-text-muted hover:text-text-main hover:bg-bg-elevated'
              }`}
            >
              <FontAwesomeIcon icon={faLock} className="mr-2" />
              Password
            </button>
            <button
              type="button"
              onClick={() => switchLoginMethod('otp')}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'otp'
                  ? 'bg-primary text-black shadow-lg'
                  : 'text-text-muted hover:text-text-main hover:bg-bg-elevated'
              }`}
            >
              <FontAwesomeIcon icon={faKey} className="mr-2" />
              Email OTP
            </button>
          </div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-danger/10 border border-danger/30 text-danger text-sm p-4 rounded-lg mb-6"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loginMethod === 'password' ? (
              /* Password Login Form */
              <motion.form
                key="password-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handlePasswordLogin}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label className="block text-sm text-text-muted mb-2">Email</label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faEnvelope} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-text-muted">Password</label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-glow transition-colors">
                      Forgot password?
                    </Link>
                  </div>
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
                      className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                      required
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_var(--primary-glow)] hover:shadow-[0_0_30px_-5px_var(--primary-glow)]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <>
                      Sign in
                      <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : otpStep === 'email' ? (
              /* OTP - Email Step */
              <motion.form
                key="otp-email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP}
                className="space-y-5"
              >
                <div className="text-center mb-4">
                  <p className="text-text-muted text-sm">
                    We'll send a verification code to your email
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-text-muted mb-2">Email</label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faEnvelope} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                      required
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || countdown > 0}
                  className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_var(--primary-glow)] hover:shadow-[0_0_30px_-5px_var(--primary-glow)]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending code...
                    </span>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    <>
                      Send verification code
                      <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              /* OTP - Verify Step */
              <motion.form
                key="otp-verify-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-5"
              >
                <div className="text-center mb-4">
                  <p className="text-text-muted text-sm">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-primary font-medium">{email}</p>
                </div>

                {/* OTP Input */}
                <div>
                  <label className="block text-sm text-text-muted mb-2">Verification Code</label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faKey} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                    />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim text-center text-xl tracking-[0.5em] font-mono"
                      required
                      autoComplete="one-time-code"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading || isResending || otp.length !== 6}
                    className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_var(--primary-glow)] hover:shadow-[0_0_30px_-5px_var(--primary-glow)]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      <>
                        Verify & Sign in
                        <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={resetToEmail}
                      className="text-sm text-text-muted hover:text-text-main transition-colors flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faArrowLeft} />
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={countdown > 0 || isLoading || isResending}
                      className="text-sm text-primary hover:text-primary-glow transition-colors disabled:text-text-dim disabled:cursor-not-allowed"
                    >
                      {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-dim text-sm">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <a 
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
              className="btn-secondary py-3 flex items-center justify-center gap-2 hover:bg-bg-elevated hover:text-main border-border text-text-muted transition-colors"
            >
              <FontAwesomeIcon icon={faGoogle} />
              Google
            </a>
            <button 
              disabled
              className="btn-secondary py-3 flex items-center justify-center gap-2 hover:bg-bg-elevated hover:text-main border-border text-text-muted transition-colors opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              <FontAwesomeIcon icon={faGithub} />
              GitHub
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
};

export default LoginPage;
