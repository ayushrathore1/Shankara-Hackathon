import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSpinner, faTimes, faArrowUp, faArrowDown,
  faComment, faEye, faPaperPlane, faArrowLeft, faFire,
  faClock, faTrophy, faThumbsUp, faSearch, faThumbtack,
} from '@fortawesome/free-solid-svg-icons';
import { charchaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'all', label: 'All', icon: '🔥' },
  { value: 'career', label: 'Career', icon: '💼' },
  { value: 'learning', label: 'Learning', icon: '📚' },
  { value: 'projects', label: 'Projects', icon: '🏗️' },
  { value: 'code-help', label: 'Code Help', icon: '🐛' },
  { value: 'resources', label: 'Resources', icon: '🔗' },
  { value: 'interview-prep', label: 'Interviews', icon: '🎯' },
  { value: 'showcase', label: 'Showcase', icon: '✨' },
  { value: 'general', label: 'General', icon: '💬' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest', icon: faClock },
  { value: 'popular', label: 'Popular', icon: faFire },
  { value: 'top', label: 'Top Voted', icon: faTrophy },
];

const CharchaPage = () => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('browse');
  const [selectedPost, setSelectedPost] = useState(null);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [form, setForm] = useState({ title: '', body: '', category: 'general', tags: '' });

  useEffect(() => { loadDiscussions(); }, [category, sort]);

  const loadDiscussions = async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (category !== 'all') params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await charchaAPI.browse(params);
      setDiscussions(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadDiscussions();
  };

  const openDetail = async (id) => {
    try {
      const res = await charchaAPI.getById(id);
      setSelectedPost(res.data?.data);
      setView('detail');
    } catch (e) {
      alert('Failed to load discussion');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await charchaAPI.create({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setForm({ title: '', body: '', category: 'general', tags: '' });
      setView('browse');
      loadDiscussions();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      const res = await charchaAPI.comment(selectedPost._id, commentText.trim());
      setSelectedPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.data?.data],
        commentCount: (prev.commentCount || 0) + 1
      }));
      setCommentText('');
    } catch (e) {
      alert('Failed to post comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleVote = async (id, type) => {
    try {
      const res = await charchaAPI.vote(id, type);
      const data = res.data?.data;
      setDiscussions(prev => prev.map(d =>
        d._id === id ? { ...d, score: data.score, upvoteCount: data.upvoteCount, userVote: data.userVote } : d
      ));
      if (selectedPost?._id === id) {
        setSelectedPost(prev => ({ ...prev, score: data.score, upvoteCount: data.upvoteCount, userVote: data.userVote }));
      }
    } catch (e) {}
  };

  const getRankBadge = (gamification) => {
    const xp = gamification?.totalXP || 0;
    if (xp >= 5000) return { label: 'Lead', color: 'text-purple-400' };
    if (xp >= 2000) return { label: 'Senior', color: 'text-blue-400' };
    if (xp >= 800) return { label: 'Dev', color: 'text-green-400' };
    if (xp >= 300) return { label: 'Jr', color: 'text-yellow-400' };
    return { label: 'Intern', color: 'text-text-dim' };
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // ======================== DETAIL VIEW ========================
  if (view === 'detail' && selectedPost) {
    const post = selectedPost;
    const rank = getRankBadge(post.author?.gamification);

    return (
      <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => { setView('browse'); setSelectedPost(null); }}
                  className="text-sm text-text-muted hover:text-primary mb-4 flex items-center gap-1">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Charcha
          </button>

          <div className="bg-bg-surface border border-border rounded-2xl p-6 mb-4">
            <div className="flex gap-4">
              {/* Vote column */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <button onClick={() => handleVote(post._id, 'up')}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          post.userVote === 'up' ? 'bg-primary text-black' : 'bg-bg-elevated text-text-dim hover:text-primary'
                        }`}>
                  <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
                </button>
                <span className={`text-sm font-bold ${post.score > 0 ? 'text-primary' : post.score < 0 ? 'text-red-400' : 'text-text-dim'}`}>
                  {post.score || 0}
                </span>
                <button onClick={() => handleVote(post._id, 'down')}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          post.userVote === 'down' ? 'bg-red-500 text-white' : 'bg-bg-elevated text-text-dim hover:text-red-400'
                        }`}>
                  <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {CATEGORIES.find(c => c.value === post.category)?.icon} {post.category}
                  </span>
                  {post.isPinned && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                      <FontAwesomeIcon icon={faThumbtack} /> Pinned
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-text-main mb-3">{post.title}</h1>
                <div className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed mb-4">
                  {post.body}
                </div>
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-base text-text-dim border border-border">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-text-dim border-t border-border pt-3">
                  <span className="font-medium text-text-main">{post.author?.name}</span>
                  <span className={`${rank.color} font-mono`}>{rank.label}</span>
                  <span>{timeAgo(post.createdAt)}</span>
                  <span><FontAwesomeIcon icon={faEye} className="mr-1" />{post.views}</span>
                </div>

                {post.linkedProject && (
                  <div className="mt-3 p-3 bg-bg-base rounded-lg border border-border">
                    <span className="text-[10px] text-text-dim uppercase">Linked Project</span>
                    <p className="text-sm font-medium text-primary">{post.linkedProject.title}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="mb-4">
            <h3 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-3">
              {post.comments?.length || 0} Comments
            </h3>
            <div className="space-y-3">
              {post.comments?.map((comment, i) => {
                const cRank = getRankBadge(comment.author?.gamification);
                return (
                  <motion.div
                    key={comment._id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                    className={`bg-bg-surface border ${comment.isAccepted ? 'border-green-500/30 bg-green-500/5' : 'border-border'} rounded-xl p-4`}
                  >
                    <div className="text-sm text-text-main whitespace-pre-wrap mb-2">{comment.body}</div>
                    <div className="flex items-center gap-3 text-xs text-text-dim">
                      <span className="font-medium text-text-muted">{comment.author?.name}</span>
                      <span className={`${cRank.color} font-mono`}>{cRank.label}</span>
                      <span>{timeAgo(comment.createdAt)}</span>
                      <button onClick={async () => {
                        try { await charchaAPI.upvoteComment(comment._id); } catch (e) {}
                      }} className="hover:text-primary transition-colors flex items-center gap-1">
                        <FontAwesomeIcon icon={faThumbsUp} /> {comment.upvotes?.length || 0}
                      </button>
                      {comment.isAccepted && <span className="text-green-400">✓ Accepted</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Add Comment */}
          {!post.isLocked && (
            <div className="bg-bg-surface border border-border rounded-2xl p-4">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add your thoughts..."
                className="input bg-bg-base border-border w-full text-sm"
                rows={3}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-[11px] text-text-dim">Earn +5 XP for commenting</span>
                <button onClick={handleComment} disabled={commenting || !commentText.trim()}
                        className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-40">
                  {commenting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ======================== CREATE VIEW ========================
  if (view === 'create') {
    return (
      <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setView('browse')}
                  className="text-sm text-text-muted hover:text-primary mb-4 flex items-center gap-1">
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>

          <h1 className="text-xl font-bold text-text-main mb-6">Start a Discussion</h1>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                     placeholder="What do you want to discuss?"
                     className="input bg-bg-surface border-border w-full" required />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(1).map(c => (
                  <button key={c.value} type="button"
                          onClick={() => setForm({...form, category: c.value})}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            form.category === c.value
                              ? 'bg-primary text-black font-medium'
                              : 'bg-bg-surface text-text-muted border border-border hover:border-primary/30'
                          }`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Body</label>
              <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})}
                        placeholder="Share your question, idea, or discussion topic..."
                        className="input bg-bg-surface border-border w-full text-sm"
                        rows={8} required />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Tags (comma-separated, optional)</label>
              <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                     placeholder="react, career, first-job"
                     className="input bg-bg-surface border-border w-full" />
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full py-3 rounded-xl">
              {creating ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Post Discussion (+10 XP)'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ======================== BROWSE VIEW ========================
  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-main">💬 Charcha</h1>
            <p className="text-text-muted text-sm mt-1">Discuss, learn, collaborate — with your community</p>
          </div>
          <button onClick={() => setView('create')}
                  className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> New Post
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-sm" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search discussions..."
              className="input bg-bg-surface border-border w-full pl-10"
            />
          </div>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                      category === c.value
                        ? 'bg-primary text-black font-medium'
                        : 'bg-bg-surface text-text-muted border border-border hover:border-primary/30'
                    }`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {SORT_OPTIONS.map(s => (
            <button key={s.value} onClick={() => setSort(s.value)}
                    className={`px-3 py-1 rounded-md text-xs flex items-center gap-1 ${
                      sort === s.value ? 'text-primary font-medium' : 'text-text-dim hover:text-text-muted'
                    }`}>
              <FontAwesomeIcon icon={s.icon} /> {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-text-muted mb-4">No discussions yet in this category</p>
            <button onClick={() => setView('create')} className="btn-primary px-4 py-2 rounded-lg text-sm">
              Start the first discussion
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {discussions.map((post, i) => {
              const rank = getRankBadge(post.author?.gamification);
              return (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  onClick={() => openDetail(post._id)}
                  className={`bg-bg-surface border ${post.isPinned ? 'border-yellow-500/30' : 'border-border'} rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer`}
                >
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
                      <button onClick={e => { e.stopPropagation(); handleVote(post._id, 'up'); }}
                              className={`text-xs ${post.userVote === 'up' ? 'text-primary' : 'text-text-dim hover:text-primary'}`}>
                        <FontAwesomeIcon icon={faArrowUp} />
                      </button>
                      <span className={`text-sm font-bold ${post.score > 0 ? 'text-primary' : post.score < 0 ? 'text-red-400' : 'text-text-dim'}`}>
                        {post.score || 0}
                      </span>
                      <button onClick={e => { e.stopPropagation(); handleVote(post._id, 'down'); }}
                              className={`text-xs ${post.userVote === 'down' ? 'text-red-400' : 'text-text-dim hover:text-red-400'}`}>
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {post.isPinned && <FontAwesomeIcon icon={faThumbtack} className="text-yellow-400 text-[10px]" />}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-base text-text-dim border border-border">
                          {CATEGORIES.find(c => c.value === post.category)?.icon} {post.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-text-main mb-1 line-clamp-1">{post.title}</h3>
                      <p className="text-xs text-text-muted line-clamp-1 mb-2">{post.body}</p>
                      <div className="flex items-center gap-3 text-[11px] text-text-dim">
                        <span className="font-medium">{post.author?.name}</span>
                        <span className={`${rank.color} font-mono`}>{rank.label}</span>
                        <span>{timeAgo(post.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faComment} /> {post.commentCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faEye} /> {post.views || 0}
                        </span>
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

export default CharchaPage;
