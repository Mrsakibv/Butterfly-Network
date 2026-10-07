import { supabase } from '../lib/supabase';

export interface LeaderboardPlayer {
  rank: number;
  minecraftUuid: string;
  username: string;
  score: string;
  rawValue: number;
  badge?: string;
  guild?: string;
  avatarUrl: string;
}

export interface PlayerRankResult {
  rank: number | null;
  score: number | null;
  totalPlayers: number;
}

export interface Season {
  id: string;
  season_number: number;
  name: string;
  slug: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  description: string;
  cover_image_url: string;
  starts_at: string | null;
  ends_at: string | null;
}

const SEASON_SELECT =
  'id, season_number, name, slug, status, description, cover_image_url, starts_at, ends_at';

const fallbackFormatScore = (category: string, value: number) => {
  switch (category) {
    case 'money':
      return `$${value.toLocaleString()}`;
    case 'playtime':
    case 'playtime_seconds': {
      const hours = value / 3600;
      if (hours >= 1) return `${hours.toFixed(1)} hrs`;
      const minutes = value / 60;
      return `${Math.max(1, Math.round(minutes))} min`;
    }
    case 'hearts':
      return `❤ ${value}`;
    case 'kills':
      return `${value.toLocaleString()} Kills`;
    case 'deaths':
      return `${value.toLocaleString()} Deaths`;
    case 'wins':
      return `${value.toLocaleString()} Wins`;
    case 'kill_streak':
      return `${value.toLocaleString()} Streak`;
    default:
      return value.toLocaleString();
  }
};


const readSnapshotStat = (
  snapshot: Record<string, any>,
  statKey: string
): number => {
  switch (statKey) {
    case 'hearts': return Number(snapshot.hearts) || 0;
    case 'kills': return Number(snapshot.kills) || 0;
    case 'deaths': return Number(snapshot.deaths) || 0;
    case 'money': return Number(snapshot.money) || 0;
    case 'playtime_seconds': return Number(snapshot.playtime_seconds) || 0;
    case 'wins': return Number(snapshot.wins) || 0;
    case 'kill_streak': return Number(snapshot.kill_streak) || 0;
    case 'blocks_broken': return Number(snapshot.blocks_broken) || 0;
    case 'blocks_placed': return Number(snapshot.blocks_placed) || 0;
    case 'items_crafted': return Number(snapshot.items_crafted) || 0;
    case 'items_used': return Number(snapshot.items_used) || 0;
    case 'mobs_killed': return Number(snapshot.mobs_killed) || 0;
    case 'players_killed': return Number(snapshot.players_killed) || 0;
    case 'distance_walked': return Number(snapshot.distance_walked) || 0;
    case 'distance_run': return Number(snapshot.distance_run) || 0;
    case 'distance_flown': return Number(snapshot.distance_flown) || 0;
    case 'damage_dealt': return Number(snapshot.damage_dealt) || 0;
    case 'damage_taken': return Number(snapshot.damage_taken) || 0;
    case 'jumps': return Number(snapshot.jumps) || 0;
    default: return 0;
  }
};

