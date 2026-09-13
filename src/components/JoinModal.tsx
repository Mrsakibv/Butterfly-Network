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
          className="relative w-full max-w-xs sm:max-w-2xl bg-[#09090e] border border-purple-500/30 rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-950/60 overflow-hidden z-10 my-2 sm:my-8"
        >
          {/* Top Banner Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-violet-400 to-sky-400" />

          {/* Header */}
          <div className="p-3 sm:p-8 pb-2 sm:pb-4 flex items-start justify-between border-b border-white/5 gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] sm:text-xs font-semibold text-purple-300 mb-1 sm:mb-2">
                <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-purple-400" />
                <span>Instant Connection</span>
              </div>
              <h2 id="join-modal-title" className="text-base sm:text-3xl font-extrabold text-white font-heading leading-tight">
                Connect to {SERVER_CONFIG.serverName}
              </h2>
              <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
                Select your edition to copy server details.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Platform Switcher */}
          <div className="px-3 sm:px-8 pt-3 sm:pt-6">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-0.5 sm:p-1 bg-white/5 rounded-lg sm:rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setPlatform('java')}
                className={`flex items-center justify-center gap-1 sm:gap-2.5 py-1.5 sm:py-2.5 px-1.5 sm:px-4 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-sm transition-all ${
                  platform === 'java'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Java Edition (PC / Mac)</span>
                <span className="sm:hidden">Java</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatform('bedrock')}
                className={`flex items-center justify-center gap-1 sm:gap-2.5 py-1.5 sm:py-2.5 px-1.5 sm:px-4 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-sm transition-all ${
                  platform === 'bedrock'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Bedrock Edition (Mobile/Console)</span>
                <span className="sm:hidden">Bedrock</span>
              </button>
            </div>
          </div>

          {/* Connection Body */}
          <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
            {platform === 'java' ? (
              <div className="space-y-2.5 sm:space-y-4">
                {/* IP Card */}
                <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-purple-950/30 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider text-purple-300 font-semibold block">Server Address</span>
                    <div className="text-xs sm:text-2xl font-bold font-mono text-white tracking-wide break-all mt-0.5">
                      {SERVER_CONFIG.javaIp}
                    </div>
                    <span className="text-[9px] sm:text-xs text-slate-400 block mt-0.5">Versions: {SERVER_CONFIG.version}</span>
                  </div>
                  <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy IP" variant="primary" className="text-xs py-1 px-2 sm:text-sm sm:py-2 sm:px-3 w-full sm:w-auto" />
                </div>

                {/* Steps */}
                <div className="space-y-1.5 sm:space-y-2.5 pt-1 sm:pt-2">
                  <h4 className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold">Quick 3-Step Guide</h4>
                  <div className="grid gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-300">
                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 text-purple-300 text-[9px] sm:text-xs font-bold shrink-0">1</span>
                      <span>Launch Minecraft Java Edition (1.8.9 through 1.21.x).</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 text-purple-300 text-[9px] sm:text-xs font-bold shrink-0">2</span>
                      <span>Click <strong>Multiplayer</strong> &rarr; <strong>Add Server</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 text-purple-300 text-[9px] sm:text-xs font-bold shrink-0">3</span>
                      <span>Paste <strong>{SERVER_CONFIG.javaIp}</strong> into the Server Address box and click <strong>Join Server</strong>!</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-4">
                {/* IP & Port Card */}
                <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-purple-950/30 border border-purple-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-xs uppercase tracking-wider text-purple-300 font-semibold">Server IP</span>
                    <div className="text-xs sm:text-lg font-bold font-mono text-white break-all">
                      {SERVER_CONFIG.bedrockIp}
                    </div>
                    <CopyIpButton ip={SERVER_CONFIG.bedrockIp} label="Copy IP" variant="glass" className="w-full mt-1.5 text-[9px] py-1 px-2 sm:text-sm sm:py-2 sm:px-3 sm:mt-2" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-xs uppercase tracking-wider text-purple-300 font-semibold">Port</span>
                    <div className="text-xs sm:text-lg font-bold font-mono text-white">
                      {SERVER_CONFIG.bedrockPort}
                    </div>
                    <CopyIpButton ip={SERVER_CONFIG.bedrockPort.toString()} label="Copy Port" variant="glass" className="w-full mt-1.5 text-[9px] py-1 px-2 sm:text-sm sm:py-2 sm:px-3 sm:mt-2" />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2 sm:space-y-2.5">
                  <h4 className="text-[9px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold">Connection Guide</h4>
                  <div className="grid gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-slate-300">
                    <div className="flex items-start gap-2 sm:gap-3 p-1.5 sm:p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500/20 text-purple-300 text-[8px] sm:text-xs font-bold shrink-0">1</span>
                      <span>Open Minecraft Bedrock</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 p-1.5 sm:p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500/20 text-purple-300 text-[8px] sm:text-xs font-bold shrink-0">2</span>
                      <span>Go to Servers → Add Server</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 p-1.5 sm:p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500/20 text-purple-300 text-[8px] sm:text-xs font-bold shrink-0">3</span>
                      <span>Enter IP and Port, then connect</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Need Help Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Only available on Java Edition</span>
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
