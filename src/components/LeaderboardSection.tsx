import React, { useState } from 'react';
import { LEADERBOARD_DATA } from '../data/leaderboard';
import { LeaderboardCategory } from '../types';
import { Trophy, Clock, DollarSign, Swords, Award, Crown, Medal, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LeaderboardSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('playtime');
  const [searchQuery, setSearchQuery] = useState('');

  const currentList = LEADERBOARD_DATA[activeTab];
  const filteredList = currentList.filter(
    (item) =>
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.guild && item.guild.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const top3 = currentList.slice(0, 3);

  const tabs: { id: LeaderboardCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'playtime', label: 'Playtime', icon: <Clock className="w-4 h-4" /> },
    { id: 'money', label: 'Economy & Balance', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'kills', label: 'Combat Kills', icon: <Swords className="w-4 h-4" /> },
    { id: 'wins', label: 'Match Wins', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <section id="leaderboard" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span>Network Hall of Fame</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight">
            Player Leaderboards
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Celebrating the greatest champions, wealthiest tycoons, and fiercest duelists on Butterfly Network.
          </p>
          <div className="inline-block mt-2">
            <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full">
              Simulated Live Demo Standings (Updated Hourly)
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40 scale-105'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Top 3 Podium (Desktop & Tablet) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end max-w-4xl mx-auto">
          {/* Rank 2 (Left) */}
          {top3[1] && (
            <motion.div
              key={`podium-2-${top3[1].username}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass-panel rounded-2xl p-6 border border-slate-400/30 relative flex flex-col items-center text-center order-2 md:order-1 bg-gradient-to-b from-slate-900/60 to-slate-950/80"
            >
              <div className="w-8 h-8 rounded-full bg-slate-300/20 border border-slate-300/40 flex items-center justify-center text-slate-200 font-bold text-sm mb-3">
                2
              </div>
              <div className="relative mb-3">
                <img
                  src={top3[1].avatarUrl}
                  alt={top3[1].username}
                  className="w-16 h-16 rounded-xl border-2 border-slate-300 shadow-md object-cover bg-black/40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${top3[1].username}&background=334155&color=fff`;
                  }}
                />
                <Medal className="w-5 h-5 text-slate-300 absolute -bottom-2 -right-2 drop-shadow" />
              </div>
              <h3 className="font-heading font-bold text-lg text-white">{top3[1].username}</h3>
              {top3[1].guild && (
                <span className="text-xs text-purple-300 font-mono">[{top3[1].guild}]</span>
              )}
              <div className="mt-3 py-1.5 px-3 rounded-lg bg-black/40 border border-white/5 font-mono font-bold text-slate-200 text-sm">
                {top3[1].score}
              </div>
            </motion.div>
          )}

          {/* Rank 1 (Center - Elevated) */}
          {top3[0] && (
            <motion.div
              key={`podium-1-${top3[0].username}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-panel rounded-2xl p-6 sm:p-8 border-2 border-amber-400/60 relative flex flex-col items-center text-center order-1 md:order-2 bg-gradient-to-b from-purple-950/50 via-amber-950/20 to-black/80 shadow-2xl shadow-amber-900/20 md:-translate-y-4"
            >
              {/* Crown on top */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center font-bold text-base shadow-[0_0_15px_rgba(245,158,11,0.6)] mb-3">
                <Crown className="w-5 h-5 fill-amber-950 text-amber-950" />
              </div>
              <div className="relative mb-3">
                <img
                  src={top3[0].avatarUrl}
                  alt={top3[0].username}
                  className="w-20 h-20 rounded-2xl border-2 border-amber-400 shadow-xl shadow-amber-500/20 object-cover bg-black/40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${top3[0].username}&background=d97706&color=fff`;
                  }}
                />
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold uppercase tracking-wide">
                  #1 Rank
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-xl text-amber-200">{top3[0].username}</h3>
              {top3[0].guild && (
                <span className="text-xs text-purple-300 font-mono">[{top3[0].guild}]</span>
              )}
              <div className="mt-3 py-2 px-4 rounded-xl bg-amber-500/20 border border-amber-400/40 font-mono font-extrabold text-amber-300 text-base shadow-inner">
                {top3[0].score}
              </div>
            </motion.div>
          )}

          {/* Rank 3 (Right) */}
          {top3[2] && (
            <motion.div
              key={`podium-3-${top3[2].username}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass-panel rounded-2xl p-6 border border-amber-700/40 relative flex flex-col items-center text-center order-3 md:order-3 bg-gradient-to-b from-amber-950/40 to-slate-950/80"
            >
              <div className="w-8 h-8 rounded-full bg-amber-700/30 border border-amber-700/50 flex items-center justify-center text-amber-400 font-bold text-sm mb-3">
                3
              </div>
              <div className="relative mb-3">
                <img
                  src={top3[2].avatarUrl}
                  alt={top3[2].username}
                  className="w-16 h-16 rounded-xl border-2 border-amber-600 shadow-md object-cover bg-black/40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${top3[2].username}&background=92400e&color=fff`;
                  }}
                />
                <Medal className="w-5 h-5 text-amber-600 absolute -bottom-2 -right-2 drop-shadow" />
              </div>
              <h3 className="font-heading font-bold text-lg text-white">{top3[2].username}</h3>
              {top3[2].guild && (
                <span className="text-xs text-purple-300 font-mono">[{top3[2].guild}]</span>
              )}
              <div className="mt-3 py-1.5 px-3 rounded-lg bg-black/40 border border-white/5 font-mono font-bold text-amber-300 text-sm">
                {top3[2].score}
              </div>
            </motion.div>
          )}
        </div>

        {/* Full Table */}
        <div className="glass-panel rounded-2xl border overflow-hidden">
          {/* Table Controls / Search */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Full Standings Ranking</span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player or guild..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Table rows */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-semibold uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                  <th className="py-3 px-4 sm:px-6 w-16 text-center">Rank</th>
                  <th className="py-3 px-4 sm:px-6">Player</th>
                  <th className="py-3 px-4 sm:px-6 hidden sm:table-cell">Badge</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-sm">
                {filteredList.length > 0 ? (
                  filteredList.map((entry) => (
                    <tr
                      key={entry.rank + entry.username}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        entry.rank <= 3 ? 'bg-purple-500/[0.02]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 sm:px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono ${
                            entry.rank === 1
                              ? 'bg-amber-400 text-black font-extrabold'
                              : entry.rank === 2
                              ? 'bg-slate-300 text-black font-bold'
                              : entry.rank === 3
                              ? 'bg-amber-700 text-white font-bold'
                              : 'text-slate-400 bg-white/5'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>

                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.avatarUrl}
                            alt={entry.username}
                            className="w-8 h-8 rounded-lg border border-white/10 bg-black/40"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${entry.username}&background=1e1b4b&color=c084fc`;
                            }}
                          />
                          <div>
                            <span className="font-semibold text-white">{entry.username}</span>
                            {entry.guild && (
                              <span className="ml-2 text-xs text-purple-300 font-mono">
                                [{entry.guild}]
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 sm:px-6 hidden sm:table-cell">
                        {entry.badge && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
                            {entry.badge}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 sm:px-6 text-right font-mono font-bold text-slate-100">
                        {entry.score}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                      No players found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
