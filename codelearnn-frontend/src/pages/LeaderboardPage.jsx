import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faMedal,
  faFire,
  faBolt,
  faArrowUp,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { gamificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = [
  'from-blue-500 to-purple-500',
  'from-green-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-yellow-500 to-orange-500',
];

const PODIUM_STYLES = [
  { height: 'h-28', bg: 'from-yellow-400/20 to-yellow-600/20', border: 'border-yellow-500/30', icon: '🥇', ring: 'ring-yellow-500/50' },
  { height: 'h-20', bg: 'from-gray-300/20 to-gray-500/20', border: 'border-gray-400/30', icon: '🥈', ring: 'ring-gray-400/50' },
  { height: 'h-16', bg: 'from-amber-600/20 to-amber-800/20', border: 'border-amber-600/30', icon: '🥉', ring: 'ring-amber-600/50' },
];

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    loadLeaderboard();
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await gamificationAPI.getLeaderboard(50);
      setLeaders(res.data?.data || []);
    } catch (e) {
      console.error('Leaderboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const userRank = leaders.findIndex(l => l._id === user?._id) + 1;

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-text-main mb-2">
            <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 mr-2" />
            Leaderboard
          </h1>
          <p className="text-text-muted text-sm">Top developers ranked by XP</p>
          {userRank > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
              <FontAwesomeIcon icon={faArrowUp} /> You're #{userRank}
            </div>
          )}
        </motion.div>

        {/* Time Filter */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { value: 'all', label: 'All Time' },
            { value: 'month', label: 'This Month' },
            { value: 'week', label: 'This Week' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === f.value
                  ? 'bg-primary text-black'
                  : 'bg-bg-surface text-text-muted border border-border hover:border-primary/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-text-muted">No data yet. Start learning to appear on the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Podium — Top 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-end justify-center gap-4 mb-10"
            >
              {/* Reorder: 2nd, 1st, 3rd */}
              {[top3[1], top3[0], top3[2]].map((leader, displayIdx) => {
                if (!leader) return <div key={displayIdx} className="w-24" />;
                const actualRank = displayIdx === 0 ? 1 : displayIdx === 1 ? 0 : 2;
                const style = PODIUM_STYLES[actualRank];
                const gradient = AVATAR_COLORS[(leader.avatarIndex || 0) % AVATAR_COLORS.length];
                const isCurrentUser = leader._id === user?._id;

                return (
                  <div key={leader._id} className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold mb-2 ring-2 ${style.ring} ${isCurrentUser ? 'ring-4 ring-primary' : ''}`}>
                      {leader.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <p className="text-xs font-semibold text-text-main truncate max-w-[80px] text-center">
                      {leader.name}
                    </p>
                    <p className="text-[10px] text-primary font-mono">{leader.gamification?.totalXP?.toLocaleString() || 0} XP</p>
                    {/* Podium block */}
                    <div className={`w-20 ${style.height} rounded-t-lg bg-gradient-to-b ${style.bg} border ${style.border} border-b-0 mt-2 flex items-center justify-center`}>
                      <span className="text-2xl">{style.icon}</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Rest of leaderboard */}
            <div className="space-y-2">
              {rest.map((leader, i) => {
                const rank = i + 4;
                const gradient = AVATAR_COLORS[(leader.avatarIndex || i) % AVATAR_COLORS.length];
                const isCurrentUser = leader._id === user?._id;

                return (
                  <motion.div
                    key={leader._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isCurrentUser
                        ? 'bg-primary/10 border-2 border-primary/30'
                        : 'bg-bg-surface border border-border hover:border-primary/20'
                    }`}
                  >
                    {/* Rank */}
                    <span className="text-sm font-mono text-text-dim w-8 text-center">#{rank}</span>

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {leader.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    {/* Name & rank */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">
                        {leader.name}
                        {isCurrentUser && <span className="text-primary text-xs ml-1">(You)</span>}
                      </p>
                      <p className="text-[11px] text-text-dim">
                        {leader.gamification?.careerRank || 'Intern'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary font-mono">
                          <FontAwesomeIcon icon={faBolt} className="mr-1 text-xs" />
                          {leader.gamification?.totalXP?.toLocaleString() || 0}
                        </div>
                      </div>
                      {leader.gamification?.currentStreak > 0 && (
                        <div className="text-xs text-orange-400 flex items-center gap-1">
                          <FontAwesomeIcon icon={faFire} />
                          {leader.gamification.currentStreak}d
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default LeaderboardPage;
