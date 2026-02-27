import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { publicProfileAPI } from '../services/api';

const TIER_COLORS = {
  bronze: 'text-amber-400 bg-amber-500/10 border-amber-600/30',
  silver: 'text-gray-300 bg-gray-500/10 border-gray-500/30',
  gold: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  platinum: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/30',
  diamond: 'text-purple-300 bg-purple-500/10 border-purple-400/30',
};

const AVATAR_COLORS = [
  'from-blue-500 to-purple-500',
  'from-green-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-yellow-500 to-orange-500',
];

const PublicProfilePage = () => {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [slug]);

  const loadProfile = async () => {
    try {
      const res = await publicProfileAPI.getBySlug(slug);
      setProfile(res.data?.data || null);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Profile not found' : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">👤</p>
          <h1 className="text-xl font-bold text-text-main mb-2">{error || 'Profile not found'}</h1>
          <p className="text-text-muted">This profile doesn't exist or is private.</p>
        </div>
      </div>
    );
  }

  const g = profile.gamification || {};
  const avatarGradient = AVATAR_COLORS[profile.avatarIndex % AVATAR_COLORS.length];

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-surface border border-border rounded-2xl p-8 text-center mb-6"
        >
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarGradient} mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4`}>
            {profile.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          <h1 className="text-2xl font-bold text-text-main mb-1">{profile.name}</h1>
          {profile.bio && <p className="text-text-muted text-sm mb-3">{profile.bio}</p>}
          {profile.careerGoal && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              🎯 {profile.careerGoal}
            </div>
          )}

          {/* Rank */}
          {g.rank && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xl">{g.rank.icon}</span>
              <span className="font-semibold text-text-main">{g.rank.title}</span>
            </div>
          )}

          <div className="text-xs text-text-dim mt-2">
            Member since {new Date(profile.memberSince).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Total XP', value: g.totalXP?.toLocaleString() || '0', icon: '⚡' },
            { label: 'Streak', value: `${g.currentStreak || 0}d`, icon: '🔥' },
            { label: 'Longest Streak', value: `${g.longestStreak || 0}d`, icon: '🏆' },
            { label: 'Achievements', value: `${g.achievementsCount || 0}/${g.totalAchievements || 0}`, icon: '🏅' },
          ].map((stat, i) => (
            <div key={i} className="bg-bg-surface border border-border rounded-xl p-4 text-center">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-lg font-bold text-text-main">{stat.value}</div>
              <div className="text-xs text-text-muted">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-bg-surface border border-border rounded-2xl p-6 mb-6"
          >
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">🏅 Badges</h2>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${TIER_COLORS[badge.tier] || TIER_COLORS.bronze}`}
                  title={`Earned ${new Date(badge.earnedAt).toLocaleDateString()}`}
                >
                  {badge.icon || '🏅'} {badge.name}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Achievements */}
        {profile.achievements?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-surface border border-border rounded-2xl p-6 mb-6"
          >
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">🏆 Recent Achievements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.achievements.map((ach, i) => (
                <div
                  key={i}
                  className="text-center p-3 rounded-xl bg-bg-base border border-border"
                >
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <div className="text-xs font-semibold text-text-main">{ach.title}</div>
                  <div className={`text-[10px] capitalize ${TIER_COLORS[ach.tier]?.split(' ')[0] || 'text-text-dim'}`}>
                    {ach.tier}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-bg-surface border border-border rounded-2xl p-6 mb-6"
          >
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">🎯 Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg text-sm bg-primary/10 text-primary border border-primary/20 font-medium"
                >
                  {typeof skill === 'string' ? skill : skill.name || skill.skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Project Showcase */}
        {profile.projectShowcase?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-bg-surface border border-border rounded-2xl p-6"
          >
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">🚀 Projects</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {profile.projectShowcase.map((project, i) => (
                <a
                  key={i}
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-bg-base border border-border hover:border-primary/30 transition-all group"
                >
                  <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors mb-1">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-text-muted line-clamp-2 mb-2">{project.description}</p>
                  )}
                  {project.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.skills.slice(0, 4).map((s, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-text-dim border border-border">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default PublicProfilePage;
