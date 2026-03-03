import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_URL = isProduction
  ? 'https://api3.codelearnn.com/api'
  : 'http://localhost:5000/api';

const JoinWaitlistPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitlistCount, setWaitlistCount] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [alreadyExists, setAlreadyExists] = useState(false);

  // Fetch real waitlist count on mount
  useEffect(() => {
    axios.get(`${API_URL}/waitlist/count`)
      .then(res => {
        if (res.data?.success) setWaitlistCount(res.data.count);
      })
      .catch(() => {});
  }, []);

  // Check URL for referral code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/waitlist`, {
        email,
        source: 'homepage',
        refCode: referralCode || undefined,
      });

      if (res.data?.success) {
        setSubmitted(true);
        setAlreadyExists(!!res.data.alreadyExists);
        if (res.data.data?.referralCode) {
          setReferralCode(res.data.data.referralCode);
        }
        // Refresh count
        axios.get(`${API_URL}/waitlist/count`)
          .then(r => { if (r.data?.success) setWaitlistCount(r.data.count); })
          .catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayCount = waitlistCount !== null ? waitlistCount.toLocaleString() : '...';

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Ambient glow */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />

      {/* WAITLIST watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
        style={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '15vw', lineHeight: 1, color: 'rgba(255,255,255,0.02)', letterSpacing: '-0.02em' }}>
        WAITLIST
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-0.5 mb-10">
          <span className="font-mono text-lg" style={{ color: '#00D4FF' }}>&lt;</span>
          <span className="font-mono text-2xl font-bold text-white">Medha</span>
          <span className="font-mono text-lg" style={{ color: '#39FF14' }}>/&gt;</span>
        </Link>

        {!submitted ? (
          <>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: '"Fraunces", serif', color: '#fff' }}>
              Something big<br />is coming.
            </h1>
            <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Medha is building the Learning Operating System for developers. Be the first to get access when we launch.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full h-14 px-5 rounded-xl text-white text-base font-sans outline-none transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0,212,255,0.4)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl font-bold text-[15px] cursor-pointer transition-all duration-200 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#39FF14',
                  color: '#0A0A0F',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 20px -5px rgba(57,255,20,0.3)',
                }}
              >
                {loading ? 'Joining...' : 'Join Waitlist →'}
              </button>
            </form>

            {/* Error */}
            {error && (
              <p className="text-sm mb-3" style={{ color: '#EF4444' }}>{error}</p>
            )}

            <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {displayCount} developers already on the waitlist. No spam, ever.
            </p>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <div className="text-5xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: '"Fraunces", serif', color: '#fff' }}>
              {alreadyExists ? "You're already in!" : "You're in."}
            </h2>
            <p className="text-base mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {alreadyExists
                ? <>We already have <span style={{ color: '#00D4FF' }}>{email}</span> on the waitlist. We'll notify you when Medha launches.</>
                : <>We'll notify <span style={{ color: '#00D4FF' }}>{email}</span> when Medha launches.</>
              }
            </p>

            {/* Position */}
            <p className="font-mono text-sm mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              You're one of <span style={{ color: '#39FF14' }}>{displayCount}</span> developers on the waitlist.
            </p>

            {/* Referral link */}
            {referralCode && (
              <div className="rounded-xl p-4 mb-6 mx-auto max-w-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Share & move up the list</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/join-waitlist?ref=${referralCode}`}
                    className="flex-1 h-9 px-3 rounded-md text-xs font-mono text-white bg-transparent outline-none"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/join-waitlist?ref=${referralCode}`);
                    }}
                    className="h-9 px-3 rounded-md text-xs font-mono font-bold cursor-pointer transition-colors"
                    style={{ backgroundColor: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <Link to="/" className="font-mono text-sm" style={{ color: '#39FF14' }}>
              ← Back to home
            </Link>
          </motion.div>
        )}

        {/* Social proof avatars */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {['#00D4FF', '#39FF14', '#F5A623', '#7C3AED'].map((color, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: color + '20', borderColor: '#0A0A0F', color }}>
                {['A', 'R', 'S', 'P'][i]}
              </div>
            ))}
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            & {displayCount} others waiting
          </span>
        </div>
      </motion.div>
    </main>
  );
};

export default JoinWaitlistPage;
