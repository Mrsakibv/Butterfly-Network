import React, { useState } from 'react';
import { SERVER_CONFIG } from '../config/server';
import { CopyIpButton } from './CopyIpButton';
import { ServerStatusWidget } from './ServerStatusWidget';
import { Play, Disc as DiscordIcon, Sparkles, Shield, Swords, Layers, ExternalLink, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from '../hooks/useRouter';

interface HeroProps {
  onOpenPlayModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenPlayModal }) => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'java' | 'bedrock'>('java');

  return (
    <section 
      id="hero"
      className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden radial-gradient-hero"
    >
      {/* Background Subtle Ambient Glow Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Subtle Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 backdrop-blur-md text-xs sm:text-sm font-semibold text-purple-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Next-Gen Minecraft Multiplayer</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-slate-300">v{SERVER_CONFIG.version}</span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2"
            >
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[1.08] font-heading">
                Welcome to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-sky-400 glow-text-purple">
                  Butterfly Network
                </span>
              </h1>
              <p className="text-lg sm:text-2xl font-semibold text-purple-200/90 font-heading">
                {SERVER_CONFIG.tagline}
              </p>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              Join Butterfly Network and experience an exciting Minecraft network featuring multiple game modes, an active community and an unforgettable adventure.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                onClick={onOpenPlayModal}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-xl shadow-purple-950/60 hover:shadow-purple-900/80 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Play Now</span>
              </button>

              <a
                href={SERVER_CONFIG.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-base text-purple-200 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200 shadow-md active:scale-95"
              >
                <DiscordIcon className="w-5 h-5 text-purple-400" />
                <span>Join Discord</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>

              <button
                onClick={() => navigate('/games')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <span>Explore Modes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Quick highlight pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Custom Anti-Cheat</span>
              </div>
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-sky-400" />
                <span>6 Unique Game Modes</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Java & Bedrock Crossplay</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Connection Card & Status Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5 space-y-4"
          >
            {/* SERVER CONNECTION CARD */}
            <div className="glass-panel rounded-2xl p-6 border border-purple-500/30 shadow-2xl relative overflow-hidden">
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-400 to-sky-400" />

              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <h3 className="font-heading font-bold text-base text-white">Server Connection</h3>
                </div>
                <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/5 text-xs">
                  <button
                    onClick={() => setActiveTab('java')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      activeTab === 'java' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Java
                  </button>
                  <button
                    onClick={() => setActiveTab('bedrock')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      activeTab === 'bedrock' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bedrock
                  </button>
                </div>
              </div>

              {/* IP Information Box */}
              <div className="py-5 space-y-4">
                {activeTab === 'java' ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="uppercase font-semibold tracking-wider text-purple-300">Java Edition IP</span>
                      <span className="font-mono text-slate-400">Port: {SERVER_CONFIG.port}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">
                      {SERVER_CONFIG.javaIp}
                    </div>
                    <p className="text-xs text-slate-400">
                      Compatible with Java version 1.8.9 through 1.21.x
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="uppercase font-semibold tracking-wider text-purple-300">Bedrock Edition IP</span>
                      <span className="font-mono text-purple-300 font-bold">Port: {SERVER_CONFIG.bedrockPort}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">
                      {SERVER_CONFIG.bedrockIp}
                    </div>
                    <p className="text-xs text-slate-400">
                      Compatible with Windows, iOS, Android, and Console Bedrock
                    </p>
                  </div>
                )}

                {/* Big Copy IP Button */}
                <CopyIpButton
                  ip={activeTab === 'java' ? SERVER_CONFIG.javaIp : SERVER_CONFIG.bedrockIp}
                  label={activeTab === 'java' ? 'Copy Java IP (play.firemc.fun)' : 'Copy Bedrock IP'}
                  variant="primary"
                  className="w-full py-3.5 text-base"
                />
              </div>

              <div className="text-center text-xs text-slate-400">
                Click to copy IP and paste directly into Minecraft server list
              </div>
            </div>

            {/* Live Server Status Widget */}
            <ServerStatusWidget />
          </motion.div>

        </div>
      </div>
    </section>
  );
};
