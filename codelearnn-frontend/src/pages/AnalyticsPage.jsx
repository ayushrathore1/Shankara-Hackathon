import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire, faBolt, faCalendar, faChartLine, faSpinner, faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { gamificationAPI } from '../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Mon','','Wed','','Fri','',''];

const AnalyticsPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await gamificationAPI.getProfile();
      setProfile(res.data?.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Generate heatmap data (last 365 days)
  const generateHeatmap = () => {
    const data = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Simulate activity based on streak data
      const dayOfWeek = date.getDay();
      const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
      const rand = Math.random();
      let level = 0;
      if (rand > 0.6) level = 1;
      if (rand > 0.75) level = 2;
      if (rand > 0.85) level = 3;
      if (rand > 0.93) level = 4;
      if (!isWeekday && rand < 0.5) level = 0;
      data.push({ date, level });
    }
    return data;
  };

  const heatmapData = generateHeatmap();
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const HEATMAP_COLORS = [
    'bg-bg-elevated',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/70',
    'bg-primary',
  ];

  // Skill radar data
  const skills = [
    { name: 'Frontend', value: 78 },
    { name: 'Backend', value: 65 },
    { name: 'DevOps', value: 40 },
    { name: 'DSA', value: 55 },
    { name: 'System Design', value: 35 },
    { name: 'AI/ML', value: 25 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
      </div>
    );
  }

  const g = profile || {};

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-text-main">📊 Learning Analytics</h1>
          <p className="text-text-muted text-sm mt-1">Your learning patterns and skill growth</p>
        </motion.div>

        {/* Stats Row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total XP', value: (g.totalXP || 0).toLocaleString(), icon: faBolt, color: 'text-primary' },
            { label: 'Current Streak', value: `${g.streak?.current || 0}d`, icon: faFire, color: 'text-orange-400' },
            { label: 'Longest Streak', value: `${g.streak?.longest || 0}d`, icon: faTrophy, color: 'text-yellow-400' },
            { label: 'Achievements', value: g.achievements?.length || 0, icon: faCalendar, color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-bg-surface border border-border rounded-xl p-4">
              <FontAwesomeIcon icon={stat.icon} className={`${stat.color} mb-2`} />
              <div className="text-xl font-bold text-text-main">{stat.value}</div>
              <div className="text-xs text-text-muted">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
            Learning Activity
          </h2>
          <div className="overflow-x-auto">
            <div className="flex gap-[3px] min-w-[680px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] mr-2 text-[10px] text-text-dim">
                {DAYS.map((d, i) => <div key={i} className="h-[13px] flex items-center">{d}</div>)}
              </div>
              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`w-[13px] h-[13px] rounded-sm ${HEATMAP_COLORS[day.level]}`}
                      title={`${day.date.toLocaleDateString()} — Level ${day.level}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-text-dim">
            <span>Less</span>
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className={`w-[11px] h-[11px] rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </motion.div>

        {/* Skill Radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-6">
            Skill Distribution
          </h2>
          <div className="space-y-3">
            {skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-28 text-right">{skill.name}</span>
                <div className="flex-1 h-3 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.value}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  />
                </div>
                <span className="text-xs text-text-main font-mono w-10">{skill.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Career Rank Progress */}
        {g.rank && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-bg-surface border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
              Career Rank Progress
            </h2>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-3xl">{g.rank.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-text-main">{g.rank.title}</span>
                  {g.rank.nextRank && (
                    <span className="text-xs text-text-dim">Next: {g.rank.nextRank} ({g.rank.xpToNext?.toLocaleString()} XP)</span>
                  )}
                </div>
                <div className="h-3 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${g.rank.progress || 0}%` }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Streak Calendar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
            This Month
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] text-text-dim font-medium">
                {['S','M','T','W','T','F','S'][i]}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              const offset = firstDay.getDay();
              const day = i - offset + 1;
              const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              const isValid = day >= 1 && day <= daysInMonth;
              const isToday = day === today.getDate();
              const isPast = day < today.getDate();
              const isActive = isPast && Math.random() > 0.3;

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                    !isValid ? ''
                      : isToday ? 'bg-primary text-black font-bold ring-2 ring-primary/50'
                      : isActive ? 'bg-primary/20 text-primary'
                      : 'bg-bg-elevated text-text-dim'
                  }`}
                >
                  {isValid ? day : ''}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default AnalyticsPage;
