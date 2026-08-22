import React, { useEffect } from 'react';
import { GAME_MODES } from '../data/gameModes';
import { useRouter } from '../hooks/useRouter';
import { SERVER_CONFIG } from '../config/server';
import { CopyIpButton } from '../components/CopyIpButton';
import { 
  Crown, 
  BedDouble, 
  Swords, 
  Compass, 
  HeartCrack, 
  Skull, 
  CheckCircle2, 
  Play, 
  ArrowLeft, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  HelpCircle,
  Terminal
} from 'lucide-react';
import { motion } from 'motion/react';

interface GameDetailPageProps {
  slug: string;
  onOpenPlayModal: () => void;
}

export const GameDetailPage: React.FC<GameDetailPageProps> = ({ slug, onOpenPlayModal }) => {
  const { navigate } = useRouter();
  const gameMode = GAME_MODES.find((m) => m.slug.toLowerCase() === slug.toLowerCase()) || GAME_MODES[0];

  useEffect(() => {
    document.title = `${gameMode.name} - Butterfly Network`;
  }, [gameMode]);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Crown': return <Crown className="w-10 h-10 text-purple-400" />;
      case 'BedDouble': return <BedDouble className="w-10 h-10 text-rose-400" />;
      case 'Swords': return <Swords className="w-10 h-10 text-cyan-400" />;
      case 'Compass': return <Compass className="w-10 h-10 text-emerald-400" />;
      case 'HeartCrack': return <HeartCrack className="w-10 h-10 text-red-400" />;
      case 'Skull': return <Skull className="w-10 h-10 text-violet-400" />;
      default: return <Sparkles className="w-10 h-10 text-purple-400" />;
    }
  };

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Back Link */}
        <div>
          <button
            onClick={() => navigate('/games')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Games</span>
          </button>
        </div>

        {/* Hero Section for Game Mode */}
        <div className="relative rounded-3xl glass-panel border border-purple-500/30 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/15 flex items-center justify-center shadow-inner">
                  {getIcon(gameMode.iconName)}
                </div>
                <div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {gameMode.badge}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{gameMode.status}</span>
                    <span>&bull;</span>
                    <span>{gameMode.playerCountEstimate}</span>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white font-heading tracking-tight">
                {gameMode.name}
              </h1>

              <p className="text-lg text-slate-300 leading-relaxed">
                {gameMode.longDescription}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {gameMode.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Play Card on Right */}
            <div className="w-full lg:w-80 p-6 rounded-2xl bg-black/50 border border-white/10 space-y-4 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Connect</span>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 font-mono text-sm font-bold text-white text-center">
                {SERVER_CONFIG.javaIp}
              </div>
              <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy Server IP" variant="primary" className="w-full" />
              <button
                onClick={onOpenPlayModal}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                Connection Details
              </button>
            </div>
          </div>
        </div>

        {/* Features & Unique Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Key Features List */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border space-y-6">
            <h2 className="text-2xl font-bold text-white font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Key Features & Mechanics</span>
            </h2>

            <ul className="space-y-3">
              {gameMode.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200 leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Highlights */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border space-y-6">
            <h2 className="text-2xl font-bold text-white font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span>Exclusive Highlights</span>
            </h2>

            <div className="space-y-4">
              {gameMode.highlights.map((h, i) => (
                <div key={i} className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                  <h3 className="text-base font-bold text-purple-200 font-heading">{h.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How to Play Guide for this mode */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border space-y-6">
          <h2 className="text-2xl font-bold text-white font-heading flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <span>How to Get Started in {gameMode.name}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameMode.howToPlay.map((step, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Server Specs for this Mode */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-300">Recommended Version: </span>
            <span className="font-mono text-purple-300 font-bold">{gameMode.recommendedVersion}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-300">Default Port: </span>
            <span className="font-mono text-white">{SERVER_CONFIG.port}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-300">Crossplay: </span>
            <span className="text-emerald-400 font-semibold">Java & Bedrock</span>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="text-center p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-violet-950/30 to-indigo-950/40 border border-purple-500/30 space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Experience {gameMode.name} Today
          </h3>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Connect to <span className="font-mono text-purple-300 font-bold">{SERVER_CONFIG.javaIp}</span> and join the lobby selector.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onOpenPlayModal}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-950/50"
            >
              Play {gameMode.name}
            </button>
            <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy IP" variant="glass" />
          </div>
        </div>
      </div>
    </div>
  );
};
