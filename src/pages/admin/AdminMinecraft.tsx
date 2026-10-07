import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  Cable,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock3,
  Database,
  Users,
  Activity,
  Server,
} from 'lucide-react';

interface SyncState {
  server_id: string;
  active_season_id: string | null;
  bridge_version: string;
  last_attempt_at: string | null;
  last_success_at: string | null;
  synced_players: number;
  synced_entries: number;
  last_error: string;
  updated_at: string;
}

interface PlayerStatsRow {
  minecraft_uuid: string;
  minecraft_username: string;
  server_id: string;
  updated_at: string;
}

const formatDateTime = (value: string | null) => {
  if (!value) return 'Never';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const relativeTime = (value: string | null) => {
  if (!value) return 'No successful sync yet';

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return 'Unknown';
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  );

  if (seconds < 10) {
    return 'Just now';
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
};

const isFresh = (value: string | null) => {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= 5 * 60 * 1000;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  description: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          {label}
        </p>

        <p className="mt-2 text-2xl font-black tracking-tight text-white">
          {value}
        </p>
      </div>

      <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-purple-300">
        <Icon className="h-5 w-5" />
      </div>
    </div>

    <p className="mt-3 text-xs leading-5 text-slate-500">
      {description}
    </p>
  </div>
);

export const AdminMinecraft: React.FC = () => {
  const [syncState, setSyncState] =
    useState<SyncState | null>(null);

  const [playerCount, setPlayerCount] =
    useState(0);

  const [lastPlayers, setLastPlayers] =
    useState<PlayerStatsRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [nowTick, setNowTick] =
    useState(Date.now());

  const loadIntegration = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) {
        setRefreshing(true);
      }

      setError('');
      setMessage('');

      const [
        syncResult,
        playerResult,
      ] = await Promise.all([
        supabase
          .from('leaderboard_sync_state')
          .select(
            `
              server_id,
              active_season_id,
              bridge_version,
              last_attempt_at,
              last_success_at,
              synced_players,
              synced_entries,
              last_error,
              updated_at
            `
          )
          .eq('server_id', 'main')
          .maybeSingle(),

        supabase
          .from('player_minecraft_stats')
          .select(
            `
              minecraft_uuid,
              minecraft_username,
              server_id,
              updated_at
            `,
            {
              count: 'exact',
              head: false,
            }
          )
          .eq('server_id', 'main')
          .order('updated_at', {
            ascending: false,
          })
          .limit(8),
      ]);

      if (syncResult.error) {
        setError(syncResult.error.message);
      } else {
        setSyncState(
          (syncResult.data ?? null) as SyncState | null
        );
      }

      if (playerResult.error) {
        setError(
          (current) =>
            current ||
            playerResult.error.message
        );
      } else {
        setPlayerCount(
          playerResult.count ?? 0
        );

        setLastPlayers(
          (playerResult.data ?? []) as PlayerStatsRow[]
        );
      }

      if (
        !syncResult.error &&
        !playerResult.error
      ) {
        setMessage(
          'Minecraft integration status refreshed.'
        );
      }

      setLoading(false);
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadIntegration();

    const timer =
      window.setInterval(() => {
        setNowTick(Date.now());
        void loadIntegration(false);
      }, 30_000);

    return () =>
      window.clearInterval(timer);
  }, [loadIntegration]);

  const connected = useMemo(
    () =>
      isFresh(
        syncState?.last_success_at ?? null
      ),
    [
      syncState?.last_success_at,
      nowTick,
    ]
  );

  return (
    <AdminLayout
      active="minecraft"
      permission="minecraft"
    >
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-purple-300">
              <Cable className="h-4 w-4" />
              Minecraft Integration
            </div>

            <h1 className="font-heading text-3xl font-black tracking-tight text-white sm:text-4xl">
              Server Bridge Control
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Monitor the Minecraft → API → Supabase
              pipeline without exposing the Minecraft
              server API key in the admin panel.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadIntegration()
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh Status
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SERVER STATUS */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-3 text-purple-300">
                <Server className="h-6 w-6" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Primary Minecraft Server
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {syncState?.server_id ||
                      'main'}
                  </h2>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      connected
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {connected ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}

                    {connected
                      ? 'Healthy'
                      : 'Waiting for sync'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Bridge Version
              </p>

              <p className="mt-1 font-mono text-sm font-semibold text-slate-200">
                {syncState?.bridge_version ||
                  '—'}
              </p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Synced Players"
            value={
              syncState?.synced_players ??
              playerCount
            }
            description="Players included in the latest successful bridge sync."
          />

          <StatCard
            icon={Database}
            label="Synced Entries"
            value={
              syncState?.synced_entries ??
              0
            }
            description="Leaderboard rows synchronized in the latest successful run."
          />

          <StatCard
            icon={Clock3}
            label="Last Successful Sync"
            value={relativeTime(
              syncState?.last_success_at ??
                null
            )}
            description={formatDateTime(
              syncState?.last_success_at ??
                null
            )}
          />

          <StatCard
            icon={Activity}
            label="Tracked Players"
            value={playerCount}
            description="Minecraft player records currently stored for server main."
          />
        </div>

        {/* LOWER GRID */}
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* SYNC TIMELINE */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Sync Timeline
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Latest bridge heartbeat and backend
                  state.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Auto refresh: 30s
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                <span className="text-sm text-slate-400">
                  Last attempt
                </span>

                <span className="text-sm font-semibold text-white">
                  {formatDateTime(
                    syncState?.last_attempt_at ??
                      null
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                <span className="text-sm text-slate-400">
                  Last success
                </span>

                <span className="text-sm font-semibold text-white">
                  {formatDateTime(
                    syncState?.last_success_at ??
                      null
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                <span className="text-sm text-slate-400">
                  Database state updated
                </span>

                <span className="text-sm font-semibold text-white">
                  {formatDateTime(
                    syncState?.updated_at ??
                      null
                  )}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Latest backend message
              </p>

              <p
                className={`mt-2 text-sm leading-6 ${
                  syncState?.last_error
                    ? 'text-red-300'
                    : 'text-emerald-300'
                }`}
              >
                {syncState?.last_error ||
                  'No backend sync error recorded.'}
              </p>
            </div>
          </section>

          {/* PLAYERS */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">
                Recent Player Records
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Most recently updated Minecraft identities.
              </p>
            </div>

            {loading ? (
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-8 text-center text-sm text-slate-500">
                Loading integration data…
              </div>
            ) : lastPlayers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-700" />

                <p className="mt-3 text-sm font-semibold text-slate-300">
                  No player records yet
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The bridge has not stored any Minecraft
                  player records for server main yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lastPlayers.map(
                  (player) => (
                    <div
                      key={
                        player.minecraft_uuid
                      }
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {
                            player.minecraft_username
                          }
                        </p>

                        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-600">
                          {
                            player.minecraft_uuid
                          }
                        </p>
                      </div>

                      <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                        {relativeTime(
                          player.updated_at
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        {/* SECURITY */}
        <div className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.05] p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />

            <div>
              <h3 className="font-semibold text-white">
                Security boundary
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                The admin dashboard reads integration status
                from Supabase. The Minecraft API key remains
                server-side and is never displayed here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};