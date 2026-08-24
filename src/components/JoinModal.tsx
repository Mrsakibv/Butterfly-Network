import React, { useState } from 'react';
import { SERVER_CONFIG } from '../config/server';
import { CopyIpButton } from './CopyIpButton';
import { X, Gamepad2, Monitor, Smartphone, MessageSquare, CheckCircle, Sparkles, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<'java' | 'bedrock'>('java');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="join-server-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#09090e] border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/60 overflow-hidden z-10 my-8"
        >
          {/* Top Banner Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-violet-400 to-sky-400" />

          {/* Header */}
          <div className="p-6 sm:p-8 pb-4 flex items-start justify-between border-b border-white/5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Instant Connection</span>
              </div>
              <h2 id="join-modal-title" className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                Connect to {SERVER_CONFIG.serverName}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Select your edition to copy server details and join today.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Platform Switcher */}
          <div className="px-6 sm:px-8 pt-6">
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setPlatform('java')}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  platform === 'java'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Java Edition (PC / Mac)</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatform('bedrock')}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  platform === 'bedrock'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Bedrock Edition (Mobile/Console)</span>
              </button>
            </div>
          </div>

          {/* Connection Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {platform === 'java' ? (
              <div className="space-y-4">
                {/* IP Card */}
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Server Address</span>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">
                      {SERVER_CONFIG.javaIp}
                    </div>
                    <span className="text-xs text-slate-400">Supported versions: {SERVER_CONFIG.version}</span>
                  </div>
                  <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy Java IP" variant="primary" />
                </div>

                {/* Steps */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Quick 3-Step Guide</h4>
                  <div className="grid gap-2 text-sm text-slate-300">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold shrink-0">1</span>
                      <span>Launch Minecraft Java Edition (1.8.9 through 1.21.x).</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold shrink-0">2</span>
                      <span>Click <strong>Multiplayer</strong> &rarr; <strong>Add Server</strong>.</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold shrink-0">3</span>
                      <span>Paste <strong>{SERVER_CONFIG.javaIp}</strong> into the Server Address box and click <strong>Join Server</strong>!</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* IP & Port Card */}
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Server IP</span>
                    <div className="text-lg sm:text-xl font-bold font-mono text-white">
                      {SERVER_CONFIG.bedrockIp}
                    </div>
                    <CopyIpButton ip={SERVER_CONFIG.bedrockIp} label="Copy IP" variant="glass" className="w-full mt-2" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Port (Default)</span>
                    <div className="text-lg sm:text-xl font-bold font-mono text-white">
                      {SERVER_CONFIG.bedrockPort}
                    </div>
                    <CopyIpButton ip={SERVER_CONFIG.bedrockPort.toString()} label="Copy Port" variant="glass" className="w-full mt-2" />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Bedrock Connection Guide</h4>
                  <div className="grid gap-2 text-sm text-slate-300">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold shrink-0">1</span>
                      <span>Open Minecraft on Android, iOS, Windows, or Console.</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold shrink-0">2</span>
                      <span>Navigate to <strong>Play</strong> &rarr; <strong>Servers Tab</strong> &rarr; <strong>Add Server</strong>.</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold shrink-0">3</span>
                      <span>Enter <strong>{SERVER_CONFIG.bedrockIp}</strong> and Port <strong>{SERVER_CONFIG.bedrockPort}</strong>, then save and connect!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Need Help Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>GeyserMC Cross-play Enabled</span>
              </div>
              <a
                href={SERVER_CONFIG.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-purple-300 hover:text-purple-200 transition-colors font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Need assistance? Join our Discord</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
