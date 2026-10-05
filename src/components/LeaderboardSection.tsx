import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Trophy,
  Clock,
  DollarSign,
  Swords,
  Award,
  Crown,
  Medal,
  Search,
  Heart,
  Skull,
  Flame,
  RefreshCw,
  Users,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

import { LeaderboardCategory } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from '../hooks/useRouter';
import { supabase } from '../lib/supabase';
import {
  getActiveSeason,
  getPlayerRank,
  getSeasons,
  getTopLeaderboard,
  LeaderboardPlayer,
  PlayerRankResult,
  Season,
} from '../services/leaderboard';

interface CategoryTab {
  id: LeaderboardCategory;
  label: string;
  icon: React.ReactNode;
}

const tabs: CategoryTab[] = [
  {
    id: 'hearts',
    label: 'Hearts',
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 'kills',
    label: 'Combat Kills',
    icon: <Swords className="h-4 w-4" />,
  },
  {
    id: 'deaths',
    label: 'Deaths',
    icon: <Skull className="h-4 w-4" />,
  },
  {
    id: 'money',
    label: 'Economy',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    id: 'playtime',
    label: 'Playtime',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: 'wins',
    label: 'Wins',
    icon: <Trophy className="h-4 w-4" />,
  },
  {
    id: 'kill_streak',
    label: 'Kill Streak',
    icon: <Flame className="h-4 w-4" />,
  },
];

