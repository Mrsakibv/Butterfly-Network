import React, { useEffect } from 'react';
import { CircleUserRound, RefreshCw, Users, Wifi } from 'lucide-react';
import { useServerStatus } from '../hooks/useServerStatus';
import { SERVER_CONFIG } from '../config/server';

export const PlayersPage: React.FC = () => {
  const { loading, online, playersOnline, playersMax, playerList, error, isDemo, refetch } = useServerStatus();

  useEffect(() => {
    document.title = 'Players Online | Butterfly network';
  }, []);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
            <Wifi className="h-3.5 w-3.5" /> Live Server Players
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Players Online</h1>
          <p className="mt-4 text-slate-300">Only players currently connected to {SERVER_CONFIG.serverName} appear here.</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <Users className="mx-auto mb-2 h-5 w-5 text-purple-300" />
            <div className="text-2xl font-bold text-white">{loading ? '...' : playersOnline}</div>
            <div className="text-xs text-slate-400">Players online</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <CircleUserRound className="mx-auto mb-2 h-5 w-5 text-sky-300" />
            <div className="text-2xl font-bold text-white">{playersMax}</div>
            <div className="text-xs text-slate-400">Player capacity</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <Wifi className="mx-auto mb-2 h-5 w-5 text-emerald-300" />
            <div className="text-2xl font-bold text-white">{online ? 'Online' : 'Offline'}</div>
            <div className="text-xs text-slate-400">Server status</div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Connected players</h2>
              <p className="text-sm text-slate-400">Live names provided by the server status service.</p>
            </div>
            <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5" title="Refresh player list">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {error && <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Live player data is currently unavailable.</p>}
          {isDemo && <p className="mb-4 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-200">The status service is in fallback mode, so live player names are not available right now.</p>}

          {!loading && playerList.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {playerList.map((player) => (
                <div key={player.uuid || player.name} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <img src={`https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/48`} alt="" className="h-10 w-10 rounded-xl" />
                  <span className="truncate font-medium text-white">{player.name}</span>
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              {online ? 'The server is online, but the status service did not provide player names.' : 'No players are currently available.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