const readMinecraftStatistic = (
  snapshot: Record<string, any>,
  statKey: string
): number => {
  const statistics =
    snapshot.statistics_snapshot &&
    typeof snapshot.statistics_snapshot === 'object'
      ? snapshot.statistics_snapshot
      : {};

  const value = statistics?.[statKey];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const formatHistoricalScore = (
  score: number,
  displayFormat: string,
  prefix = '',
  suffix = '',
  decimalPlaces = 0
): string => {
  const safeScore = Number.isFinite(score) ? score : 0;
  const decimals = Math.max(0, Math.min(4, Number(decimalPlaces) || 0));
  const rounded = Number(safeScore.toFixed(decimals));

  const trimDecimal = (value: number) =>
    value.toFixed(decimals).replace(/\.0+$|(?<=\.[0-9]+)0+$/, '').replace(/\.$/, '');

  switch (displayFormat) {
    case 'currency':
      return `$${rounded.toLocaleString('en-US', { maximumFractionDigits: decimals })}`;
    case 'hearts':
      return `❤ ${trimDecimal(rounded)}`;
    case 'hours': {
      const hours = safeScore / 3600;
      return `${hours.toFixed(Math.max(1, decimals)).replace(/\.0+$|(?<=\.[0-9]+)0+$/, '').replace(/\.$/, '')} hrs`;
    }
    case 'decimal':
      return `${trimDecimal(rounded)}`;
    default:
      return `${prefix}${rounded.toLocaleString('en-US', { maximumFractionDigits: decimals })}${suffix}`;
  }
};

const getHistoricalLeaderboardRows = async (
  seasonId: string,
  category: string,
  limit = 30
): Promise<LeaderboardPlayer[]> => {
  const safeLimit = Math.min(Math.max(limit, 1), 1000);

  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .select('id, status')
    .eq('id', seasonId)
    .maybeSingle();

  if (seasonError) throw new Error(seasonError.message);
  if (!season || !['completed', 'archived'].includes(String(season.status))) return [];

  const { data: config, error: configError } = await supabase
    .from('leaderboard_categories')
    .select(
      'category_id, stat_key, source_type, ranking_mode, display_format, prefix, suffix, decimal_places, sort_direction'
    )
    .eq('category_id', category)
    .maybeSingle();

  if (configError) throw new Error(configError.message);
  if (!config) return [];

  const { data: frozenConfig } = await supabase
    .from('season_profile_stat_visibility')
    .select(
      'category_id, stat_key, source_type, ranking_mode, display_format, prefix, suffix, decimal_places, sort_order'
    )
    .eq('season_id', seasonId)
    .eq('category_id', category)
    .maybeSingle();

  const effectiveConfig = frozenConfig
    ? { ...config, ...frozenConfig }
    : config;

  const { data: snapshots, error: snapshotError } = await supabase
    .from('season_player_snapshots')
    .select(
      'season_id, minecraft_uuid, minecraft_username, server_id, hearts, kills, deaths, money, playtime_seconds, wins, kill_streak, blocks_broken, blocks_placed, items_crafted, items_used, mobs_killed, players_killed, distance_walked, distance_run, distance_flown, damage_dealt, damage_taken, jumps, statistics_snapshot, captured_at'
    )
    .eq('season_id', seasonId)
    .limit(1000);

  if (snapshotError) throw new Error(snapshotError.message);
  if (!snapshots?.length) return [];

  const baselineMap = new Map<string, Record<string, any>>();

  if (effectiveConfig.ranking_mode === 'delta') {
    const { data: baselines, error: baselineError } = await supabase
      .from('season_player_baselines')
      .select(
        'season_id, minecraft_uuid, hearts, kills, deaths, money, playtime_seconds, wins, kill_streak, blocks_broken, blocks_placed, items_crafted, items_used, mobs_killed, players_killed, distance_walked, distance_run, distance_flown, damage_dealt, damage_taken, jumps, statistics_snapshot'
      )
      .eq('season_id', seasonId)
      .limit(1000);

    if (baselineError) throw new Error(baselineError.message);

    for (const baseline of baselines ?? []) {
      baselineMap.set(String(baseline.minecraft_uuid), baseline);
    }
  }

  const rows = snapshots.map((snapshot: Record<string, any>) => {
    const baseline = baselineMap.get(String(snapshot.minecraft_uuid)) || {};

    const snapshotValue =
      effectiveConfig.source_type === 'minecraft_statistic'
        ? readMinecraftStatistic(snapshot, effectiveConfig.stat_key)
        : readSnapshotStat(snapshot, effectiveConfig.stat_key);

    const baselineValue =
      effectiveConfig.source_type === 'minecraft_statistic'
        ? readMinecraftStatistic(baseline, effectiveConfig.stat_key)
        : readSnapshotStat(baseline, effectiveConfig.stat_key);

    const rawValue = Math.max(
      0,
      effectiveConfig.ranking_mode === 'delta'
        ? snapshotValue - baselineValue
        : snapshotValue
    );

    const username = String(snapshot.minecraft_username || 'Unknown Player');

    return {
      rank: 0,
      minecraftUuid: String(snapshot.minecraft_uuid),
      username,
      score: formatHistoricalScore(
        rawValue,
        effectiveConfig.display_format,
        effectiveConfig.prefix,
        effectiveConfig.suffix,
        Number(effectiveConfig.decimal_places) || 0
      ),
      rawValue,
      avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`,
    };
  });

  rows.sort((a, b) =>
    effectiveConfig.sort_direction === 'asc'
      ? a.rawValue - b.rawValue
      : b.rawValue - a.rawValue
  );

  return rows.slice(0, safeLimit).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
};

export const getActiveSeason = async (): Promise<Season | null> => {
  const { data, error } = await supabase
    .from('seasons')
    .select(SEASON_SELECT)
    .eq('status', 'active')
    .order('season_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return (data as Season | null) ?? null;
};

export const getSeasons = async (): Promise<Season[]> => {
  const { data, error } = await supabase
    .from('seasons')
    .select(SEASON_SELECT)
    .in('status', ['upcoming', 'active', 'completed', 'archived'])
    .order('season_number', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as Season[]) ?? [];
};

export const getTopLeaderboard = async (
  seasonId: string,
  category: string,
  limit = 30
): Promise<LeaderboardPlayer[]> => {
  const safeLimit = Math.min(Math.max(limit, 1), 30);

  const { data: categoryConfig, error: categoryError } = await supabase
    .from('leaderboard_categories')
    .select('sort_direction')
    .eq('category_id', category)
    .maybeSingle();

  if (categoryError) throw new Error(categoryError.message);

  const ascending = categoryConfig?.sort_direction === 'asc';

  const { data, error } = await supabase
    .from('season_leaderboard_entries')
    .select(
      'minecraft_uuid, username, score, display_score, badge, guild, avatar_url'
    )
    .eq('season_id', seasonId)
    .eq('category', category)
    .order('score', { ascending })
    .limit(safeLimit);

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    return data.map((entry, index) => ({
      rank: index + 1,
      minecraftUuid: String(entry.minecraft_uuid),
      username: String(entry.username),
      score:
        entry.display_score ||
        fallbackFormatScore(category, Number(entry.score) || 0),
      rawValue: Number(entry.score) || 0,
      badge: entry.badge || undefined,
      guild: entry.guild || undefined,
      avatarUrl:
        entry.avatar_url ||
        `https://mc-heads.net/avatar/${encodeURIComponent(String(entry.username))}/64`,
    }));
  }

  return getHistoricalLeaderboardRows(seasonId, category, safeLimit);
};

