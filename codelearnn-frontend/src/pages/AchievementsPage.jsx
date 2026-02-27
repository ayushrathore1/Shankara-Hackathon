import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gamificationAPI } from '../services/api';

const TIER_COLORS = {
  bronze: { bg: 'from-amber-900/30 to-amber-700/10', border: 'border-amber-700/40', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  silver: { bg: 'from-gray-400/20 to-gray-300/5', border: 'border-gray-400/40', text: 'text-gray-300', glow: 'shadow-gray-400/20' },
  gold: { bg: 'from-yellow-600/25 to-yellow-400/10', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
  platinum: { bg: 'from-cyan-500/20 to-cyan-300/5', border: 'border-cyan-400/40', text: 'text-cyan-300', glow: 'shadow-cyan-400/25' },
  diamond: { bg: 'from-purple-500/25 to-pink-400/10', border: 'border-purple-400/50', text: 'text-purple-300', glow: 'shadow-purple-500/30' },
};

const CATEGORY_LABELS = {
  'skill-mastery': { label: 'Skill Mastery', icon: '🎯' },
  'consistency': { label: 'Consistency', icon: '🔥' },
  'collaboration': { label: 'Collaboration', icon: '🤝' },
  'career-milestone': { label: 'Career', icon: '🚀' },
  'learning': { label: 'Learning', icon: '📚' },
  'community': { label: 'Community', icon: '💬' },
  'explorer': { label: 'Explorer', icon: '🔍' },
};

const AchievementsPage = () => {
  const [definitions, setDefinitions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTier, setActiveTier] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [defsRes, profileRes] = await Promise.all([
        gamificationAPI.getDefinitions(),
        gamificationAPI.getProfile()
      ]);
      setDefinitions(defsRes.data?.data || []);
      setProfile(profileRes.data?.data || null);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = definitions.filter(d => {
    if (activeCategory !== 'all' && d.category !== activeCategory) return false;
    if (activeTier !== 'all' && d.tier !== activeTier) return false;
    return true;
  });

  const unlockedCount = definitions.filter(d => d.unlocked).length;
  const totalCount = definitions.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-h2 text-text-main mb-2">Achievements</h1>
          <p className="text-text-muted text-lg">
            {unlockedCount} of {totalCount} unlocked
          </p>
          {/* Progress bar */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="h-2 bg-bg-surface rounded-full overflow-hidden border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
          >
            {[
              { label: 'Total XP', value: profile.totalXP?.toLocaleString() || '0', icon: '⚡' },
              { label: 'Career Rank', value: profile.rank?.title || 'Intern', icon: profile.rank?.icon || '🌱' },
              { label: 'Current Streak', value: `${profile.streak?.current || 0}d`, icon: '🔥' },
              { label: 'Achievements', value: `${unlockedCount}/${totalCount}`, icon: '🏆' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-bg-surface border border-border rounded-xl p-4 text-center"
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-text-main">{stat.value}</div>
                <div className="text-xs text-text-muted">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Rank Progress */}
        {profile?.rank?.nextRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-bg-surface border border-border rounded-xl p-6 mb-10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{profile.rank.icon}</span>
                <span className="text-text-main font-semibold">{profile.rank.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-sm">Next:</span>
                <span className="text-xl">{profile.rank.nextRank.icon}</span>
                <span className="text-text-main font-semibold">{profile.rank.nextRank.title}</span>
              </div>
            </div>
            <div className="h-3 bg-bg-base rounded-full overflow-hidden border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile.rank.progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
              />
            </div>
            <p className="text-text-dim text-xs mt-2 text-right">
              {profile.rank.nextRank.xpNeeded.toLocaleString()} XP to next rank
            </p>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary text-black'
                  : 'bg-bg-surface text-text-muted hover:text-text-main border border-border'
              }`}
            >
              All
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === key
                    ? 'bg-primary text-black'
                    : 'bg-bg-surface text-text-muted hover:text-text-main border border-border'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Tier filter */}
          <div className="flex flex-wrap gap-2 ml-auto">
            {['all', 'bronze', 'silver', 'gold', 'platinum', 'diamond'].map(tier => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTier === tier
                    ? 'bg-primary text-black'
                    : 'bg-bg-surface text-text-muted hover:text-text-main border border-border'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((ach, i) => {
              const tier = TIER_COLORS[ach.tier] || TIER_COLORS.bronze;
              const cat = CATEGORY_LABELS[ach.category] || { label: ach.category, icon: '❓' };
              
              return (
                <motion.div
                  key={ach.achievementId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  className={`relative rounded-xl border p-5 transition-all ${
                    ach.unlocked
                      ? `bg-gradient-to-br ${tier.bg} ${tier.border} shadow-lg ${tier.glow}`
                      : 'bg-bg-surface/40 border-border/30 opacity-50 grayscale'
                  }`}
                >
                  {/* Tier badge */}
                  <div className={`absolute top-3 right-3 text-xs font-bold uppercase ${tier.text} px-2 py-0.5 rounded-full bg-bg-base/50 border ${tier.border}`}>
                    {ach.tier}
                  </div>

                  {/* Icon */}
                  <div className="text-3xl mb-3">
                    {ach.unlocked ? ach.icon : '🔒'}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-text-main font-semibold text-base mb-1">{ach.title}</h3>
                  <p className="text-text-muted text-sm mb-3">{ach.description}</p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-dim">{cat.icon} {cat.label}</span>
                    <span className="text-primary font-medium">+{ach.xpReward} XP</span>
                  </div>

                  {/* Unlocked date */}
                  {ach.unlocked && ach.unlockedAt && (
                    <div className="mt-2 text-xs text-text-dim text-right">
                      Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <p className="text-lg">No achievements found for this filter.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default AchievementsPage;
