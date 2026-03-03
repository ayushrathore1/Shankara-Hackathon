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
  const [loginMethod, setLoginMethod] = useState('password');
  const [otpStep, setOtpStep] = useState('email');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { login, sendLoginOTP, verifyLoginOTP } = useAuth();

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
      const returnTo = sessionStorage.getItem('medhaFlowReturn');
      if (returnTo) { sessionStorage.removeItem('medhaFlowReturn'); navigate(returnTo); }
      else navigate('/dashboard');
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
      if (err.waitTime) setCountdown(err.waitTime);
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
      const returnTo = sessionStorage.getItem('medhaFlowReturn');
      if (returnTo) { sessionStorage.removeItem('medhaFlowReturn'); navigate(returnTo); }
      else navigate('/dashboard');
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
      if (err.waitTime) setCountdown(err.waitTime);
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

  // ── Shared spinner for buttons ──
  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  // ── Input styling ──
  const inputClass = `w-full h-[52px] pl-11 pr-4 rounded-[10px] text-white text-sm font-sans
    border transition-all duration-200 outline-none
    bg-[rgba(255,255,255,0.03)]
    border-[rgba(255,255,255,0.08)]
    focus:border-[rgba(0,212,255,0.4)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.08)]
    placeholder:text-[rgba(255,255,255,0.25)]`;

  const iconBaseClass = "absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors duration-200";

  // ── Button styling ──
  const primaryBtnClass = `w-full h-[52px] rounded-[10px] font-sans font-bold text-sm
    bg-[#39FF14] text-[#0A0A0F] cursor-pointer
    shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_20px_-5px_rgba(57,255,20,0.3)]
    hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_30px_-5px_rgba(57,255,20,0.4)]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200 flex items-center justify-center gap-2`;

  return (
    <main className="min-h-screen flex selection:bg-[#39FF14] selection:text-black" style={{ backgroundColor: '#0A0A0F' }}>

      {/* ═══════════════════════════════════════════════════════
         LEFT PANEL — Brand / Emotional Selling (45%)
         ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="hidden lg:flex lg:w-[45%] relative flex-col justify-between px-12 py-10 overflow-hidden"
        style={{ backgroundColor: '#0A0A0F' }}
      >
        {/* Radial cyan glow */}
        <div className="absolute top-[55%] left-[40%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />

        {/* DIRECTION watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none whitespace-nowrap"
          style={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '18vw', lineHeight: 1, color: 'rgba(255,255,255,0.025)', letterSpacing: '-0.02em' }}>
          DIRECTION
        </div>

        {/* Logo */}
        <Link to="/" className="relative z-10 inline-flex items-center gap-0.5 group">
          <span className="font-mono text-lg" style={{ color: '#00D4FF' }}>&lt;</span>
          <span className="font-mono text-xl font-bold text-white">Medha</span>
          <span className="font-mono text-lg" style={{ color: '#39FF14' }}>/&gt;</span>
        </Link>

        {/* Main content — center */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
          {/* Urgency tagline */}
          <h1 className="mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            <span className="block text-[clamp(36px,4vw,52px)] font-bold leading-[1.1] text-white">Your roadmap</span>
            <span className="block text-[clamp(36px,4vw,52px)] font-bold leading-[1.1] text-white">is waiting.</span>
          </h1>
          <p className="font-mono text-xs mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
            12,400 job postings analyzed since you last visited.
          </p>

          {/* Floating Product Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative"
            style={{ transform: 'rotate(-2deg)' }}
          >
            <div className="rounded-xl p-5 border"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(0,212,255,0.15)',
                boxShadow: '0 0 40px -10px rgba(0,212,255,0.12), 0 20px 40px -15px rgba(0,0,0,0.5)',
              }}>
              {/* Role header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-mono text-[10px] tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>CAREER MATCH</p>
                  <p className="font-sans text-sm font-semibold text-white">Full Stack Developer</p>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ color: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' }}>Active</span>
              </div>

              {/* Skill chips */}
              <div className="flex gap-1.5 mb-3">
                {['React', 'Node.js', 'PostgreSQL'].map(s => (
                  <span key={s} className="px-2 py-1 rounded-md font-mono text-[10px]"
                    style={{ backgroundColor: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.15)' }}>
                    {s}
                  </span>
                ))}
              </div>

              {/* Progress */}
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Readiness</span>
                  <span className="font-mono text-[10px] font-bold" style={{ color: '#00D4FF' }}>34%</span>
                </div>
                <div className="h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: '34%', backgroundColor: '#00D4FF' }} />
                </div>
              </div>

              {/* Salary */}
              <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                ₹8L — ₹14L /year
              </p>
            </div>
          </motion.div>
        </div>

        {/* Social proof — bottom */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#39FF14' }} />
          <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            142 developers active right now
          </span>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
         RIGHT PANEL — Form (55%)
         ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full lg:w-[55%] flex items-center justify-center px-6 py-12"
        style={{ backgroundColor: '#0D0D15' }}
      >
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-0.5">
              <span className="font-mono text-lg" style={{ color: '#00D4FF' }}>&lt;</span>
              <span className="font-mono text-xl font-bold text-white">Medha</span>
              <span className="font-mono text-lg" style={{ color: '#39FF14' }}>/&gt;</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Sign in to{' '}
              <span style={{ color: '#00D4FF' }}>&lt;</span>
              <span className="text-white">Medha</span>
              <span style={{ color: '#39FF14' }}>/&gt;</span>
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium transition-colors" style={{ color: '#39FF14' }}>
                Sign up
              </Link>
            </p>
          </div>

          {/* Login Method Toggle — sliding underline */}
          <div className="relative flex gap-6 mb-8">
            <button
              type="button"
              onClick={() => switchLoginMethod('password')}
              className="pb-2 text-sm font-medium transition-colors relative"
              style={{ color: loginMethod === 'password' ? '#fff' : 'rgba(255,255,255,0.4)' }}
            >
              <FontAwesomeIcon icon={faLock} className="mr-2 text-xs" />
              Password
            </button>
            <button
              type="button"
              onClick={() => switchLoginMethod('otp')}
              className="pb-2 text-sm font-medium transition-colors relative"
              style={{ color: loginMethod === 'otp' ? '#fff' : 'rgba(255,255,255,0.4)' }}
            >
              <FontAwesomeIcon icon={faKey} className="mr-2 text-xs" />
              Email OTP
            </button>
            {/* Animated underline */}
            <motion.div
              className="absolute bottom-0 h-[2px] rounded-full"
              style={{ backgroundColor: '#00D4FF' }}
              animate={{
                left: loginMethod === 'password' ? '0px' : '106px',
                width: loginMethod === 'password' ? '86px' : '96px',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm p-4 rounded-[10px] mb-6"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Forms ── */}
          <AnimatePresence mode="wait">
            {loginMethod === 'password' ? (
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
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faEnvelope} className={iconBaseClass} style={{ color: email ? '#00D4FF' : 'rgba(255,255,255,0.2)' }} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} required />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
                    <Link to="/forgot-password" className="text-xs transition-colors" style={{ color: '#00D4FF' }}>Forgot?</Link>
                  </div>
                  <div className="relative">
                    <FontAwesomeIcon icon={faLock} className={iconBaseClass} style={{ color: password ? '#00D4FF' : 'rgba(255,255,255,0.2)' }} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} required />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className={primaryBtnClass}>
                  {isLoading ? <><Spinner /> Signing in...</> : <>Sign in <motion.span whileHover={{ x: 4 }} className="inline-block">→</motion.span></>}
                </button>
              </motion.form>

            ) : otpStep === 'email' ? (
              <motion.form
                key="otp-email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP}
                className="space-y-5"
              >
                <p className="text-sm text-center mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  We'll send a verification code to your email
                </p>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faEnvelope} className={iconBaseClass} style={{ color: email ? '#00D4FF' : 'rgba(255,255,255,0.2)' }} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} required />
                  </div>
                </div>
                <button type="submit" disabled={isLoading || countdown > 0} className={primaryBtnClass}>
                  {isLoading ? <><Spinner /> Sending code...</> : countdown > 0 ? `Resend in ${countdown}s` : <>Send verification code <span>→</span></>}
                </button>
              </motion.form>

            ) : (
              <motion.form
                key="otp-verify-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-5"
              >
                <div className="text-center mb-2">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Enter the 6-digit code sent to</p>
                  <p className="font-medium" style={{ color: '#00D4FF' }}>{email}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Verification Code</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faKey} className={iconBaseClass} style={{ color: otp ? '#00D4FF' : 'rgba(255,255,255,0.2)' }} />
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6}
                      className={`${inputClass} text-center text-xl tracking-[0.5em] font-mono`} required autoComplete="one-time-code" />
                  </div>
                </div>
                <div className="space-y-3">
                  <button type="submit" disabled={isLoading || isResending || otp.length !== 6} className={primaryBtnClass}>
                    {isLoading ? <><Spinner /> Verifying...</> : <>Verify & Sign in <span>→</span></>}
                  </button>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={resetToEmail} className="text-sm flex items-center gap-1 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <FontAwesomeIcon icon={faArrowLeft} /> Change email
                    </button>
                    <button type="button" onClick={handleResendOTP} disabled={countdown > 0 || isLoading || isResending}
                      className="text-sm transition-colors disabled:cursor-not-allowed" style={{ color: countdown > 0 ? 'rgba(255,255,255,0.2)' : '#00D4FF' }}>
                      {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider — minimal */}
          <div className="flex items-center justify-center my-8">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>or continue with</span>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
              className="h-12 flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 0 15px -5px rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Google colored logo */}
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Google
            </a>
            <button
              disabled
              className="h-12 flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
              title="Coming soon"
            >
              <FontAwesomeIcon icon={faGithub} className="text-lg" />
              GitHub
            </button>
          </div>

          {/* Bottom copy */}
          <div className="mt-8 text-center space-y-1">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              New to Medha?{' '}
              <Link to="/signup" className="font-medium" style={{ color: '#39FF14' }}>Start free — no card needed →</Link>
            </p>
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Join 847 developers who already have their roadmap.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
};

export default LoginPage;