export const getPlayerRank = async (
  seasonId: string,
  category: string,
  minecraftUuid: string
): Promise<PlayerRankResult> => {
  const { data, error } = await supabase.rpc(
    'get_player_leaderboard_rank',
    {
      p_season_id: seasonId,
      p_category: category,
      p_minecraft_uuid: minecraftUuid,
    }
  );

  if (!error) {
    const row = Array.isArray(data) ? data[0] : null;

    if (row) {
      return {
        rank: row.rank == null ? null : Number(row.rank),
        score: row.score == null ? null : Number(row.score),
        totalPlayers: Number(row.total_players) || 0,
      };
    }
  }

  const { data: season } = await supabase
    .from('seasons')
    .select('status')
    .eq('id', seasonId)
    .maybeSingle();

  if (!season || !['completed', 'archived'].includes(String(season.status))) {
    if (error) throw new Error(error.message);
    return { rank: null, score: null, totalPlayers: 0 };
  }

  const allHistoricalRows = await getHistoricalLeaderboardRows(
    seasonId,
    category,
    1000
  );

  const player = allHistoricalRows.find(
    (row) => row.minecraftUuid === minecraftUuid
  );

  if (player) {
    return {
      rank: player.rank,
      score: player.rawValue,
      totalPlayers: allHistoricalRows.length,
    };
  }

  if (error) throw new Error(error.message);

  return { rank: null, score: null, totalPlayers: 0 };
};
