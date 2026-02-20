import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { journeyAPI } from '../services/api';

// ─── Icons ─────────────────────────────────────────────
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
);
const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

// ─── Main Component ────────────────────────────────────
export default function LearningPlayerPage() {
  const { phaseId, resourceIndex } = useParams();
  const navigate = useNavigate();

  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(phaseId || null);
  const [selectedResourceIdx, setSelectedResourceIdx] = useState(parseInt(resourceIndex) || 0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completingResource, setCompletingResource] = useState(false);

  // Fetch journey data
  useEffect(() => {
    const fetchJourney = async () => {
      try {
        setLoading(true);
        const res = await journeyAPI.getActive();
        if (res.data?.success && res.data?.data) {
          setJourney(res.data.data);
          if (!selectedPhaseId && res.data.data.roadmap?.currentPhaseId) {
            setSelectedPhaseId(res.data.data.roadmap.currentPhaseId);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load journey');
      } finally {
        setLoading(false);
      }
    };
    fetchJourney();
  }, []);

  // Derived data
  const phases = useMemo(() => journey?.roadmap?.phases || [], [journey]);
  const currentPhase = useMemo(
    () => phases.find(p => p.phaseId === selectedPhaseId) || phases[0],
    [phases, selectedPhaseId]
  );
  const resources = useMemo(() => currentPhase?.resources || [], [currentPhase]);
  const currentResource = useMemo(
    () => resources[selectedResourceIdx] || resources[0],
    [resources, selectedResourceIdx]
  );

  // YouTube embed URL
  const embedUrl = useMemo(() => {
    const videoId = currentResource?.videoId;
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }, [currentResource]);

  // Complete resource
  const handleCompleteResource = useCallback(async () => {
    if (!currentResource || completingResource) return;
    setCompletingResource(true);
    try {
      const resourceId = currentResource.externalResourceId || currentResource._id;
      await journeyAPI.completeResource(resourceId, currentPhase.phaseId);
      // Update local state
      setJourney(prev => {
        const updated = { ...prev };
        const phase = updated.roadmap.phases.find(p => p.phaseId === currentPhase.phaseId);
        if (phase) {
          const res = phase.resources[selectedResourceIdx];
          if (res) {
            res.isCompleted = true;
            res.completedAt = new Date().toISOString();
            res.progress = 100;
          }
          const completed = phase.resources.filter(r => r.isCompleted).length;
          phase.progress = Math.round((completed / phase.resources.length) * 100);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to complete resource:', err);
    } finally {
      setCompletingResource(false);
    }
  }, [currentResource, currentPhase, selectedResourceIdx, completingResource]);

  // Navigate to next resource
  const handleNext = useCallback(() => {
    if (selectedResourceIdx < resources.length - 1) {
      setSelectedResourceIdx(prev => prev + 1);
    } else {
      // Move to next phase
      const currentIdx = phases.findIndex(p => p.phaseId === selectedPhaseId);
      if (currentIdx < phases.length - 1) {
        const nextPhase = phases[currentIdx + 1];
        if (nextPhase.status !== 'locked') {
          setSelectedPhaseId(nextPhase.phaseId);
          setSelectedResourceIdx(0);
        }
      }
    }
  }, [selectedResourceIdx, resources, phases, selectedPhaseId]);

  if (loading) {
    return (
      <div className="learning-player-loading">
        <div className="spinner" />
        <p>Loading your learning path...</p>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="learning-player-error">
        <h2>Unable to load learning path</h2>
        <p>{error || 'No active journey found'}</p>
        <button onClick={() => navigate('/career-journey')}>Go to Career Journey</button>
      </div>
    );
  }

  return (
    <div className="learning-player">
      {/* ── Sidebar ── */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            className="lp-sidebar"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="lp-sidebar-header">
              <h2>{journey.career?.title || 'Learning Path'}</h2>
              <button className="lp-close-btn" onClick={() => setSidebarOpen(false)}>
                <XIcon />
              </button>
            </div>

            <div className="lp-phases">
              {phases.map((phase, pi) => {
                const isActive = phase.phaseId === selectedPhaseId;
                const isLocked = phase.status === 'locked';
                
                return (
                  <div key={phase.phaseId} className={`lp-phase ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}>
                    <button
                      className="lp-phase-header"
                      onClick={() => {
                        if (!isLocked) {
                          setSelectedPhaseId(phase.phaseId);
                          setSelectedResourceIdx(0);
                        }
                      }}
                      disabled={isLocked}
                    >
                      <div className="lp-phase-info">
                        {isLocked ? <LockIcon /> : (
                          <span className={`lp-phase-num ${phase.progress >= 100 ? 'done' : ''}`}>
                            {phase.progress >= 100 ? '✓' : pi + 1}
                          </span>
                        )}
                        <span className="lp-phase-title">{phase.title}</span>
                      </div>
                      <span className="lp-phase-progress">{phase.progress || 0}%</span>
                    </button>

                    {isActive && (
                      <motion.div
                        className="lp-resource-list"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {phase.resources?.map((res, ri) => (
                          <button
                            key={ri}
                            className={`lp-resource-item ${ri === selectedResourceIdx ? 'selected' : ''} ${res.isCompleted ? 'completed' : ''}`}
                            onClick={() => setSelectedResourceIdx(ri)}
                          >
                            <span className="lp-res-status">
                              {res.isCompleted ? (
                                <CheckCircleIcon />
                              ) : ri === selectedResourceIdx ? (
                                <PlayIcon />
                              ) : (
                                <span className="lp-res-dot" />
                              )}
                            </span>
                            <span className="lp-res-title">{res.title}</span>
                            {res.duration && (
                              <span className="lp-res-duration">{res.duration}m</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="lp-main">
        {!sidebarOpen && (
          <button className="lp-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
            <ChevronRightIcon />
          </button>
        )}

        {/* Video Player */}
        <div className="lp-player-container">
          {embedUrl ? (
            <iframe
              className="lp-video-iframe"
              src={embedUrl}
              title={currentResource?.title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="lp-no-video">
              <PlayIcon />
              <h3>{currentResource?.title || 'Select a resource'}</h3>
              <p>
                {currentResource?.url ? (
                  <a href={currentResource.url} target="_blank" rel="noopener noreferrer">
                    Open external resource →
                  </a>
                ) : (
                  'No video available for this resource'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Resource Info */}
        {currentResource && (
          <div className="lp-resource-info">
            <div className="lp-info-left">
              <h3>{currentResource.title}</h3>
              <div className="lp-info-meta">
                {currentResource.provider && <span className="lp-provider">{currentResource.provider}</span>}
                {currentResource.type && <span className="lp-type">{currentResource.type}</span>}
                {currentResource.qualityScore && (
                  <span className="lp-quality">Score: {currentResource.qualityScore}/100</span>
                )}
              </div>
            </div>
            <div className="lp-info-actions">
              {!currentResource.isCompleted ? (
                <button
                  className="lp-complete-btn"
                  onClick={handleCompleteResource}
                  disabled={completingResource}
                >
                  {completingResource ? 'Saving...' : '✓ Mark Complete'}
                </button>
              ) : (
                <span className="lp-completed-badge">✓ Completed</span>
              )}
              <button className="lp-next-btn" onClick={handleNext}>
                Next <ChevronRightIcon />
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{playerStyles}</style>
    </div>
  );
}

// ─── Inline Styles ─────────────────────────────────────
const playerStyles = `
  .learning-player {
    display: flex;
    height: 100vh;
    background: #0a0a0f;
    color: #e5e5e5;
    font-family: 'Inter', -apple-system, system-ui, sans-serif;
  }

  .learning-player-loading,
  .learning-player-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #0a0a0f;
    color: #e5e5e5;
    gap: 16px;
  }

  .learning-player-error button {
    background: #c8fa3c;
    color: #0a0a0f;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #2a2a3e;
    border-top-color: #c8fa3c;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Sidebar ── */
  .lp-sidebar {
    width: 320px;
    min-width: 320px;
    background: #111118;
    border-right: 1px solid #1f1f2e;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .lp-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 16px;
    border-bottom: 1px solid #1f1f2e;
  }

  .lp-sidebar-header h2 {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lp-close-btn {
    background: none;
    border: none;
    color: #6b6b7b;
    cursor: pointer;
    padding: 4px;
  }

  .lp-phases {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .lp-phase { border-bottom: 1px solid #1a1a28; }
  .lp-phase.locked { opacity: 0.5; }

  .lp-phase-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 14px 16px;
    background: none;
    border: none;
    color: #e5e5e5;
    cursor: pointer;
    text-align: left;
    font-size: 14px;
  }

  .lp-phase-header:disabled { cursor: not-allowed; }
  .lp-phase.active .lp-phase-header { background: rgba(200, 250, 60, 0.05); }

  .lp-phase-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .lp-phase-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2a2a3e;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .lp-phase-num.done {
    background: #c8fa3c;
    color: #0a0a0f;
  }

  .lp-phase-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lp-phase-progress {
    font-size: 12px;
    color: #6b6b7b;
    flex-shrink: 0;
  }

  .lp-resource-list { padding: 0 8px 8px; }

  .lp-resource-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    border-radius: 8px;
    color: #a0a0b0;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    transition: background 0.2s;
  }

  .lp-resource-item:hover { background: rgba(255,255,255,0.03); }
  .lp-resource-item.selected {
    background: rgba(200, 250, 60, 0.08);
    color: #c8fa3c;
  }
  .lp-resource-item.completed { color: #4a4a5a; text-decoration: line-through; }

  .lp-res-status {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: inherit;
  }

  .lp-res-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3a3a4e;
  }

  .lp-res-title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lp-res-duration {
    font-size: 11px;
    color: #6b6b7b;
    flex-shrink: 0;
  }

  /* ── Main Content ── */
  .lp-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .lp-sidebar-toggle {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    background: #1f1f2e;
    border: 1px solid #2a2a3e;
    border-left: none;
    border-radius: 0 8px 8px 0;
    padding: 12px 6px;
    color: #6b6b7b;
    cursor: pointer;
    z-index: 10;
  }

  .lp-player-container {
    flex: 1;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
  }

  .lp-video-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .lp-no-video {
    text-align: center;
    color: #6b6b7b;
    padding: 40px;
  }

  .lp-no-video svg { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3; }
  .lp-no-video h3 { color: #e5e5e5; margin: 0 0 8px; }
  .lp-no-video a {
    color: #c8fa3c;
    text-decoration: none;
    font-weight: 500;
  }

  /* ── Resource Info Bar ── */
  .lp-resource-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #111118;
    border-top: 1px solid #1f1f2e;
    gap: 16px;
    flex-wrap: wrap;
  }

  .lp-info-left h3 {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 4px;
  }

  .lp-info-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #6b6b7b;
  }

  .lp-info-meta span {
    background: #1a1a28;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .lp-info-actions {
    display: flex;
    gap: 8px;
  }

  .lp-complete-btn {
    background: #c8fa3c;
    color: #0a0a0f;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .lp-complete-btn:disabled { opacity: 0.5; cursor: wait; }

  .lp-completed-badge {
    display: flex;
    align-items: center;
    color: #2dd4bf;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 16px;
  }

  .lp-next-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #1f1f2e;
    color: #e5e5e5;
    border: 1px solid #2a2a3e;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .lp-next-btn:hover { background: #2a2a3e; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .lp-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
      box-shadow: 4px 0 20px rgba(0,0,0,0.5);
    }

    .lp-resource-info {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
