import React from 'react';
import { useServerStatus } from '../hooks/useServerStatus';
import { SERVER_CONFIG } from '../config/server';
import { CopyIpButton } from './CopyIpButton';
import { Users, Wifi, RefreshCw, Sparkles, ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';
import { motion } from 'motion/react';

interface ServerStatusWidgetProps {
  compact?: boolean;
  className?: string;
}

export const ServerStatusWidget: React.FC<ServerStatusWidgetProps> = ({ 
  compact = false, 
  className = '' 
}) => {
  const { loading, online, playersOnline, playersMax, version, ping, isDemo, refetch } = useServerStatus();

  const percentage = Math.min(100, Math.max(0, Math.round((playersOnline / (playersMax || 1000)) * 100)));

  return (
    <div
      id="server-live-status-widget"
      className={`relative overflow-hidden rounded-2xl glass-panel border border-white/[0.08] p-5 sm:p-6 transition-all duration-300 shadow-xl ${className}`}
    >
      {/* Background glow orb */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-4">
        {/* Top Status & Ping Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Status Indicator */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {online ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              )}
            </span>
            
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm tracking-wide uppercase text-white">
                {online ? 'Server Online' : 'Maintenance'}
              </span>

              {isDemo && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Demo Mode
                </span>
              )}
            </div>
          </div>

          {/* Ping & Version */}
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5 font-mono">
              <Wifi className={`w-3.5 h-3.5 ${ping < 60 ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{ping > 0 ? `${ping}ms` : '24ms'}</span>
            </div>

            <button
              onClick={() => refetch()}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh server status"
              aria-label="Refresh server status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Players Online Stats */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Players Online</span>
            </div>
            <div className="font-mono text-sm font-bold text-white">
              <span className="text-purple-300">{playersOnline.toLocaleString()}</span>
              <span className="text-slate-500 font-normal"> / {playersMax.toLocaleString()}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(percentage, 4)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-sky-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            />
          </div>
        </div>

        {/* IP & Version Details */}
        {!compact && (
          <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Supported Version</span>
              <span className="text-xs font-mono font-medium text-slate-200">{version || SERVER_CONFIG.version}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-purple-200">
                {SERVER_CONFIG.javaIp}
              </div>
              <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy IP" variant="primary" className="text-xs py-1.5 px-3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
