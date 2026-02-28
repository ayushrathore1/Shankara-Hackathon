import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faArrowRight, faSpinner, faBolt, faExclamationTriangle,
  faHeart, faWrench, faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { useMedhaFlow } from '../../context/MedhaFlowContext';
import { medhaFlowAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FlowPreviewPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { userName, careerResults, setSelectedCareer } = useMedhaFlow();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const career = careerResults.find(c => c.slug === slug);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { navigate('/name', { replace: true }); return; }
    if (!userName || !career) { navigate('/results', { replace: true }); return; }
    setSelectedCareer(career);
    fetchDayInLife();
  }, [slug, authLoading]);

  const fetchDayInLife = async () => {
    setLoading(true);
    try {
      const res = await medhaFlowAPI.dayInLife({ title: career.title, slug: career.slug });
      setData(res.data?.data);
    } catch (err) {
      console.error('DayInLife failed:', err);
      setError('Failed to generate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-3xl mb-4" />
          <p className="text-text-muted text-lg">Generating your personalized day in the life...</p>
          <p className="text-text-dim text-sm mt-2">This is written specifically for you, {userName}</p>
        </motion.div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Something went wrong'}</p>
          <button onClick={fetchDayInLife} className="px-6 py-3 rounded-xl bg-primary text-bg-base font-bold">Retry</button>
        </div>
      </main>
    );
  }

  const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent('day in the life ' + career.title)}`;

  return (
    <main className="min-h-screen bg-bg-base pt-10 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <button onClick={() => navigate('/results')} className="text-text-dim text-sm hover:text-text-muted mb-6 inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to results
          </button>
          <h1 className="text-3xl font-heading font-bold text-text-main mb-2">
            A Day in Your Life as a <span className="text-primary">{career.title}</span>
          </h1>
          <p className="text-text-muted">Written based on your specific answers, {userName}.</p>
        </motion.div>

        {/* Narrative */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-bg-surface border border-border rounded-2xl p-6 sm:p-8 mb-8">
          <div className="prose prose-invert max-w-none">
            {data.narrative?.split('\n').filter(Boolean).map((p, i) => (
              <p key={i} className="text-text-main text-base leading-relaxed mb-4">{p}</p>
            ))}
          </div>
        </motion.div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-bg-surface border border-green-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faBolt} className="text-green-400" />
              <span className="text-xs font-mono text-green-400">WHAT WOULD ENERGIZE YOU</span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">{data.energizing_moment}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-bg-surface border border-yellow-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400" />
              <span className="text-xs font-mono text-yellow-400">WHAT WOULD CHALLENGE YOU</span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">{data.challenging_moment}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-bg-surface border border-primary/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faHeart} className="text-primary" />
              <span className="text-xs font-mono text-primary">WHY IT'S WORTH IT</span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">{data.meaningful_because}</p>
          </motion.div>
        </div>

        {/* Tools */}
        {data.tools?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="bg-bg-surface border border-border rounded-xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faWrench} className="text-text-dim" />
              <span className="text-xs font-mono text-text-dim">TOOLS YOU'D USE DAILY</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tools.map((tool, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-bg-elevated text-text-muted text-sm border border-border">{tool}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* YouTube */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-bg-surface border border-border rounded-xl p-5 mb-10">
          <h3 className="text-lg font-bold text-text-main mb-2">Watch a real {career.title}'s workday</h3>
          <p className="text-text-dim text-sm mb-4">See real people in this career — not corporate explainers.</p>
          <a href={ytSearchUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-medium">
            <FontAwesomeIcon icon={faYoutube} /> Search YouTube for this <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
          </a>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/results')}
            className="flex-1 py-3 bg-bg-surface border border-border rounded-xl text-text-muted hover:text-text-main hover:border-primary/30 transition-all text-sm font-medium flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to My Results
          </button>
          <button onClick={() => navigate(`/roadmap/${career.slug}`)}
            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-bg-base font-bold rounded-xl transition-all text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            Start My {career.title} Roadmap <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>
    </main>
  );
};

export default FlowPreviewPage;
