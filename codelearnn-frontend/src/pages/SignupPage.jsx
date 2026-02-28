import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faArrowRight, faArrowLeft, faKey, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';
import { gamificationAPI } from '../services/api';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [step, setStep] = useState(1); // 1: name+email, 2: OTP verify, 3: set password
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const { register, verifyLoginOTP, setUserPassword, sendLoginOTP } = useAuth();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Register (send name + email, triggers OTP)
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register(name, email);
      setStep(2);
      setCountdown(60);
      setSuccessMsg('Verification code sent to your email!');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await verifyLoginOTP(email, otp);
      setStep(3);
      setSuccessMsg('Email verified! Now set your password.');

      // Track referral if ref code exists
      if (refCode) {
        try {
          await gamificationAPI.trackReferral(refCode);
        } catch (e) {
          // Non-critical — don't block signup
        }
      }
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

  // Step 3: Set password
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await setUserPassword(password);
      const returnTo = sessionStorage.getItem('medhaFlowReturn');
      if (returnTo) { sessionStorage.removeItem('medhaFlowReturn'); navigate(returnTo); }
      else navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setError('');

    try {
      await sendLoginOTP(email);
      setCountdown(60);
      setOtp('');
      setSuccessMsg('New verification code sent!');
    } catch (err) {
      if (err.waitTime) setCountdown(err.waitTime);
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Skip password (go directly to onboarding)
  const handleSkipPassword = () => {
    const returnTo = sessionStorage.getItem('medhaFlowReturn');
    if (returnTo) { sessionStorage.removeItem('medhaFlowReturn'); navigate(returnTo); }
    else navigate('/onboarding');
  };

  const benefits = [
    'Access structured learning paths',
    'Track your progress across paths',
    'Analyze unlimited YouTube tutorials',
    'Get personalized career guidance',
  ];

  const stepLabels = ['Details', 'Verify', 'Password'];

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
            Medha
            <span className="text-secondary">/&gt;</span>
          </Link>

          {/* Tagline */}
          <h1 className="text-h2 text-text-main mb-6">
            Start your<br />
            <span className="text-gradient-primary">learning journey</span>
          </h1>

          <p className="text-body text-text-muted mb-8">
            Join thousands of developers learning with structure, 
            visual understanding, and clear direction.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 text-text-muted"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="text-primary text-[10px]" />
                </div>
                <span>{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="mt-10 pt-8 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-bg-elevated border-2 border-bg-surface flex items-center justify-center text-xs text-text-dim"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-text-muted">
                <span className="text-text-main font-medium">1,000+</span> developers learning
              </p>
            </div>
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
              Medha
              <span className="text-secondary">/&gt;</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-h3 text-text-main mb-2">Create your account</h2>
            <p className="text-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary-glow transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {stepLabels.map((label, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step > index + 1
                    ? 'bg-primary text-black'
                    : step === index + 1
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-bg-surface text-text-dim border border-border'
                }`}>
                  {step > index + 1 ? (
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-xs hidden sm:inline ${
                  step === index + 1 ? 'text-primary font-medium' : 'text-text-dim'
                }`}>
                  {label}
                </span>
                {index < stepLabels.length - 1 && (
                  <div className={`w-8 h-px ${step > index + 1 ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
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

          {/* Success */}
          <AnimatePresence mode="wait">
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-primary/10 border border-primary/30 text-primary text-sm p-4 rounded-lg mb-6"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Signup — only show on step 1 */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
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

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-text-dim text-sm">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              /* Step 1: Name + Email */
              <motion.form
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegister}
                className="space-y-5"
              >
                {/* Name */}
                <div>
                  <label className="block text-sm text-text-muted mb-2">Full name</label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                      required
                    />
                  </div>
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

                {/* Terms */}
                <p className="text-xs text-text-dim">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" className="text-primary hover:text-primary-glow transition-colors">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-primary hover:text-primary-glow transition-colors">Privacy Policy</Link>.
                </p>

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
                      Sending verification code...
                    </span>
                  ) : (
                    <>
                      Continue with email
                      <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : step === 2 ? (
              /* Step 2: OTP Verification */
              <motion.form
                key="step-2"
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
                    disabled={isLoading || otp.length !== 6}
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
                        Verify email
                        <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtp(''); setError(''); setSuccessMsg(''); }}
                      className="text-sm text-text-muted hover:text-text-main transition-colors flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faArrowLeft} />
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={countdown > 0 || isLoading}
                      className="text-sm text-primary hover:text-primary-glow transition-colors disabled:text-text-dim disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              </motion.form>
            ) : (
              /* Step 3: Set Password */
              <motion.form
                key="step-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSetPassword}
                className="space-y-5"
              >
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <FontAwesomeIcon icon={faCheck} className="text-primary text-xl" />
                  </div>
                  <p className="text-text-main font-medium">Email verified!</p>
                  <p className="text-text-muted text-sm mt-1">
                    Set a password so you can log in easily next time
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm text-text-muted mb-2">Password</label>
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
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-text-dim mt-1.5">Minimum 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm text-text-muted mb-2">Confirm password</label>
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
                      className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                      required
                      minLength={6}
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
                      Setting password...
                    </span>
                  ) : (
                    <>
                      Set password & continue
                      <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                    </>
                  )}
                </button>

                {/* Skip */}
                <button
                  type="button"
                  onClick={handleSkipPassword}
                  className="w-full text-center text-sm text-text-dim hover:text-text-muted transition-colors"
                >
                  Skip for now — I'll set it later
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
};

export default SignupPage;
