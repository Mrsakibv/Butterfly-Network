import React from 'react';
import { SERVER_CONFIG } from '../config/server';
import { Disc as DiscordIcon, Play, MessageSquare, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface CommunityCTAProps {
  onOpenPlayModal: () => void;
}

export const CommunityCTA: React.FC<CommunityCTAProps> = ({ onOpenPlayModal }) => {
  return (
    <section id="community" className="py-20 relative overflow-hidden">
      {/* Background Glowing Ambient Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl glass-panel border border-purple-500/30 p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl">
          {/* Top subtle light streak */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Official Community Hub</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight">
              Join the Butterfly Network Community
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Connect with players, get updates, participate in events and stay connected with the network.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href={SERVER_CONFIG.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-[#5865F2] to-indigo-600 hover:from-[#4752c4] hover:to-indigo-700 shadow-xl shadow-indigo-950/60 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <DiscordIcon className="w-5 h-5 fill-white text-white" />
                <span>Join Discord</span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>

              <button
                onClick={onOpenPlayModal}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-base text-purple-200 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/30 hover:border-purple-400/50 shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-purple-300" />
                <span>Play Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