const fallbackAvatar = (username: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    username
  )}&background=1e1b4b&color=c084fc&bold=true`;

export const LeaderboardSection: React.FC = () => {
  const { userId } = useAuth();
  const { navigate } = useRouter();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [activeTab, setActiveTab] =
    useState<LeaderboardCategory>('hearts');

  const [entries, setEntries] = useState<LeaderboardPlayer[]>([]);
  const [myRank, setMyRank] = useState<PlayerRankResult | null>(null);

  const [minecraftUuid, setMinecraftUuid] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingRank, setLoadingRank] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const selectedSeason = useMemo(
    () =>
      seasons.find((season) => season.id === selectedSeasonId) ??
      activeSeason,
    [activeSeason, seasons, selectedSeasonId]
  );

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return entries;
    }

    return entries.filter(
      (entry) =>
        entry.username.toLowerCase().includes(query) ||
        entry.guild?.toLowerCase().includes(query) ||
        entry.badge?.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  const top3 = entries.slice(0, 3);

  const loadMinecraftLink = async () => {
    if (!userId) {
      setMinecraftUuid(null);
      return;
    }

    const { data, error: linkError } = await supabase
      .from('minecraft_links')
      .select('minecraft_uuid')
      .eq('website_user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (linkError) {
      console.error('Minecraft link lookup failed:', linkError);
      setMinecraftUuid(null);
      return;
    }

    setMinecraftUuid(data?.minecraft_uuid ?? null);
  };

  const loadEntries = async (
    seasonId: string,
    category: LeaderboardCategory
  ) => {
    setError('');

    try {
      const result = await getTopLeaderboard(
        seasonId,
        category,
        30
      );

      setEntries(result);
    } catch (loadError) {
      console.error('Leaderboard loading failed:', loadError);

      setEntries([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load leaderboard.'
      );
    }
  };

  const loadMyRank = async (
    seasonId: string,
    category: LeaderboardCategory,
    uuid: string | null
  ) => {
    if (!uuid) {
      setMyRank(null);
      return;
    }

    setLoadingRank(true);

    try {
      const result = await getPlayerRank(
        seasonId,
        category,
        uuid
      );

      setMyRank(result);
    } catch (rankError) {
      console.error('Player rank loading failed:', rankError);
      setMyRank(null);
    } finally {
      setLoadingRank(false);
    }
  };

  const loadSeasonsAndLeaderboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [seasonList, currentSeason] = await Promise.all([
        getSeasons(),
        getActiveSeason(),
      ]);

      setSeasons(seasonList);
      setActiveSeason(currentSeason);

      const preferredSeason =
        seasonList.find(
          (season) => season.status === 'active'
        ) ??
        currentSeason ??
        seasonList[0] ??
        null;

      if (!preferredSeason) {
        setSelectedSeasonId('');
        setEntries([]);
        setMyRank(null);
        return;
      }

      setSelectedSeasonId(preferredSeason.id);

      await loadEntries(
        preferredSeason.id,
        activeTab
      );

      await loadMyRank(
        preferredSeason.id,
        activeTab,
        minecraftUuid
      );
    } catch (loadError) {
      console.error('Leaderboard initialization failed:', loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load leaderboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMinecraftLink();
  }, [userId]);

  useEffect(() => {
    void loadSeasonsAndLeaderboard();
  }, []);

  useEffect(() => {
    if (!selectedSeasonId) {
      return;
    }

    void loadEntries(
      selectedSeasonId,
      activeTab
    );

    void loadMyRank(
      selectedSeasonId,
      activeTab,
      minecraftUuid
    );
  }, [
    selectedSeasonId,
    activeTab,
    minecraftUuid,
  ]);

  const refresh = async () => {
    if (!selectedSeasonId) {
      return;
    }

    setRefreshing(true);
    setError('');

    await loadEntries(
      selectedSeasonId,
      activeTab
    );

    await loadMyRank(
      selectedSeasonId,
      activeTab,
      minecraftUuid
    );

    setRefreshing(false);
  };

  const openProfile = (username: string) => {
    navigate(
      `/profile?u=${encodeURIComponent(username)}`
    );
  };

  const renderRankStyle = (rank: number) => {
    if (rank === 1) {
      return 'bg-amber-400 text-black';
    }

    if (rank === 2) {
      return 'bg-slate-300 text-black';
    }

    if (rank === 3) {
      return 'bg-amber-700 text-white';
    }

    return 'bg-white/5 text-slate-400';
  };

  return (
    <section
      id="leaderboard"
      className="relative py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto mb-10 max-w-4xl space-y-4 text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
            <Trophy className="h-3.5 w-3.5 text-purple-400" />
            <span>Network Hall of Fame</span>
          </div>

          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Player Leaderboards
          </h2>

          <p className="text-base text-slate-400 sm:text-lg">
            Real-time season rankings powered by your Minecraft server data.
          </p>

          {selectedSeason && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {selectedSeason.name}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Seasons */}
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Season
            </span>

            <div className="relative">
              <select
                value={selectedSeasonId}
                onChange={(event) => {
                  setSelectedSeasonId(event.target.value);
                  setSearchQuery('');
                }}
                disabled={loading || seasons.length === 0}
                className="min-w-[220px] appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-10 text-sm font-semibold text-white outline-none transition focus:border-purple-500 disabled:opacity-50"
              >
                {seasons.length === 0 && (
                  <option value="">
                    No seasons available
                  </option>
                )}

                {seasons.map((season) => (
                  <option
                    key={season.id}
                    value={season.id}
                  >
                    {season.name}
                    {season.status === 'active'
                      ? ' • ACTIVE'
                      : ''}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={
              refreshing ||
              loading ||
              !selectedSeasonId
            }
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 lg:self-end"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>

        {/* Category tabs */}
        <div className="mb-10 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                activeTab === tab.id
                  ? 'border-purple-400/40 bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-950/40'
                  : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto h-10 w-10 animate-spin text-purple-400" />
            <p className="mt-4 text-sm text-slate-500">
              Loading real leaderboard data...
            </p>
          </div>
        ) : !selectedSeason ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-300">
              No season available
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create and activate a season from the admin panel.
            </p>
          </div>
        ) : (
          <>
            {/* Current Rank */}
            <div className="mb-10 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-white/[0.03] to-sky-950/20 p-5 shadow-2xl shadow-purple-950/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                    <Sparkles className="h-4 w-4" />
                    Your Position
                  </div>

                  {!userId ? (
                    <p className="text-sm text-slate-400">
                      Login and connect your Minecraft account to see your rank.
                    </p>
                  ) : loadingRank ? (
                    <p className="text-sm text-slate-500">
                      Finding your position...
                    </p>
                  ) : myRank?.rank ? (
                    <p className="text-2xl font-extrabold text-white">
                      #{myRank.rank}
                      <span className="ml-2 text-sm font-medium text-slate-500">
                        of {myRank.totalPlayers.toLocaleString()} players
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No ranking found for this category.
                    </p>
                  )}
                </div>

                {myRank?.score !== null &&
                  myRank?.score !== undefined && (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-3 text-left md:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Current Score
                      </p>

                      <p className="mt-1 font-mono text-lg font-bold text-purple-300">
                        {Number(myRank.score).toLocaleString()}
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* Empty */}
            {entries.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                <DatabaseIcon />
                <h3 className="mt-4 text-lg font-bold text-slate-300">
                  No synced players yet
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  This leaderboard is now connected to Supabase. Player data
                  will appear automatically once the Minecraft bridge starts
                  syncing server statistics.
                </p>
              </div>
            ) : (
              <>
                {/* Podium */}
                <div className="mb-12 grid max-w-4xl grid-cols-1 items-end gap-6 mx-auto md:grid-cols-3">

                  {/* #2 */}
                  {top3[1] && (
                    <motion.div
                      key={`podium-two-${top3[1].minecraftUuid}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-slate-400/20 bg-gradient-to-b from-slate-900/70 to-slate-950/90 p-6 text-center shadow-xl"
                    >
                      <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/30 bg-slate-300/10 text-sm font-extrabold text-slate-200">
                        2
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openProfile(top3[1].username)
                        }
                        className="group"
                      >
                        <img
                          src={top3[1].avatarUrl}
                          alt={top3[1].username}
                          className="mx-auto h-16 w-16 rounded-2xl border-2 border-slate-300/70 object-cover transition group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.src = fallbackAvatar(
                              top3[1].username
                            );
                          }}
                        />
                      </button>

                      <h3 className="mt-3 font-heading text-lg font-bold text-white">
                        {top3[1].username}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {top3[1].guild
                          ? `[${top3[1].guild}]`
                          : 'Player'}
                      </p>

                      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-2 font-mono text-sm font-bold text-slate-200">
                        {top3[1].score}
                      </div>

                      <Medal className="mx-auto mt-4 h-5 w-5 text-slate-300" />
                    </motion.div>
                  )}

                  {/* #1 */}
                  {top3[0] && (
                    <motion.div
                      key={`podium-one-${top3[0].minecraftUuid}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="order-first rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-purple-950/60 via-amber-950/20 to-black/90 p-7 text-center shadow-2xl shadow-amber-950/30 md:order-none md:-translate-y-4"
                    >
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-[0_0_25px_rgba(245,158,11,0.45)]">
                        <Crown className="h-5 w-5 fill-amber-950 text-amber-950" />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openProfile(top3[0].username)
                        }
                        className="group"
                      >
                        <div className="relative">
                          <img
                            src={top3[0].avatarUrl}
                            alt={top3[0].username}
                            className="mx-auto h-20 w-20 rounded-2xl border-2 border-amber-400 object-cover shadow-xl shadow-amber-500/20 transition group-hover:scale-105"
                            onError={(event) => {
                              event.currentTarget.src = fallbackAvatar(
                                top3[0].username
                              );
                            }}
                          />

                          <span className="absolute -right-2 -top-2 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-extrabold uppercase text-black">
                            #1
                          </span>
                        </div>
                      </button>

                      <h3 className="mt-3 font-heading text-xl font-extrabold text-amber-200">
                        {top3[0].username}
                      </h3>

                      <p className="mt-1 text-xs text-purple-300">
                        {top3[0].guild
                          ? `[${top3[0].guild}]`
                          : 'Champion'}
                      </p>

                      <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 font-mono text-base font-extrabold text-amber-300">
                        {top3[0].score}
                      </div>

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        <Sparkles className="h-3 w-3" />
                        Season Leader
                      </div>
                    </motion.div>
                  )}

                  {/* #3 */}
                  {top3[2] && (
                    <motion.div
                      key={`podium-three-${top3[2].minecraftUuid}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-amber-700/30 bg-gradient-to-b from-amber-950/30 to-slate-950/90 p-6 text-center shadow-xl"
                    >
                      <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-amber-700/40 bg-amber-700/20 text-sm font-extrabold text-amber-400">
                        3
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openProfile(top3[2].username)
                        }
                        className="group"
                      >
                        <img
                          src={top3[2].avatarUrl}
                          alt={top3[2].username}
                          className="mx-auto h-16 w-16 rounded-2xl border-2 border-amber-600/70 object-cover transition group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.src = fallbackAvatar(
                              top3[2].username
                            );
                          }}
                        />
                      </button>

                      <h3 className="mt-3 font-heading text-lg font-bold text-white">
                        {top3[2].username}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {top3[2].guild
                          ? `[${top3[2].guild}]`
                          : 'Player'}
                      </p>

                      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-2 font-mono text-sm font-bold text-amber-300">
                        {top3[2].score}
                      </div>

                      <Medal className="mx-auto mt-4 h-5 w-5 text-amber-600" />
                    </motion.div>
                  )}

                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">

                  <div className="flex flex-col gap-4 border-b border-white/[0.08] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                        <Award className="h-4 w-4 text-purple-400" />
                        Top 30 Standings
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {selectedSeason.name} ·{' '}
                        {tabs.find(
                          (tab) => tab.id === activeTab
                        )?.label}
                      </p>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(event.target.value)
                        }
                        placeholder="Search player..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500"
                      />
                    </div>

                  </div>

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[640px] border-collapse text-left">

                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3 text-center sm:px-6">
                            Rank
                          </th>

                          <th className="px-4 py-3 sm:px-6">
                            Player
                          </th>

                          <th className="hidden px-4 py-3 sm:table-cell sm:px-6">
                            Badge
                          </th>

                          <th className="px-4 py-3 text-right sm:px-6">
                            Score
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/[0.04]">

                        <AnimatePresence mode="popLayout">
                          {filteredEntries.length > 0 ? (
                            filteredEntries.map(
                              (entry) => (
                                <motion.tr
                                  key={`${entry.minecraftUuid}-${activeTab}-${selectedSeasonId}`}
                                  initial={{
                                    opacity: 0,
                                  }}
                                  animate={{
                                    opacity: 1,
                                  }}
                                  exit={{
                                    opacity: 0,
                                  }}
                                  className="group transition-colors hover:bg-white/[0.03]"
                                >

                                  <td className="px-4 py-3 text-center sm:px-6">
                                    <span
                                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold font-mono ${renderRankStyle(
                                        entry.rank
                                      )}`}
                                    >
                                      #{entry.rank}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 sm:px-6">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openProfile(
                                          entry.username
                                        )
                                      }
                                      className="flex items-center gap-3 text-left"
                                    >
                                      <img
                                        src={
                                          entry.avatarUrl
                                        }
                                        alt={
                                          entry.username
                                        }
                                        className="h-9 w-9 rounded-xl border border-white/10 object-cover transition group-hover:border-purple-400/50"
                                        onError={(
                                          event
                                        ) => {
                                          event.currentTarget.src =
                                            fallbackAvatar(
                                              entry.username
                                            );
                                        }}
                                      />

                                      <div className="min-w-0">
                                        <div className="truncate font-semibold text-white transition group-hover:text-purple-300">
                                          {entry.username}
                                        </div>

                                        {entry.guild && (
                                          <div className="text-[10px] font-mono text-purple-300/80">
                                            [{entry.guild}]
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  </td>

                                  <td className="hidden px-4 py-3 sm:table-cell sm:px-6">
                                    {entry.badge ? (
                                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] font-semibold text-purple-300">
                                        {entry.badge}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-600">
                                        —
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-slate-100 sm:px-6">
                                    {entry.score}
                                  </td>

                                </motion.tr>
                              )
                            )
                          ) : (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-6 py-12 text-center"
                              >
                                <Search className="mx-auto h-8 w-8 text-slate-700" />

                                <p className="mt-3 text-sm font-semibold text-slate-400">
                                  No matching players
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                  Try a different username or guild.
                                </p>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>

                      </tbody>
                    </table>

                  </div>

                  <div className="border-t border-white/[0.06] px-5 py-4 text-center text-[10px] uppercase tracking-wider text-slate-600">
                    Showing {filteredEntries.length} of{' '}
                    {entries.length} synced players
                  </div>

                </div>

                {/* Footer info */}
                <div className="mt-6 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Top 30 players are displayed from the active season snapshot.
                  </div>

                  <div className="text-right">
                    {myRank?.rank
                      ? `Your rank: #${myRank.rank}`
                      : 'Connect Minecraft to track your position'}
                  </div>
                </div>

              </>
            )}
          </>
        )}

      </div>
    </section>
  );
};

const DatabaseIcon: React.FC = () => (
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/10 bg-purple-500/5">
    <Trophy className="h-6 w-6 text-slate-700" />
  </div>
);