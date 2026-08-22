import React from 'react';
import { SERVER_CONFIG } from '../config/server';
import { CopyIpButton } from './CopyIpButton';
import { Play, Disc as DiscordIcon, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface FinalCTAProps {
  onOpenPlayModal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenPlayModal }) => {
  return (
    <section id="ready-to-play" className="py-24 relative overflow-hidden radial-gradient-bottom">
      {/* Background glow flares */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Join Hundreds of Active Players</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white font-heading tracking-tight">
            Ready to Play?
          </h2>

          <p className="text-lg sm:text-2xl font-medium text-slate-300 font-heading">
            Your next adventure is waiting.
          </p>
        </motion.div>

        {/* Server IP Showcase Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl glass-panel border border-purple-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Server IP Address</span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wide">
              {SERVER_CONFIG.javaIp}
            </div>
          </div>

          <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy IP" variant="primary" className="w-full sm:w-auto" />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={onOpenPlayModal}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-950/60 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Play Now</span>
          </button>

          <a
            href={SERVER_CONFIG.discordUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-base text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400/50 shadow-md transition-all duration-200 active:scale-95"
          >
            <DiscordIcon className="w-5 h-5 text-purple-400" />
            <span>Join Discord</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
