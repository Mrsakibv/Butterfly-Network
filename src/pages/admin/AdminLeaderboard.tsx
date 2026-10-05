import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  RefreshCw,
  Trophy,
  Users,
  Database,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SeasonRow {
  id: string;
  season_number: number;
  name: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  cover_image_url: string;
  starts_at: string | null;
  ends_at: string | null;
}

interface CategoryRow {
  category_id: string;
  display_name: string;
  stat_key: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
}

interface LeaderboardRow {
  minecraft_uuid: string;
  username: string;
  score: number;
  display_score: string;
  badge: string;
  guild: string;
  avatar_url: string;
}

export const AdminLeaderboard: React.FC = () => {
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [categoryId, setCategoryId] = useState('hearts');

  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastLoaded, setLastLoaded] = useState<number | null>(null);

  const activeSeason = useMemo(
    () => seasons.find((season) => season.id === seasonId) ?? null,
    [seasons, seasonId]
  );

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError('');

    const [seasonResult, categoryResult] = await Promise.all([
      supabase
        .from('seasons')
        .select(
          'id, season_number, name, status, cover_image_url, starts_at, ends_at'
        )
        .order('season_number', { ascending: false }),

      supabase
        .from('leaderboard_categories')
        .select(
          'category_id, display_name, stat_key, icon_name, sort_order, is_active'
        )
        .order('sort_order', { ascending: true }),
    ]);

    if (seasonResult.error) {
      setError(seasonResult.error.message);
    } else {
      const nextSeasons = (seasonResult.data ?? []) as SeasonRow[];

      setSeasons(nextSeasons);

      const preferred =
        nextSeasons.find((season) => season.status === 'active') ??
        nextSeasons[0];

      if (preferred && !seasonId) {
        setSeasonId(preferred.id);
      }
    }

    if (categoryResult.error) {
      setError((current) => current || categoryResult.error!.message);
    } else {
      const nextCategories = (categoryResult.data ?? []) as CategoryRow[];

      const activeCategories = nextCategories.filter(
        (category) => category.is_active
      );

      setCategories(activeCategories);

      if (
        activeCategories.length > 0 &&
        !activeCategories.some(
          (category) => category.category_id === categoryId
        )
      ) {
        setCategoryId(activeCategories[0].category_id);
      }
    }

    setLoading(false);
  }, [categoryId, seasonId]);

  const loadEntries = useCallback(async () => {
    if (!seasonId || !categoryId) {
      setEntries([]);
      return;
    }

    setLoadingEntries(true);

    const { data, error: entriesError } = await supabase
      .from('season_leaderboard_entries')
      .select(
        'minecraft_uuid, username, score, display_score, badge, guild, avatar_url'
      )
      .eq('season_id', seasonId)
      .eq('category', categoryId)
      .order('score', { ascending: false })
      .limit(30);

    if (entriesError) {
      setError(entriesError.message);
      setEntries([]);
    } else {
      setEntries((data ?? []) as LeaderboardRow[]);
      setLastLoaded(Date.now());
    }

    setLoadingEntries(false);
  }, [categoryId, seasonId]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const refresh = async () => {
    setMessage('');
    setError('');

    await loadBase();
    await loadEntries();

    setMessage('Leaderboard control data refreshed.');
  };

  const formatDate = (value: string | null) => {
    if (!value) return 'Not scheduled';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Unknown';
    }

    return date.toLocaleString();
  };

  const selectedCategory = categories.find(
    (category) => category.category_id === categoryId
  );

  return (
    <AdminLayout active="leaderboard" permission="leaderboard">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
              <Trophy className="h-3.5 w-3.5" />
              Minecraft Leaderboard Control
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Leaderboard Control Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Preview season leaderboard data. Minecraft bridge synchronization
              will use this foundation.
            </p>
          </div>

          <button
            onClick={() => void refresh()}
            disabled={loading || loadingEntries}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading || loadingEntries ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>

        {(message || error) && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-500/20 bg-red-500/10 text-red-200'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {error ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}

            {error || message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Seasons
              </span>
              <Database className="h-5 w-5 text-purple-400" />
            </div>

            <p className="mt-3 text-3xl font-extrabold text-white">
              {seasons.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Archived + active seasons
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Top 30 Loaded
              </span>

              <Users className="h-5 w-5 text-sky-400" />
            </div>

            <p className="mt-3 text-3xl font-extrabold text-white">
              {entries.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Current preview entries
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Last Read
              </span>

              <Clock3 className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="mt-3 text-lg font-bold text-white">
              {lastLoaded
                ? new Date(lastLoaded).toLocaleTimeString()
                : 'Waiting...'}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Supabase leaderboard query
            </p>
          </div>

        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Season
              </span>

              <select
                value={seasonId}
                onChange={(event) => setSeasonId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
              >
                {seasons.length === 0 && (
                  <option value="">No seasons</option>
                )}

                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name} · {season.status}
                  </option>
                ))}
              </select>

              {activeSeason && (
                <span className="mt-2 block text-xs text-slate-500">
                  {formatDate(activeSeason.starts_at)} →{' '}
                  {formatDate(activeSeason.ends_at)}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </span>

              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
              >
                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.display_name}
                  </option>
                ))}
              </select>
            </label>

          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">

          <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Top 30 Preview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {activeSeason?.name ?? 'No season'} ·{' '}
                {selectedCategory?.display_name ?? categoryId}
              </p>
            </div>

            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
              Server data foundation
            </span>
          </div>

          <div className="divide-y divide-white/[0.06]">

            {loadingEntries ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading leaderboard…
              </div>
            ) : entries.length === 0 ? (
              <div className="p-10 text-center">
                <Trophy className="mx-auto h-10 w-10 text-slate-700" />

                <p className="mt-3 font-semibold text-slate-300">
                  No synced entries yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Expected until the Minecraft bridge starts sending player
                  stats.
                </p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <div
                  key={`${entry.minecraft_uuid}-${index}`}
                  className="grid grid-cols-[52px_1fr_auto] items-center gap-4 px-5 py-4"
                >
                  <div className="text-center text-sm font-extrabold text-slate-500">
                    #{index + 1}
                  </div>

                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={
                        entry.avatar_url ||
                        `https://mc-heads.net/avatar/${encodeURIComponent(
                          entry.username
                        )}/48`
                      }
                      alt={entry.username}
                      className="h-10 w-10 rounded-xl border border-white/10 bg-black/40 object-cover"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {entry.username}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {entry.guild ? `[${entry.guild}] ` : ''}
                        {entry.badge || 'Player'}
                      </p>
                    </div>
                  </div>

                  <div className="font-mono text-sm font-bold text-purple-300">
                    {entry.display_score || entry.score}
                  </div>
                </div>
              ))
            )}

          </div>
        </div>

      </div>
    </AdminLayout>
  );
};