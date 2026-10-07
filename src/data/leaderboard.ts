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

  return (data ?? []).map((entry, index) => ({
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
      `https://mc-heads.net/avatar/${encodeURIComponent(
        String(entry.username)
      )}/64`,
  }));
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

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : null;

  if (!row) {
    return { rank: null, score: null, totalPlayers: 0 };
  }

  return {
    rank: row.rank == null ? null : Number(row.rank),
    score: row.score == null ? null : Number(row.score),
    totalPlayers: Number(row.total_players) || 0,
  };
};
