import React, { useEffect, useState } from 'react';
import { fetchGameModes } from '../lib/gameModes';
import { GameModeIcon } from '../lib/gameModeIcons';
import { useRouter } from '../hooks/useRouter';
import { SERVER_CONFIG } from '../config/server';
import { CopyIpButton } from '../components/CopyIpButton';
import { 
  Gamepad2,
  Users, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GamesPageProps {
  onOpenPlayModal: () => void;
}

export const GamesPage: React.FC<GamesPageProps> = ({ onOpenPlayModal }) => {
  const { navigate } = useRouter();
  const [games, setGames] = useState<GameMode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('All');

  useEffect(() => {
    document.title = 'Game Modes | Butterfly Network';

    async function fetchGamesFromSupabase() {
      try {
        setLoading(true);
        setGames(await fetchGameModes());
      } catch (err) {
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGamesFromSupabase();
  }, []);

  const allTags = [
    'All',
    ...Array.from(
      new Set(
        games
          .flatMap((mode) => mode.tags)
          .filter(Boolean)
          .map((tag) => tag.trim())
      )
    ).sort((a, b) => a.localeCompare(b)),
  ];

  const filteredModes = games.filter((mode) => {
    if (selectedTag === 'All') return true;
    const tags = mode.tags || [];
    return tags.some((t: string) => t.toLowerCase() === selectedTag.toLowerCase());
  });

  if (loading) {
    return (
      <div className="pt-28 pb-20 text-center text-white">
        <p className="animate-pulse text-lg">Loading Game Modes...</p>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Discover Every Game Mode</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            Butterfly Network Game Modes
          </h1>

          <p className="text-slate-300 text-base sm:text-lg">
            Explore our custom-engineered Minecraft experiences. Every mode is optimized for maximum performance, balanced gameplay, and fair fun.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTag === tag
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredModes.map((mode, idx) => (
            <motion.div
              key={mode.id || mode.slug || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => navigate(`/games/${mode.slug}`)}
              className="group rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <GameModeIcon name={mode.iconName} url={mode.iconUrl} className="h-8 w-8 text-purple-400" />
                  </div>
                  {mode.badge && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {mode.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-white font-heading group-hover:text-purple-300 transition-colors mb-2">
                  {mode.name}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-5 min-h-[60px]">
                  {mode.shortDescription || mode.short_description || mode.longDescription}
                </p>

                {/* Features Preview */}
                {mode.features && mode.features.length > 0 && (
                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Highlights</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {mode.features.slice(0, 3).map((feat: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>{mode.playerCountEstimate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPlayModal();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500"
                  >
                    Play
                  </button>
                  <span className="text-xs font-semibold text-purple-300 group-hover:underline inline-flex items-center gap-1">
                    <span>Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global Connection Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-white/[0.02] border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-heading">
              Ready to jump into any game mode?
            </h3>
            <p className="text-sm text-slate-300">
              One server IP gives you instant access to all modes via our interactive hub selector.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <CopyIpButton ip={SERVER_CONFIG?.javaIp} label="Copy Server IP" variant="primary" className="w-full md:w-auto" />
            <button
              onClick={onOpenPlayModal}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 shrink-0"
            >
              How to Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};