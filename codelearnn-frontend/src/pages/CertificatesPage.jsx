import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAward,
  faCheck,
  faCopy,
  faSpinner,
  faExternalLink,
  faShareAlt,
} from '@fortawesome/free-solid-svg-icons';
import { certificatesAPI } from '../services/api';

const TYPE_META = {
  'path-completion': { icon: '🎓', label: 'Path Completion', gradient: 'from-blue-500/20 to-purple-500/20', border: 'border-blue-500/30' },
  'skill-verified': { icon: '✅', label: 'Skill Verified', gradient: 'from-green-500/20 to-teal-500/20', border: 'border-green-500/30' },
  'project-completion': { icon: '🚀', label: 'Project', gradient: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30' },
  'achievement': { icon: '🏆', label: 'Achievement', gradient: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30' },
};

const CertificatesPage = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => { loadCerts(); }, []);

  const loadCerts = async () => {
    try {
      const res = await certificatesAPI.getMine();
      setCerts(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyVerification = (code) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-text-main">
            <FontAwesomeIcon icon={faAward} className="text-yellow-400 mr-2" />
            My Certificates
          </h1>
          <p className="text-text-muted text-sm mt-1">Verified skill certifications earned through learning</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
          </div>
        ) : certs.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-5xl mb-4">🎓</p>
            <h2 className="text-lg font-bold text-text-main mb-2">No certificates yet</h2>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Complete learning paths, verify skills, or finish projects to earn verifiable certificates.
            </p>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {certs.map((cert, i) => {
              const meta = TYPE_META[cert.type] || TYPE_META['achievement'];
              return (
                <motion.div
                  key={cert._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={`bg-gradient-to-br ${meta.gradient} border ${meta.border} rounded-2xl p-6 relative overflow-hidden`}
                >
                  {/* Watermark */}
                  <div className="absolute top-3 right-3 text-4xl opacity-20">{meta.icon}</div>

                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">
                      {meta.label}
                    </span>
                    <h3 className="text-lg font-bold text-text-main mt-1 mb-2">{cert.title}</h3>

                    {cert.description && (
                      <p className="text-sm text-text-muted mb-3">{cert.description}</p>
                    )}

                    {cert.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {cert.skills.map((s, j) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-base/50 text-text-muted border border-border/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="text-[11px] text-text-dim font-mono">
                        {cert.verificationCode}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-dim">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => copyVerification(cert.verificationCode)}
                          className="text-xs text-primary hover:text-primary-glow transition-colors"
                          title="Copy verification link"
                        >
                          <FontAwesomeIcon icon={copied === cert.verificationCode ? faCheck : faCopy} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default CertificatesPage;
