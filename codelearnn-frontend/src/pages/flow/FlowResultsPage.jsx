import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faArrowLeft, faRefresh, faBriefcase, faChartLine, faClock,
  faChevronDown, faPlay, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { useMedhaFlow } from '../../context/MedhaFlowContext';
import { medhaFlowAPI } from '../../services/api';

const FIT_COLORS = {
  'Strong Fit': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', glow: 'shadow-green-500/10' },
  'High Fit': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/10' },
  'Good Match': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/10' },
};

const FlowResultsPage = () => {
  const navigate = useNavigate();
  const { userName, careerResults, careerDomains, resetFlow, setSelectedCareer } = useMedhaFlow();
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [videoCache, setVideoCache] = useState({});
  const [videoLoading, setVideoLoading] = useState({});

  useEffect(() => {
    if (!userName || (careerResults.length === 0 && !careerDomains)) {
      navigate('/quiz', { replace: true });
    }
  }, [userName, careerResults, careerDomains, navigate]);

  const domains = careerDomains || [];
  if (domains.length === 0 && careerResults.length === 0) return null;

  const handleRetake = () => {
    resetFlow();
    navigate('/quiz');
  };

  const toggleDomain = (slug) => {
    setExpandedDomain(prev => prev === slug ? null : slug);
  };

  // Fetch real YouTube video for a path
  const fetchVideo = async (path) => {
    const key = path.slug;
    if (videoCache[key] || videoLoading[key]) return;
    setVideoLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await medhaFlowAPI.searchYouTubeVideo(path.yt_search_query || `a day in the life of ${path.title}`);
      setVideoCache(prev => ({ ...prev, [key]: res.data?.data }));
    } catch (err) {
      console.error('Video fetch failed:', err);
      setVideoCache(prev => ({ ...prev, [key]: { fallback: true, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(path.title + ' day in the life')}` } }));
    } finally {
      setVideoLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Fetch videos when a domain expands
  useEffect(() => {
    if (expandedDomain && domains.length > 0) {
      const domain = domains.find(d => d.domain_slug === expandedDomain);
      if (domain) {
        domain.paths?.forEach(path => fetchVideo(path));
      }
    }
  }, [expandedDomain]);

  const handleSelectPath = (path, domain) => {
    setSelectedCareer({
      title: path.title,
      slug: path.slug,
      fit_label: domain.fit_label,
      why: path.why,
      salary_range: path.salary_range,
    });
    navigate(`/preview/${path.slug}`);
  };

  // ─── Fallback: old flat career cards if no domains ───
  if (!domains.length && careerResults.length > 0) {
    return (
      <main className="min-h-screen bg-bg-base pt-10 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/quiz')} className="text-text-dim text-sm hover:text-text-muted mb-6 inline-flex items-center gap-2 transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to quiz
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-3xl font-heading font-bold text-text-main mb-3">
              Your career matches, <span className="text-primary">{userName}</span>
            </h1>
          </motion.div>
          <div className="space-y-4">
            {careerResults.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-bg-surface border border-border rounded-xl p-5">
                <h2 className="text-lg font-bold text-text-main mb-2">{c.title}</h2>
                <p className="text-text-muted text-sm mb-3">{c.why}</p>
                <button onClick={() => { setSelectedCareer(c); navigate(`/preview/${c.slug}`); }}
                  className="px-4 py-2 bg-primary/10 text-primary text-sm rounded-lg">
                  Explore →
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base pt-10 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/quiz')} className="text-text-dim text-sm hover:text-text-muted mb-6 inline-flex items-center gap-2 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to quiz
        </button>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-primary font-mono text-xs">YOUR DOMAINS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text-main mb-3">
            3 worlds that match how <span className="text-primary">{userName}</span> thinks
          </h1>
          <p className="text-text-muted text-lg">
            Tap a domain to explore specific career paths inside it.
          </p>
        </motion.div>

        {/* Domain Cards */}
        <div className="space-y-5">
          {domains.map((domain, i) => {
            const colors = FIT_COLORS[domain.fit_label] || FIT_COLORS['Good Match'];
            const isExpanded = expandedDomain === domain.domain_slug;
            const paths = domain.paths || [];

            return (
              <motion.div key={domain.domain_slug || i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 100 }}
              >
                {/* Domain card (collapsed) */}
                <button
                  onClick={() => toggleDomain(domain.domain_slug)}
                  className={`w-full text-left bg-bg-surface border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
                    isExpanded ? `${colors.border} shadow-lg ${colors.glow}` : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{domain.emoji || '🎯'}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-bold text-text-main">{domain.domain}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {domain.fit_label}
                          </span>
                        </div>
                        <p className="text-text-muted text-sm leading-relaxed">{domain.why_domain}</p>
                        <p className="text-text-dim text-xs mt-2">{paths.length} career paths inside →</p>
                      </div>
                    </div>
                    <FontAwesomeIcon icon={faChevronDown}
                      className={`text-text-dim mt-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Petal paths (expanded) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-3 pl-4 border-l-2 border-primary/20 ml-6">
                        {paths.map((path, pi) => {
                          const video = videoCache[path.slug];
                          const loadingVideo = videoLoading[path.slug];

                          return (
                            <motion.div
                              key={path.slug || pi}
                              initial={{ opacity: 0, x: -20, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ delay: pi * 0.12, type: 'spring', stiffness: 120, damping: 15 }}
                              className="bg-bg-elevated border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
                            >
                              {/* Path header */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-bold text-text-main mb-1">{path.title}</h3>
                                  <p className="text-text-dim text-xs">{path.one_liner}</p>
                                </div>
                              </div>

                              {/* Why this path */}
                              <p className="text-text-muted text-sm leading-relaxed mb-4">{path.why}</p>

                              {/* Data pills */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-base text-text-muted text-xs border border-border">
                                  <FontAwesomeIcon icon={faBriefcase} className="text-primary text-[10px]" /> {path.salary_range}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-base text-text-muted text-xs border border-border">
                                  <FontAwesomeIcon icon={faChartLine} className="text-secondary text-[10px]" /> {path.market_demand}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-base text-text-muted text-xs border border-border">
                                  <FontAwesomeIcon icon={faClock} className="text-accent text-[10px]" /> {path.time_to_first_role}
                                </span>
                              </div>

                              {/* YouTube Video Card — real video from Google CSE */}
                              <div className="mb-4">
                                {loadingVideo && (
                                  <div className="bg-bg-base rounded-lg p-4 border border-border flex items-center gap-3">
                                    <FontAwesomeIcon icon={faSpinner} spin className="text-red-400" />
                                    <span className="text-text-dim text-xs">Finding a real video...</span>
                                  </div>
                                )}
                                {video && !video.fallback && (
                                  <a href={video.url} target="_blank" rel="noopener noreferrer"
                                    className="block bg-bg-base rounded-lg overflow-hidden border border-border hover:border-red-500/30 transition-all group">
                                    <div className="flex">
                                      {/* Thumbnail */}
                                      {video.thumbnail && (
                                        <div className="relative w-40 flex-shrink-0">
                                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                              <FontAwesomeIcon icon={faPlay} className="text-white text-sm ml-0.5" />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {/* Info */}
                                      <div className="p-3 flex-1 min-w-0">
                                        <p className="text-text-main text-sm font-medium leading-snug line-clamp-2 group-hover:text-red-400 transition-colors mb-1">
                                          {video.title}
                                        </p>
                                        <p className="text-text-dim text-xs flex items-center gap-1">
                                          <FontAwesomeIcon icon={faYoutube} className="text-red-400 text-[10px]" />
                                          {video.channel}
                                        </p>
                                        {video.snippet && (
                                          <p className="text-text-dim text-[11px] mt-1 line-clamp-2 leading-relaxed">{video.snippet}</p>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                )}
                                {video && video.fallback && (
                                  <a href={video.url} target="_blank" rel="noopener noreferrer"
                                    className="block bg-bg-base rounded-lg p-3 border border-border hover:border-red-500/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faPlay} className="text-red-400 text-sm" />
                                      </div>
                                      <div>
                                        <p className="text-text-main text-sm font-medium group-hover:text-red-400">
                                          Watch: Day in the Life of a {path.title}
                                        </p>
                                        <p className="text-text-dim text-xs flex items-center gap-1">
                                          <FontAwesomeIcon icon={faYoutube} className="text-red-400 text-[10px]" />
                                          Search YouTube
                                        </p>
                                      </div>
                                    </div>
                                  </a>
                                )}
                              </div>

                              {/* CTA */}
                              <button onClick={() => handleSelectPath(path, domain)}
                                className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm rounded-xl transition-all border border-primary/20 hover:border-primary/40 flex items-center justify-center gap-2">
                                See This Life & Start Learning <FontAwesomeIcon icon={faArrowRight} />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Retake */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center mt-10">
          <button onClick={handleRetake}
            className="text-text-dim text-sm hover:text-text-muted transition-colors inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faRefresh} /> Not what you expected? Retake the quiz
          </button>
        </motion.div>
      </div>
    </main>
  );
};

export default FlowResultsPage;
