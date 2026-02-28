import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode,
  faPlus,
  faSpinner,
  faTimes,
  faEye,
  faPaperPlane,
  faBolt,
  faComments,
  faStar,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { codeReviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', color: 'text-yellow-400' },
  { value: 'python', label: 'Python', color: 'text-blue-400' },
  { value: 'java', label: 'Java', color: 'text-red-400' },
  { value: 'typescript', label: 'TypeScript', color: 'text-blue-500' },
  { value: 'cpp', label: 'C++', color: 'text-purple-400' },
  { value: 'go', label: 'Go', color: 'text-cyan-400' },
  { value: 'rust', label: 'Rust', color: 'text-orange-400' },
  { value: 'html', label: 'HTML', color: 'text-orange-500' },
  { value: 'css', label: 'CSS', color: 'text-blue-300' },
  { value: 'sql', label: 'SQL', color: 'text-green-400' },
  { value: 'other', label: 'Other', color: 'text-gray-400' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'in-review': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  reviewed: 'bg-green-500/10 text-green-400 border-green-500/20',
  resolved: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const CodeReviewPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('browse'); // browse | detail | submit
  const [selectedReview, setSelectedReview] = useState(null);
  const [langFilter, setLangFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ feedback: '', rating: 0 });

  // Submit form
  const [form, setForm] = useState({
    title: '', description: '', language: 'javascript', code: '', skill: ''
  });

  useEffect(() => { loadReviews(); }, [langFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = {};
      if (langFilter) params.language = langFilter;
      const res = await codeReviewAPI.getPending(params);
      setReviews(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await codeReviewAPI.getById(id);
      setSelectedReview(res.data?.data);
      setView('detail');
    } catch (e) {
      alert('Failed to load review');
    }
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await codeReviewAPI.submit(form);
      setForm({ title: '', description: '', language: 'javascript', code: '', skill: '' });
      setView('browse');
      loadReviews();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.feedback.trim()) return alert('Please add feedback');
    setSubmitting(true);
    try {
      await codeReviewAPI.submitReview(selectedReview._id, {
        overallFeedback: reviewForm.feedback,
        rating: reviewForm.rating || undefined
      });
      setView('browse');
      setReviewForm({ feedback: '', rating: 0 });
      loadReviews();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // === DETAIL VIEW ===
  if (view === 'detail' && selectedReview) {
    const isAuthor = (selectedReview.author?._id) === user?._id;
    return (
      <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => { setView('browse'); setSelectedReview(null); }}
                  className="text-sm text-text-muted hover:text-primary mb-4 flex items-center gap-1">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to reviews
          </button>

          <div className="bg-bg-surface border border-border rounded-2xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-main">{selectedReview.title}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[selectedReview.status]}`}>
                {selectedReview.status}
              </span>
            </div>
            {selectedReview.description && (
              <p className="text-sm text-text-muted mb-4">{selectedReview.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-text-dim mb-4">
              <span>By {selectedReview.author?.name}</span>
              <span className={LANGUAGES.find(l => l.value === selectedReview.language)?.color}>
                {selectedReview.language}
              </span>
              {selectedReview.skill && <span className="text-primary">#{selectedReview.skill}</span>}
            </div>
          </div>

          {/* Code */}
          <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden mb-4">
            <div className="px-4 py-2 bg-bg-elevated border-b border-border text-xs text-text-dim font-mono">
              {selectedReview.language}
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-text-main leading-relaxed">
              {selectedReview.code?.split('\n').map((line, i) => (
                <div key={i} className="flex hover:bg-bg-elevated/50">
                  <span className="text-text-dim w-10 text-right mr-4 select-none flex-shrink-0">{i + 1}</span>
                  <span>{line || ' '}</span>
                </div>
              ))}
            </pre>
          </div>

          {/* Existing comments */}
          {selectedReview.reviewComments?.length > 0 && (
            <div className="bg-bg-surface border border-border rounded-2xl p-6 mb-4">
              <h3 className="text-sm font-bold text-text-main mb-3">
                <FontAwesomeIcon icon={faComments} className="mr-2" />
                Review Comments
              </h3>
              <div className="space-y-3">
                {selectedReview.reviewComments.map((c, i) => (
                  <div key={i} className="bg-bg-base rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-text-main">{c.reviewer?.name || 'Reviewer'}</span>
                      {c.lineStart && <span className="text-[10px] text-text-dim font-mono">L{c.lineStart}{c.lineEnd ? `-${c.lineEnd}` : ''}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        c.type === 'issue' ? 'bg-red-500/10 text-red-400'
                          : c.type === 'praise' ? 'bg-green-500/10 text-green-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>{c.type}</span>
                    </div>
                    <p className="text-sm text-text-muted">{c.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall feedback */}
          {selectedReview.overallFeedback && (
            <div className="bg-bg-surface border border-border rounded-2xl p-6 mb-4">
              <h3 className="text-sm font-bold text-text-main mb-2">Overall Feedback</h3>
              <p className="text-sm text-text-muted">{selectedReview.overallFeedback}</p>
              {selectedReview.rating && (
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map(s => (
                    <FontAwesomeIcon key={s} icon={faStar}
                      className={s <= selectedReview.rating ? 'text-yellow-400' : 'text-text-dim'} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit review (if not author and pending) */}
          {!isAuthor && selectedReview.status === 'pending' && (
            <div className="bg-bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-text-main mb-3">Submit Your Review</h3>
              <textarea
                value={reviewForm.feedback}
                onChange={e => setReviewForm({...reviewForm, feedback: e.target.value})}
                placeholder="Your feedback on this code..."
                className="input bg-bg-base border-border w-full mb-3"
                rows={4}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-dim mr-1">Rating:</span>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setReviewForm({...reviewForm, rating: s})}>
                      <FontAwesomeIcon icon={faStar}
                        className={`text-sm ${s <= reviewForm.rating ? 'text-yellow-400' : 'text-text-dim hover:text-yellow-400/50'} transition-colors`} />
                    </button>
                  ))}
                </div>
                <button onClick={handleSubmitReview} disabled={submitting}
                        className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                  Submit Review (+30 XP)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // === SUBMIT VIEW ===
  if (view === 'submit') {
    return (
      <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setView('browse')}
                  className="text-sm text-text-muted hover:text-primary mb-4 flex items-center gap-1">
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>

          <h1 className="text-xl font-bold text-text-main mb-6">Submit Code for Review</h1>

          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                     placeholder="What does this code do?"
                     className="input bg-bg-surface border-border w-full" required />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Description (optional)</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                     placeholder="What kind of feedback are you looking for?"
                     className="input bg-bg-surface border-border w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Language</label>
                <select value={form.language} onChange={e => setForm({...form, language: e.target.value})}
                        className="input bg-bg-surface border-border w-full">
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Skill Tag (optional)</label>
                <input value={form.skill} onChange={e => setForm({...form, skill: e.target.value})}
                       placeholder="e.g. React hooks"
                       className="input bg-bg-surface border-border w-full" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Your Code</label>
              <textarea
                value={form.code}
                onChange={e => setForm({...form, code: e.target.value})}
                placeholder="Paste your code here..."
                className="input bg-bg-surface border-border w-full font-mono text-sm"
                rows={15}
                required
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 rounded-xl">
              {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit for Review (+15 XP)'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // === BROWSE VIEW ===
  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-main">
              <FontAwesomeIcon icon={faCode} className="text-primary mr-2" />
              Code Review
            </h1>
            <p className="text-text-muted text-sm mt-1">Submit code or review others — earn XP for both</p>
          </div>
          <button onClick={() => setView('submit')}
                  className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> Submit Code
          </button>
        </div>

        {/* Language Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button onClick={() => setLangFilter('')}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                    !langFilter ? 'bg-primary text-black font-medium' : 'bg-bg-surface text-text-muted border border-border'
                  }`}>
            All
          </button>
          {LANGUAGES.slice(0, 6).map(l => (
            <button key={l.value} onClick={() => setLangFilter(l.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                      langFilter === l.value ? 'bg-primary text-black font-medium' : 'bg-bg-surface text-text-muted border border-border'
                    }`}>
              {l.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-text-muted mb-4">No pending reviews</p>
            <button onClick={() => setView('submit')} className="btn-primary px-4 py-2 rounded-lg text-sm">
              Be the first to submit code
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                onClick={() => openDetail(review._id)}
                className="bg-bg-surface border border-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-main">{review.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[review.status]}`}>
                        {review.status}
                      </span>
                    </div>
                    {review.description && (
                      <p className="text-xs text-text-muted mb-2 line-clamp-1">{review.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-text-dim">
                      <span>{review.author?.name}</span>
                      <span className={LANGUAGES.find(l => l.value === review.language)?.color}>
                        {review.language}
                      </span>
                      {review.skill && <span className="text-primary">#{review.skill}</span>}
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary ml-4">
                    <FontAwesomeIcon icon={faBolt} /> +30 XP
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default CodeReviewPage;
