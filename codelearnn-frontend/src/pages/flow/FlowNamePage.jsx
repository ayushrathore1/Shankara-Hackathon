import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { useMedhaFlow } from '../../context/MedhaFlowContext';
import { useAuth } from '../../context/AuthContext';

const DEGREES = [
  { label: 'B.Com / BBA / BMS', value: 'commerce', icon: '📊' },
  { label: 'B.Tech / B.E. (Engineering)', value: 'engineering', icon: '⚙️' },
  { label: 'BCA / B.Sc IT / CS', value: 'cs-it', icon: '💻' },
  { label: 'B.Sc (Science)', value: 'science', icon: '🔬' },
  { label: 'BA (Arts / Humanities)', value: 'arts', icon: '📚' },
  { label: 'BBA / MBA (Management)', value: 'management', icon: '📈' },
  { label: 'B.Des / Design', value: 'design', icon: '🎨' },
  { label: 'Law / LLB', value: 'law', icon: '⚖️' },
  { label: 'Medical / Pharma', value: 'medical', icon: '🏥' },
  { label: '12th / Gap Year / Other', value: 'other', icon: '🎓' },
];

const YEARS = [
  { label: '1st Year', value: '1st' },
  { label: '2nd Year', value: '2nd' },
  { label: '3rd Year', value: '3rd' },
  { label: 'Final Year', value: 'final' },
  { label: 'Graduated', value: 'graduated' },
];

const FlowNamePage = () => {
  const navigate = useNavigate();
  const { setUserName, setUserDegree } = useMedhaFlow();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [degree, setDegree] = useState('');
  const [year, setYear] = useState('');
  const [step, setStep] = useState('checking'); // checking | degree | year

  useEffect(() => {
    if (authLoading) return;
    // If user didn't come through the landing page, send them there
    if (!sessionStorage.getItem('medhaFlowStarted')) {
      navigate('/career-discovery', { replace: true });
      return;
    }
    if (!isAuthenticated) {
      sessionStorage.setItem('medhaFlowReturn', '/name');
      navigate('/login', { replace: true });
      return;
    }
    // Auth OK — set name and show degree picker
    if (user?.name) setUserName(user.name);
    setStep('degree');
  }, [isAuthenticated, authLoading, user, navigate, setUserName]);

  const handleDegreeSelect = (val) => {
    setDegree(val);
    setStep('year');
  };

  const handleYearSelect = (val) => {
    setYear(val);
    const degreeLabel = DEGREES.find(d => d.value === degree)?.label || degree;
    setUserDegree({ degree, degreeLabel, year: val });
    navigate('/quiz');
  };

  if (step === 'checking') {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-text-muted">Checking your account...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <button onClick={() => navigate('/career-discovery')} className="text-text-dim text-sm hover:text-text-muted mb-6 inline-flex items-center gap-2 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-primary font-mono text-xs">MEDHA</span>
            </div>
            <p className="text-text-dim text-sm">Hey {user?.name?.split(' ')[0]} 👋 — one quick thing before we start</p>
          </div>

          {step === 'degree' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-heading font-bold text-text-main mb-2 text-center">
                What are you studying?
              </h2>
              <p className="text-text-dim text-sm text-center mb-6">This helps us ask the right questions and find careers that actually fit your background</p>

              <div className="grid grid-cols-2 gap-2">
                {DEGREES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => handleDegreeSelect(d.value)}
                    className="text-left px-4 py-3.5 rounded-xl border-2 border-border bg-bg-surface hover:border-primary/40 hover:bg-bg-elevated transition-all text-sm flex items-center gap-3"
                  >
                    <span className="text-lg">{d.icon}</span>
                    <span className="text-text-muted">{d.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'year' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-heading font-bold text-text-main mb-2 text-center">
                Which year are you in?
              </h2>
              <p className="text-text-dim text-sm text-center mb-6">
                {DEGREES.find(d => d.value === degree)?.icon} {DEGREES.find(d => d.value === degree)?.label}
              </p>

              <div className="space-y-2">
                {YEARS.map((y) => (
                  <button
                    key={y.value}
                    onClick={() => handleYearSelect(y.value)}
                    className="w-full text-left px-5 py-4 rounded-xl border-2 border-border bg-bg-surface hover:border-primary/40 hover:bg-bg-elevated transition-all text-sm text-text-muted flex items-center justify-between"
                  >
                    <span>{y.label}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-text-dim text-xs" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
};

export default FlowNamePage;
