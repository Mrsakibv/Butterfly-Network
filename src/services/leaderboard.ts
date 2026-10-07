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

const fallbackFormatScore = (
  category: string,
  value: number
) => {
  switch (category) {
    case 'money':
      return `$${value.toLocaleString()}`;

    case 'playtime':
    case 'playtime_seconds': {
      const hours = value / 3600;

      if (hours >= 1) {
        return `${hours.toFixed(1)} hrs`;
      }

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
  const value =
    snapshot[statKey];

  return Number.isFinite(Number(value))
    ? Number(value)
    : 0;
};

const readStatistic = (
  source: Record<string, any> | null | undefined,
  statKey: string
): number => {
  const statistics =
    source?.statistics_snapshot &&
    typeof source.statistics_snapshot === 'object'
      ? source.statistics_snapshot
      : {};

  const value =
    statistics?.[statKey];

  return Number.isFinite(Number(value))
    ? Number(value)
    : 0;
};

const historicalDisplay = (
  score: number,
  format: string,
  prefix = '',
  suffix = '',
  decimalPlaces = 0
): string => {
  const safe = Number.isFinite(score)
    ? score
    : 0;

  const decimals = Math.max(
    0,
    Math.min(
      4,
      Number(decimalPlaces) || 0
    )
  );

  if (format === 'currency') {
    return `$${safe.toLocaleString('en-US', {
      maximumFractionDigits: decimals,
    })}`;
  }

  if (format === 'hearts') {
    return `❤ ${safe.toLocaleString('en-US', {
      maximumFractionDigits: decimals,
    })}`;
  }

  if (format === 'hours') {
    const hours = safe / 3600;
    return `${hours.toFixed(Math.max(1, decimals)).replace(/\.0+$/, '')} hrs`;
  }

  return `${prefix}${safe.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  })}${suffix}`;
};

const getHistoricalLeaderboardRows = async (
  seasonId: string,
  category: string,
  limit = 30
): Promise<LeaderboardPlayer[]> => {
  const { data: season, error: seasonError } =
    await supabase
      .from('seasons')
      .select('id, status')
      .eq('id', seasonId)
      .maybeSingle();

  if (seasonError) {
    throw new Error(seasonError.message);
  }

  if (
    !season ||
    (season.status !== 'completed' &&
      season.status !== 'archived')
  ) {
    return [];
  }

  const { data: config, error: configError } =
    await supabase
      .from('leaderboard_categories')
      .select(
        'category_id, stat_key, source_type, ranking_mode, display_format, prefix, suffix, decimal_places, sort_direction'
      )
      .eq('category_id', category)
      .maybeSingle();

  if (configError) {
    throw new Error(configError.message);
  }

  if (!config) {
    return [];
  }

  const { data: snapshots, error: snapshotError } =
    await supabase
      .from('season_player_snapshots')
      .select(
        `
        season_id,
        minecraft_uuid,
        minecraft_username,
        server_id,
        hearts,
        kills,
        deaths,
        money,
        playtime_seconds,
        wins,
        kill_streak,
        blocks_broken,
        blocks_placed,
        items_crafted,
        items_used,
        mobs_killed,
        players_killed,
        distance_walked,
        distance_run,
        distance_flown,
        damage_dealt,
        damage_taken,
        jumps,
        statistics_snapshot,
        captured_at
        `
      )
      .eq('season_id', seasonId)
      .range(0, 4999);

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  if (!snapshots?.length) {
    return [];
  }

  const { data: baselines, error: baselineError } =
    await supabase
      .from('season_player_baselines')
      .select(
        `
        season_id,
        minecraft_uuid,
        hearts,
        kills,
        deaths,
        money,
        playtime_seconds,
        wins,
        kill_streak,
        blocks_broken,
        blocks_placed,
        items_crafted,
        items_used,
        mobs_killed,
        players_killed,
        distance_walked,
        distance_run,
        distance_flown,
        damage_dealt,
        damage_taken,
        jumps,
        statistics_snapshot
        `
      )
      .eq('season_id', seasonId)
      .range(0, 4999);

  if (baselineError) {
    throw new Error(baselineError.message);
  }

  const baselineMap = new Map<
    string,
    Record<string, any>
  >();

  for (const baseline of baselines ?? []) {
    baselineMap.set(
      String(baseline.minecraft_uuid),
      baseline as Record<string, any>
    );
  }

  const rows =
    (snapshots as Record<string, any>[])
      .map((snapshot) => {
        const uuid = String(
          snapshot.minecraft_uuid
        );

        const baseline =
          baselineMap.get(uuid) || {};

        const snapshotValue =
          config.source_type ===
          'minecraft_statistic'
            ? readStatistic(
                snapshot,
                config.stat_key
              )
            : readSnapshotStat(
                snapshot,
                config.stat_key
              );

        const baselineValue =
          config.source_type ===
          'minecraft_statistic'
            ? readStatistic(
                baseline,
                config.stat_key
              )
            : readSnapshotStat(
                baseline,
                config.stat_key
              );

        const score = Math.max(
          0,
          config.ranking_mode === 'delta'
            ? snapshotValue - baselineValue
            : snapshotValue
        );

        const username = String(
          snapshot.minecraft_username ||
            'Unknown Player'
        );

        return {
          rank: 0,
          minecraftUuid: uuid,
          username,
          score: historicalDisplay(
            score,
            config.display_format,
            config.prefix,
            config.suffix,
            Number(config.decimal_places) || 0
          ),
          rawValue: score,
          avatarUrl:
            `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`,
        };
      });

  rows.sort((a, b) => {
    if (
      config.sort_direction === 'asc'
    ) {
      return a.rawValue - b.rawValue;
    }

    return b.rawValue - a.rawValue;
  });

  return rows
    .slice(
      0,
      Math.min(
        Math.max(limit, 1),
        100
      )
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
};

const getHistoricalPlayerRank = async (
  seasonId: string,
  category: string,
  minecraftUuid: string
): Promise<PlayerRankResult> => {
  const rows =
    await getHistoricalLeaderboardRows(
      seasonId,
      category,
      5000
    );

  const player = rows.find(
    (row) =>
      row.minecraftUuid ===
      minecraftUuid
  );

  if (!player) {
    return {
      rank: null,
      score: null,
      totalPlayers: rows.length,
    };
  }

  return {
    rank: player.rank,
    score: player.rawValue,
    totalPlayers: rows.length,
  };
};

export const getActiveSeason = async (): Promise<Season | null> => {
  const { data, error } = await supabase
    .from('seasons')
    .select(SEASON_SELECT)
    .eq('status', 'active')
    .order('season_number', {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Season | null) ?? null;
};

export const getSeasons = async (): Promise<Season[]> => {
  const { data, error } = await supabase
    .from('seasons')
    .select(SEASON_SELECT)
    .in('status', [
      'upcoming',
      'active',
      'completed',
      'archived',
    ])
    .order('season_number', {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Season[]) ?? [];
};

export const getTopLeaderboard = async (
  seasonId: string,
  category: string,
  limit = 30
): Promise<LeaderboardPlayer[]> => {
  const safeLimit = Math.min(
    Math.max(limit, 1),
    100
  );

  const { data: config, error: configError } =
    await supabase
      .from('leaderboard_categories')
      .select('sort_direction')
      .eq('category_id', category)
      .maybeSingle();

  if (configError) {
    throw new Error(configError.message);
  }

  const ascending =
    config?.sort_direction === 'asc';

  const { data, error } =
    await supabase
      .from('season_leaderboard_entries')
      .select(
        'minecraft_uuid, username, score, display_score, badge, guild, avatar_url'
      )
      .eq('season_id', seasonId)
      .eq('category', category)
      .order('score', {
        ascending,
      })
      .limit(safeLimit);

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    return data.map((entry, index) => ({
      rank: index + 1,
      minecraftUuid: String(
        entry.minecraft_uuid
      ),
      username: String(
        entry.username
      ),
      score:
        entry.display_score ||
        fallbackFormatScore(
          category,
          Number(entry.score) || 0
        ),
      rawValue:
        Number(entry.score) || 0,
      badge:
        entry.badge || undefined,
      guild:
        entry.guild || undefined,
      avatarUrl:
        entry.avatar_url ||
        `https://mc-heads.net/avatar/${encodeURIComponent(
          String(entry.username)
        )}/64`,
    }));
  }

  /*
   * Do not fall back to player_minecraft_stats.
   * That table is global/current data and would leak current server
   * values into a completed historical season.
   *
   * Completed/archived seasons can safely fall back to their frozen
   * snapshots when materialized leaderboard rows are missing.
   */
  return getHistoricalLeaderboardRows(
    seasonId,
    category,
    safeLimit
  );
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

  if (
    !error &&
    Array.isArray(data) &&
    data.length > 0
  ) {
    const row = data[0];

    return {
      rank:
        row.rank == null
          ? null
          : Number(row.rank),
      score:
        row.score == null
          ? null
          : Number(row.score),
      totalPlayers:
        Number(row.total_players) || 0,
    };
  }

  const { data: season } =
    await supabase
      .from('seasons')
      .select('status')
      .eq('id', seasonId)
      .maybeSingle();

  if (
    season?.status === 'completed' ||
    season?.status === 'archived'
  ) {
    return getHistoricalPlayerRank(
      seasonId,
      category,
      minecraftUuid
    );
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    rank: null,
    score: null,
    totalPlayers: 0,
  };
};
