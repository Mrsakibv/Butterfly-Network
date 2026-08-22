import React from 'react';
import { GAME_MODES } from '../data/gameModes';
import { useRouter } from '../hooks/useRouter';
import { GameMode } from '../types';
import { 
  Crown, 
  BedDouble, 
  Swords, 
  Compass, 
  HeartCrack, 
  Skull, 
  Users, 
  ArrowUpRight, 
  Sparkles, 
  Gamepad2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface GameModesSectionProps {
  onOpenPlayModal: () => void;
  showAll?: boolean;
}

export const GameModesSection: React.FC<GameModesSectionProps> = ({ onOpenPlayModal, showAll = true }) => {
  const { navigate } = useRouter();

  const getIcon = (name: string) => {
    const props = { className: 'w-6 h-6' };
    switch (name) {
      case 'Crown': return <Crown {...props} className="w-6 h-6 text-purple-400" />;
      case 'BedDouble': return <BedDouble {...props} className="w-6 h-6 text-rose-400" />;
      case 'Swords': return <Swords {...props} className="w-6 h-6 text-cyan-400" />;
      case 'Compass': return <Compass {...props} className="w-6 h-6 text-emerald-400" />;
      case 'HeartCrack': return <HeartCrack {...props} className="w-6 h-6 text-red-400" />;
      case 'Skull': return <Skull {...props} className="w-6 h-6 text-violet-400" />;
      default: return <Gamepad2 {...props} className="w-6 h-6 text-purple-400" />;
    }
  };

  const getGradientBorder = (id: string) => {
    switch (id) {
      case 'skyblock': return 'hover:border-purple-500/50 hover:shadow-purple-900/20';
      case 'bedwars': return 'hover:border-rose-500/50 hover:shadow-rose-900/20';
      case 'skywars': return 'hover:border-cyan-500/50 hover:shadow-cyan-900/20';
      case 'survival': return 'hover:border-emerald-500/50 hover:shadow-emerald-900/20';
      case 'lifesteal': return 'hover:border-red-500/50 hover:shadow-red-900/20';
      case 'headsteal': return 'hover:border-violet-500/50 hover:shadow-violet-900/20';
      default: return 'hover:border-purple-500/50';
    }
  };

  const getBadgeColor = (id: string) => {
    switch (id) {
      case 'skyblock': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'bedwars': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'skywars': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'survival': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'lifesteal': return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'headsteal': return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      default: return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <section id="game-modes" className="py-20 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[400px] bg-purple-900/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Curated Game Experiences</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight">
            Featured Game Modes
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Choose your battlefield. From tranquil island management to intense survival combat, Butterfly Network offers an adventure for every playstyle.
          </p>
        </div>

        {/* Game Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {GAME_MODES.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              onClick={() => navigate(`/games/${mode.slug}`)}
              className={`group relative rounded-2xl glass-panel-interactive border p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 ${getGradientBorder(
                mode.id
              )}`}
            >
              {/* Card Top: Icon, Badge, Player Count */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    {getIcon(mode.iconName)}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getBadgeColor(mode.id)}`}>
                      {mode.badge}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {mode.status}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-2 mb-6">
                  <h3 className="text-2xl font-bold text-white font-heading group-hover:text-purple-300 transition-colors flex items-center justify-between">
                    <span>{mode.name}</span>
                    <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-purple-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed min-h-[48px]">
                    {mode.shortDescription}
                  </p>
                </div>

                {/* Key feature pills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {mode.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] text-slate-400 bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded-md font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Player count & Play button */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-mono">{mode.playerCountEstimate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPlayModal();
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600/80 hover:bg-purple-500 border border-purple-400/30 transition-all shadow-sm active:scale-95"
                  >
                    Play
                  </button>
                  <span className="text-xs text-purple-300 font-medium group-hover:underline flex items-center">
                    Details
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Game Modes CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/games')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sm font-semibold text-slate-200 hover:text-white border border-white/10 hover:border-purple-500/40 transition-all"
          >
            <span>Explore All Game Modes & Guides</span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
