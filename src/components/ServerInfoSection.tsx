import React from 'react';
import { SERVER_CONFIG } from '../config/server';
import { GAME_MODES } from '../data/gameModes';
import { useServerStatus } from '../hooks/useServerStatus';
import { CopyIpButton } from './CopyIpButton';
import { 
  Server, 
  Terminal, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Globe2, 
  Radio
} from 'lucide-react';

export const ServerInfoSection: React.FC = () => {
  const { online, playersOnline, playersMax, ping, version, isDemo } = useServerStatus();

  return (
    <section id="server-info" className="py-20 relative bg-black/30 border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span>Network Specification</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight">
            Server Information & Specs
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Complete technical connection parameters and infrastructure details for {SERVER_CONFIG.serverName}.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Network Identity */}
          <div className="glass-panel rounded-2xl p-6 border space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Network Name</span>
                <h3 className="text-lg font-bold text-white font-heading">{SERVER_CONFIG.serverName}</h3>
              </div>
            </div>
            <div className="pt-2 border-t border-white/[0.06] space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Supported Versions:</span>
                <span className="font-mono text-white">{version || SERVER_CONFIG.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Geyser Crossplay:</span>
                <span className="text-emerald-400 font-semibold">Enabled (Bedrock & Java)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Anti-Cheat Engine:</span>
                <span className="text-purple-300 font-mono">GrimAC Heuristics</span>
              </div>
            </div>
          </div>

          {/* Card 2: Java & Bedrock IPs */}
          <div className="glass-panel rounded-2xl p-6 border space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Connection Endpoints</span>
                <h3 className="text-lg font-bold text-white font-heading font-mono">{SERVER_CONFIG.javaIp}</h3>
              </div>
            </div>
            <div className="pt-2 border-t border-white/[0.06] space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Java Address:</span>
                <span className="font-mono font-bold text-white">{SERVER_CONFIG.javaIp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Bedrock Address:</span>
                <span className="font-mono font-bold text-white">{SERVER_CONFIG.bedrockIp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Network Port:</span>
                <span className="font-mono text-purple-300 font-bold">{SERVER_CONFIG.port}</span>
              </div>
              <div className="pt-2">
                <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy Server IP" variant="glass" className="w-full text-xs py-2" />
              </div>
            </div>
          </div>

          {/* Card 3: Live Health & Ping */}
          <div className="glass-panel rounded-2xl p-6 border space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Live Health & Node</span>
                <h3 className="text-lg font-bold text-emerald-400 font-heading flex items-center gap-2">
                  <span>{online ? '100% Operational' : 'Maintenance'}</span>
                  {isDemo && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">Demo</span>}
                </h3>
              </div>
            </div>
            <div className="pt-2 border-t border-white/[0.06] space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Load:</span>
                <span className="font-mono text-white">{playersOnline.toLocaleString()} / {playersMax.toLocaleString()} Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Roundtrip Ping:</span>
                <span className="font-mono text-emerald-400">{ping > 0 ? `${ping} ms` : '24 ms'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime SLA:</span>
                <span className="text-purple-300 font-mono">99.98% High Availability</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Modes Tag Matrix */}
        <div className="mt-8 p-6 rounded-2xl glass-panel border">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-purple-400" />
              <span className="font-heading font-bold text-white text-base">Active Game Modes:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {GAME_MODES.map((mode) => (
                <span
                  key={mode.id}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {mode.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
