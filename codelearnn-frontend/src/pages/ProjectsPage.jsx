import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faUsers,
  faBolt,
  faCode,
  faSpinner,
  faTimes,
  faCheck,
  faExternalLink,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'all', label: 'All', icon: '🔥' },
  { value: 'web', label: 'Web', icon: '🌐' },
  { value: 'mobile', label: 'Mobile', icon: '📱' },
  { value: 'ai-ml', label: 'AI/ML', icon: '🤖' },
  { value: 'data', label: 'Data', icon: '📊' },
  { value: 'devops', label: 'DevOps', icon: '⚙️' },
  { value: 'game', label: 'Game', icon: '🎮' },
  { value: 'open-source', label: 'Open Source', icon: '💻' },
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: '', description: '', category: 'web',
    difficulty: 'intermediate', skills: '', maxTeamSize: 4, githubUrl: ''
  });

  useEffect(() => { loadProjects(); }, [category]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      const res = await projectsAPI.browse(params);
      setProjects(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectsAPI.create({
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        maxTeamSize: parseInt(form.maxTeamSize)
      });
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'web', difficulty: 'intermediate', skills: '', maxTeamSize: 4, githubUrl: '' });
      loadProjects();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleApply = async (projectId) => {
    try {
      await projectsAPI.apply(projectId);
      loadProjects();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to apply');
    }
  };

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-main">🏗️ Collab Projects</h1>
            <p className="text-text-muted text-sm mt-1">Build together, earn XP, ship real projects</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> New Project
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                category === c.value
                  ? 'bg-primary text-black font-medium'
                  : 'bg-bg-surface text-text-muted border border-border hover:border-primary/30'
              }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🏗️</p>
            <p className="text-text-muted mb-4">No projects yet in this category</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2 rounded-lg text-sm">
              Create the first one
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => {
              const isMember = project.members?.some(m => (m.user?._id || m.user) === user?._id);
              const hasApplied = project.applicants?.some(a => (a.user?._id || a.user) === user?._id);
              const isCreator = (project.creator?._id || project.creator) === user?._id;
              const slotsLeft = project.maxTeamSize - (project.members?.length || 1);

              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="bg-bg-surface border border-border rounded-xl p-5 hover:border-primary/30 transition-all flex flex-col"
                >
                  {/* Status + Difficulty */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${DIFFICULTY_COLORS[project.difficulty]}`}>
                      {project.difficulty}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      project.status === 'completed' ? 'bg-green-500/10 text-green-400'
                        : project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-text-main mb-2 line-clamp-1">{project.title}</h3>
                  <p className="text-xs text-text-muted mb-3 line-clamp-2 flex-1">{project.description}</p>

                  {/* Skills */}
                  {project.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.skills.slice(0, 4).map((s, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-base text-text-dim border border-border">
                          {s}
                        </span>
                      ))}
                      {project.skills.length > 4 && (
                        <span className="text-[10px] text-text-dim">+{project.skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-text-dim">
                      <FontAwesomeIcon icon={faUsers} />
                      <span>{project.members?.length || 1}/{project.maxTeamSize}</span>
                      {slotsLeft > 0 && <span className="text-primary">({slotsLeft} open)</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <FontAwesomeIcon icon={faBolt} />
                      +{project.xpReward} XP
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3">
                    {isCreator ? (
                      <span className="text-[11px] text-text-dim">Your project</span>
                    ) : isMember ? (
                      <span className="text-[11px] text-green-400 flex items-center gap-1">
                        <FontAwesomeIcon icon={faCheck} /> Joined
                      </span>
                    ) : hasApplied ? (
                      <span className="text-[11px] text-yellow-400">Applied — waiting</span>
                    ) : project.status === 'open' && slotsLeft > 0 ? (
                      <button
                        onClick={() => handleApply(project._id)}
                        className="btn-primary w-full py-2 rounded-lg text-xs"
                      >
                        Apply to Join
                      </button>
                    ) : null}
                  </div>

                  {/* GitHub */}
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                       className="mt-2 text-[11px] text-text-dim hover:text-primary transition-colors flex items-center gap-1">
                      <FontAwesomeIcon icon={faGithub} /> View Repository
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-bg-surface border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-text-main">Create Project</h2>
                  <button onClick={() => setShowCreate(false)} className="text-text-dim hover:text-text-main">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Title</label>
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                           className="input bg-bg-base border-border w-full" required />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                              className="input bg-bg-base border-border w-full" rows={3} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Category</label>
                      <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                              className="input bg-bg-base border-border w-full">
                        {CATEGORIES.slice(1).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Difficulty</label>
                      <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}
                              className="input bg-bg-base border-border w-full">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Skills (comma-separated)</label>
                    <input value={form.skills} onChange={e => setForm({...form, skills: e.target.value})}
                           placeholder="React, Node.js, MongoDB"
                           className="input bg-bg-base border-border w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Team Size</label>
                      <input type="number" min={1} max={10} value={form.maxTeamSize}
                             onChange={e => setForm({...form, maxTeamSize: e.target.value})}
                             className="input bg-bg-base border-border w-full" />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">GitHub URL (optional)</label>
                      <input value={form.githubUrl} onChange={e => setForm({...form, githubUrl: e.target.value})}
                             className="input bg-bg-base border-border w-full" />
                    </div>
                  </div>
                  <button type="submit" disabled={creating} className="btn-primary w-full py-3 rounded-xl">
                    {creating ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Create Project (+50 XP)'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default ProjectsPage;
