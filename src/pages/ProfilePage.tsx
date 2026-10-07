import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';
import {
  ArrowLeft,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Crown,
  ExternalLink,
  Flame,
  Gem,
  Globe2,
  Heart,
  Loader2,
  LockKeyhole,
  Medal,
  Pickaxe,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { ProfileHeader } from '../components/ProfileHeader';
import { PostCard } from '../components/social/PostCard';
import { getUserPosts } from '../services/social';
import type { BadgeType } from '../types/badges';

type PageTab = 'season' | 'activity' | 'posts';
type SeasonStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'archived';

type UnknownRecord = Record<string, unknown>;

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  created_at: string | null;
  minecraft_username: string | null;
  role: string | null;
  badge: BadgeType | null;
  cover_image: string | null;
}

interface SeasonSummary {
  season_id: string;
  season_number: number;
  season_name: string;
  season_slug: string;
  season_status: SeasonStatus;
  season_cover_image_url: string;
  starts_at: string | null;
  ends_at: string | null;
  minecraft_uuid: string;
  minecraft_username: string;
  rank_name: string;
  team_name: string;

  hearts: number;
  kills: number;
  deaths: number;
  money: number;
  playtime_seconds: number;
  wins: number;
  kill_streak: number;

  blocks_broken: number;
  blocks_placed: number;
  items_crafted: number;
  items_used: number;

  mobs_killed: number;
  players_killed: number;

  distance_walked: number;
  distance_run: number;
  distance_flown: number;

  damage_dealt: number;
  damage_taken: number;

  jumps: number;

  statistics_snapshot: UnknownRecord;
  season_stats_snapshot: UnknownRecord;
  captured_at: string | null;
  isCurrent: boolean;
  hasPlayedSeason: boolean;
}

interface SeasonConfig {
  season_id: string;
  category_id: string;
  display_name: string;
  stat_key: string;
  source_type: string;
  ranking_mode: string;
  display_format: string;
  prefix: string;
  suffix: string;
  decimal_places: number;
  icon_name: string;
  icon_url: string;
  image_url: string;
  sort_order: number;
}

interface CurrentMinecraftStats {
  minecraft_uuid: string;
  minecraft_username: string;
  server_id: string;

  hearts: number;
  kills: number;
  deaths: number;
  money: number;
  playtime_seconds: number;
  wins: number;
  kill_streak: number;

  blocks_broken: number;
  blocks_placed: number;
  items_crafted: number;
  items_used: number;

  mobs_killed: number;
  players_killed: number;

  distance_walked: number;
  distance_run: number;
  distance_flown: number;

  damage_dealt: number;
  damage_taken: number;

  jumps: number;

  updated_at: string | null;
}

interface LeaderboardPreviewRow {
  minecraft_uuid: string;
  username: string;
  score: number;
  display_score: string;
  badge: string | null;
  guild: string | null;
  avatar_url: string | null;
}

interface RankData {
  rank: number | null;
  score: number | null;
  totalPlayers: number;
}

interface SeasonAchievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  rarity: string;
  reward: string;
  isCustom: boolean;
  earnedAt: string | null;
  kind: 'standard' | 'custom' | 'season-record';
  statKey: string;
  recordValue: number | null;
}

interface SeasonAdvancement {
  id: string;
  advancementKey: string;
  title: string;
  description: string;
  iconMaterial: string;
  completed: boolean;
  completedAt: string | null;
}

interface SeasonTeamInfo {
  name: string;
  tag: string;
  iconUrl: string;
  role: string;
  dragonEgg: string;
  honors: string[];
}

interface SeasonAward {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  type: string;
}

const STAT_ICONS: Record<string, React.ElementType> = {
  hearts: Heart,
  kills: Swords,
  deaths: Shield,
  money: Gem,
  playtime_seconds: Clock3,
  wins: Trophy,
  kill_streak: Flame,

  blocks_broken: Pickaxe,
  blocks_placed: Pickaxe,

  items_crafted: Sparkles,
  items_used: Zap,

  mobs_killed: Swords,
  players_killed: Target,

  distance_walked: Globe2,
  distance_run: Globe2,
  distance_flown: Globe2,

  damage_dealt: Swords,
  damage_taken: Shield,

  jumps: BarChart3,
};

const FALLBACK_ACHIEVEMENT_ICONS = [
  Award,
  Medal,
  Target,
  Crown,
  Sparkles,
];

const readString = (
  row: UnknownRecord,
  keys: string[],
  fallback = ''
): string => {
  for (const key of keys) {
    const value = row[key];

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
  }

  return fallback;
};

const readNumber = (
  row: UnknownRecord,
  keys: string[],
  fallback = 0
): number => {
  for (const key of keys) {
    const value = row[key];

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

const readBoolean = (
  row: UnknownRecord,
  keys: string[],
  fallback = false
): boolean => {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase();

      if (
        [
          'true',
          'yes',
          '1',
          'owned',
          'won',
        ].includes(lower)
      ) {
        return true;
      }

      if (
        [
          'false',
          'no',
          '0',
          'none',
        ].includes(lower)
      ) {
        return false;
      }
    }
  }

  return fallback;
};

const toRecord = (
  value: unknown
): UnknownRecord =>
  value &&
  typeof value === 'object'
    ? (value as UnknownRecord)
    : {};

const normalizeUsername = (
  value: string | null | undefined
) =>
  (value || '')
    .trim()
    .toLowerCase();

const formatCompactDate = (
  value: string | null
) => {
  if (!value) {
    return 'Not scheduled';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString(
    [],
    {
      month: 'short',
      year: 'numeric',
    }
  );
};

const formatDateRange = (
  start: string | null,
  end: string | null
) =>
  `${formatCompactDate(start)} → ${formatCompactDate(end)}`;

const formatInteger = (
  value: number
) =>
  new Intl.NumberFormat(
    undefined,
    {
      maximumFractionDigits: 0,
    }
  ).format(value || 0);

const formatHours = (
  seconds: number
) => {
  const safe =
    Math.max(
      0,
      Number(seconds) || 0
    );

  const hours =
    Math.floor(
      safe / 3600
    );

  const minutes =
    Math.floor(
      (safe % 3600) / 60
    );

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes
    .toString()
    .padStart(2, '0')}m`;
};

const formatSeasonRecordValue = (
  statKey: string,
  value: number
) => {
  if (statKey === 'playtime_seconds') {
    return formatHours(value);
  }

  if (
    [
      'distance_walked',
      'distance_run',
      'distance_flown',
    ].includes(statKey)
  ) {
    return `${formatInteger(value)} blocks`;
  }

  return formatInteger(value);
};

const seasonRecordLabel = (
  statKey: string
) => {
  const labels: Record<string, string> = {
    kills: 'Kills',
    deaths: 'Deaths',
    playtime_seconds: 'Playtime',
    wins: 'Wins',
    kill_streak: 'Kill Streak',
    blocks_broken: 'Blocks Broken',
    blocks_placed: 'Blocks Placed',
    items_crafted: 'Items Crafted',
    items_used: 'Items Used',
    mobs_killed: 'Mobs Killed',
    players_killed: 'Players Killed',
    distance_walked: 'Distance Walked',
    distance_run: 'Distance Run',
    distance_flown: 'Distance Flown',
    damage_dealt: 'Damage Dealt',
    damage_taken: 'Damage Taken',
    jumps: 'Jumps',
  };

  return labels[statKey] || statKey.replaceAll('_', ' ');
};

const formatValue = (
  value: number,
  config: Pick<
    SeasonConfig,
    | 'display_format'
    | 'prefix'
    | 'suffix'
    | 'decimal_places'
  >
) => {
  const decimals =
    Math.max(
      0,
      Number(
        config.decimal_places
      ) || 0
    );

  let display = '';

  switch (
    config.display_format
  ) {
    case 'hearts':
      display =
        `❤ ${Number(
          value || 0
        ).toFixed(decimals)}`;
      break;

    case 'currency':
      display =
        new Intl.NumberFormat(
          undefined,
          {
            minimumFractionDigits:
              decimals,
            maximumFractionDigits:
              decimals,
          }
        ).format(
          Number(value || 0)
        );
      break;

    case 'hours':
      display =
        formatHours(value);
      break;

    case 'decimal':
      display =
        Number(
          value || 0
        ).toFixed(decimals);
      break;

    default:
      display =
        formatInteger(value);
  }

  return `${config.prefix || ''}${display}${config.suffix || ''}`.trim();
};

const statValueFromSeason = (
  season: SeasonSummary,
  statKey: string
) => {
  const direct =
    season[
      statKey as keyof SeasonSummary
    ];

  if (
    typeof direct === 'number'
  ) {
    return direct;
  }

  const dynamic =
    season.statistics_snapshot?.[
      statKey
    ];

  return typeof dynamic === 'number'
    ? dynamic
    : Number(dynamic) || 0;
};

const normalizeSnapshot = (
  row: UnknownRecord
): SeasonSummary => ({
  season_id: String(
    row.season_id || ''
  ),

  season_number:
    readNumber(
      row,
      ['season_number']
    ),

  season_name:
    readString(
      row,
      ['season_name', 'name'],
      'Season'
    ),

  season_slug:
    readString(
      row,
      ['season_slug', 'slug']
    ),

  season_status:
    (
      readString(
        row,
        [
          'season_status',
          'status',
        ],
        'completed'
      ) ||
      'completed'
    ) as SeasonStatus,

  season_cover_image_url:
    readString(
      row,
      [
        'season_cover_image_url',
        'cover_image_url',
      ]
    ),

  starts_at:
    readString(
      row,
      ['starts_at']
    ) || null,

  ends_at:
    readString(
      row,
      ['ends_at']
    ) || null,

  minecraft_uuid:
    readString(
      row,
      ['minecraft_uuid']
    ),

  minecraft_username:
    readString(
      row,
      [
        'minecraft_username',
        'username',
      ]
    ),

  rank_name:
    readString(
      row,
      ['rank_name', 'rank'],
      ''
    ),

  team_name:
    readString(
      row,
      ['team_name', 'team'],
      ''
    ),

  hearts:
    readNumber(
      row,
      ['hearts']
    ),

  kills:
    readNumber(
      row,
      ['kills']
    ),

  deaths:
    readNumber(
      row,
      ['deaths']
    ),

  money:
    readNumber(
      row,
      ['money']
    ),

  playtime_seconds:
    readNumber(
      row,
      ['playtime_seconds']
    ),

  wins:
    readNumber(
      row,
      ['wins']
    ),

  kill_streak:
    readNumber(
      row,
      ['kill_streak']
    ),

  blocks_broken:
    readNumber(
      row,
      ['blocks_broken']
    ),

  blocks_placed:
    readNumber(
      row,
      ['blocks_placed']
    ),

  items_crafted:
    readNumber(
      row,
      ['items_crafted']
    ),

  items_used:
    readNumber(
      row,
      ['items_used']
    ),

  mobs_killed:
    readNumber(
      row,
      ['mobs_killed']
    ),

  players_killed:
    readNumber(
      row,
      ['players_killed']
    ),

  distance_walked:
    readNumber(
      row,
      ['distance_walked']
    ),

  distance_run:
    readNumber(
      row,
      ['distance_run']
    ),

  distance_flown:
    readNumber(
      row,
      ['distance_flown']
    ),

  damage_dealt:
    readNumber(
      row,
      ['damage_dealt']
    ),

  damage_taken:
    readNumber(
      row,
      ['damage_taken']
    ),

  jumps:
    readNumber(
      row,
      ['jumps']
    ),

  statistics_snapshot:
    toRecord(
      row.statistics_snapshot
    ),

  season_stats_snapshot:
    toRecord(
      row.season_stats_snapshot
    ),

  captured_at:
    readString(
      row,
      ['captured_at']
    ) || null,

  isCurrent: false,
  hasPlayedSeason: true,
});

const buildCurrentSeason = (
  season: UnknownRecord,
  stats: CurrentMinecraftStats,
  identity: UnknownRecord,
  hasPlayedSeason = true
): SeasonSummary => ({
  season_id:
    String(
      season.id || ''
    ),

  season_number:
    readNumber(
      season,
      ['season_number']
    ),

  season_name:
    readString(
      season,
      ['name'],
      'Current Season'
    ),

  season_slug:
    readString(
      season,
      ['slug']
    ),

  season_status:
    'active',

  season_cover_image_url:
    readString(
      season,
      ['cover_image_url']
    ),

  starts_at:
    readString(
      season,
      ['starts_at']
    ) || null,

  ends_at:
    readString(
      season,
      ['ends_at']
    ) || null,

  minecraft_uuid:
    stats.minecraft_uuid,

  minecraft_username:
    stats.minecraft_username,

  rank_name:
    readString(
      identity,
      ['rank_name', 'rank'],
      ''
    ),

  team_name:
    readString(
      identity,
      ['team_name', 'team'],
      ''
    ),

  hearts:
    stats.hearts,

  kills:
    stats.kills,

  deaths:
    stats.deaths,

  money:
    stats.money,

  playtime_seconds:
    stats.playtime_seconds,

  wins:
    stats.wins,

  kill_streak:
    stats.kill_streak,

  blocks_broken:
    stats.blocks_broken,

  blocks_placed:
    stats.blocks_placed,

  items_crafted:
    stats.items_crafted,

  items_used:
    stats.items_used,

  mobs_killed:
    stats.mobs_killed,

  players_killed:
    stats.players_killed,

  distance_walked:
    stats.distance_walked,

  distance_run:
    stats.distance_run,

  distance_flown:
    stats.distance_flown,

  damage_dealt:
    stats.damage_dealt,

  damage_taken:
    stats.damage_taken,

  jumps:
    stats.jumps,

  statistics_snapshot: {},

  season_stats_snapshot: {},

  captured_at:
    stats.updated_at,

  isCurrent: true,
  hasPlayedSeason,
});

const buildUnplayedSeason = (
  season: UnknownRecord,
  identity: UnknownRecord
): SeasonSummary => ({
  season_id: String(season.id || ''),
  season_number: readNumber(season, ['season_number']),
  season_name: readString(season, ['name'], 'Season'),
  season_slug: readString(season, ['slug']),
  season_status: (readString(season, ['status'], 'completed') || 'completed') as SeasonStatus,
  season_cover_image_url: readString(season, ['cover_image_url']),
  starts_at: readString(season, ['starts_at']) || null,
  ends_at: readString(season, ['ends_at']) || null,
  minecraft_uuid: readString(identity, ['minecraft_uuid', 'uuid']),
  minecraft_username: readString(identity, ['minecraft_username', 'username']),
  rank_name: '',
  team_name: '',
  hearts: 0,
  kills: 0,
  deaths: 0,
  money: 0,
  playtime_seconds: 0,
  wins: 0,
  kill_streak: 0,
  blocks_broken: 0,
  blocks_placed: 0,
  items_crafted: 0,
  items_used: 0,
  mobs_killed: 0,
  players_killed: 0,
  distance_walked: 0,
  distance_run: 0,
  distance_flown: 0,
  damage_dealt: 0,
  damage_taken: 0,
  jumps: 0,
  statistics_snapshot: {},
  season_stats_snapshot: {},
  captured_at: null,
  isCurrent:
    String(season.status || '').toLowerCase() === 'active',
  hasPlayedSeason: false,
});

const isRowForPlayer = (
  row: UnknownRecord,
  minecraftUuid: string,
  minecraftUsername: string,
  profileId: string
) => {
  const normalizedUuid =
    readString(
      row,
      [
        'minecraft_uuid',
        'uuid',
      ]
    );

  const normalizedUsername =
    normalizeUsername(
      readString(
        row,
        [
          'minecraft_username',
          'username',
          'player_name',
        ]
      )
    );

  const linkedProfile =
    readString(
      row,
      [
        'website_user_id',
        'profile_id',
        'user_id',
        'player_id',
      ]
    );

  if (
    normalizedUuid &&
    normalizedUuid === minecraftUuid
  ) {
    return true;
  }

  if (
    normalizedUsername &&
    normalizedUsername ===
      normalizeUsername(
        minecraftUsername
      )
  ) {
    return true;
  }

  if (
    linkedProfile &&
    linkedProfile === profileId
  ) {
    return true;
  }

  return false;
};

const rowMatchesSeason = (
  row: UnknownRecord,
  season: SeasonSummary,
  allowUndatedForCurrent: boolean
) => {
  const explicitSeason =
    readString(
      row,
      [
        'season_id',
        'season_uuid',
        'season',
      ]
    );

  if (explicitSeason) {
    return (
      explicitSeason ===
      season.season_id
    );
  }

  const timestamp =
    readString(
      row,
      [
        'unlocked_at',
        'earned_at',
        'completed_at',
        'awarded_at',
        'created_at',
        'date',
      ]
    );

  if (!timestamp) {
    return (
      allowUndatedForCurrent &&
      season.isCurrent
    );
  }

  const when =
    new Date(timestamp).getTime();

  if (!Number.isFinite(when)) {
    return false;
  }

  const start =
    season.starts_at
      ? new Date(
          season.starts_at
        ).getTime()
      : Number.NEGATIVE_INFINITY;

  const end =
    season.ends_at
      ? new Date(
          season.ends_at
        ).getTime()
      : Number.POSITIVE_INFINITY;

  return (
    when >= start &&
    when <= end
  );
};

const loadTable = async (
  table: string
) => {
  const {
    data,
    error,
  } =
    await supabase
      .from(table)
      .select('*')
      .limit(500);

  if (error) {
    return [] as UnknownRecord[];
  }

  return (
    data || []
  ).map(toRecord);
};

const GlassButton = ({
  active,
  children,
  onClick,
  className = '',
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'border-purple-400/40 bg-purple-500/15 text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.10)]'
        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
    } ${className}`}
  >
    {children}
  </button>
);

const SectionHeader = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
    <div>
      {eyebrow && (
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-purple-400/80">
          {eyebrow}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 text-purple-300">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="font-heading text-xl font-extrabold text-white">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>

    {action}
  </div>
);

export const ProfilePage: React.FC = () => {
  const { navigate } =
    useRouter();

  const [profile, setProfile] =
    useState<ProfileData | null>(
      null
    );

  const [isMinecraftOnly, setIsMinecraftOnly] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(
    null
  );

  const [activeTab, setActiveTab] =
    useState<PageTab>(
      'season'
    );

  const [
    userPosts,
    setUserPosts,
  ] = useState<any[]>([]);

  const [
    postsLoading,
    setPostsLoading,
  ] = useState(false);

  const [
    minecraftUuid,
    setMinecraftUuid,
  ] = useState<string | null>(
    null
  );

  const [
    minecraftUsername,
    setMinecraftUsername,
  ] = useState<string | null>(
    null
  );

  const [
    seasons,
    setSeasons,
  ] = useState<SeasonSummary[]>(
    []
  );

  const [
    currentCategories,
    setCurrentCategories,
  ] = useState<SeasonConfig[]>(
    []
  );

  const [
    historicalConfigs,
    setHistoricalConfigs,
  ] = useState<
    Record<
      string,
      SeasonConfig[]
    >
  >({});

  const [
    selectedSeasonId,
    setSelectedSeasonId,
  ] = useState<string | null>(
    null
  );

  const [
    showAllSeasons,
    setShowAllSeasons,
  ] = useState(false);

  const [
    selectedStatKey,
    setSelectedStatKey,
  ] = useState<string>(
    'kills'
  );

  const [
    leaderboardRows,
    setLeaderboardRows,
  ] = useState<
    LeaderboardPreviewRow[]
  >([]);

  const [
    leaderboardRank,
    setLeaderboardRank,
  ] = useState<RankData>({
    rank: null,
    score: null,
    totalPlayers: 0,
  });

  const [
    leaderboardLoading,
    setLeaderboardLoading,
  ] = useState(false);

  const [
    achievements,
    setAchievements,
  ] = useState<
    SeasonAchievement[]
  >([]);

  const [
    advancements,
    setAdvancements,
  ] = useState<SeasonAdvancement[]>([]);

  const [
    showAllAdvancements,
    setShowAllAdvancements,
  ] = useState(false);

  const [awards, setAwards] =
    useState<SeasonAward[]>(
      []
    );

  const [
    teamInfo,
    setTeamInfo,
  ] = useState<SeasonTeamInfo | null>(
    null
  );

  const [
    extrasLoading,
    setExtrasLoading,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const selectedSeason =
    useMemo(
      () =>
        seasons.find(
          (season) =>
            season.season_id ===
            selectedSeasonId
        ) ?? null,
      [
        seasons,
        selectedSeasonId,
      ]
    );

  const selectedConfigs =
    useMemo(() => {
      if (
        !selectedSeason ||
        !selectedSeason.hasPlayedSeason
      ) {
        return [];
      }

      if (
        selectedSeason.isCurrent
      ) {
        return currentCategories;
      }

      return (
        historicalConfigs[
          selectedSeason
            .season_id
        ] ?? []
      );
    }, [
      currentCategories,
      historicalConfigs,
      selectedSeason,
    ]);

  const previewSeasons =
    useMemo(
      () =>
        showAllSeasons
          ? seasons
          : seasons.slice(
              0,
              5
            ),
      [
        seasons,
        showAllSeasons,
      ]
    );

  const loadPosts =
    useCallback(
      async () => {
        if (!profile || isMinecraftOnly) {
          setUserPosts([]);
          setPostsLoading(false);
          return;
        }

        setPostsLoading(
          true
        );

        const {
          data,
          error:
            postsError,
        } =
          await getUserPosts(
            profile.id
          );

        if (!postsError) {
          setUserPosts(
            (data || []).map(
              (post) => ({
                ...post,

                profiles: {
                  id: profile.id,
                  username:
                    profile.username,
                  minecraft_username:
                    profile.minecraft_username,
                  role:
                    profile.role,
                  badge:
                    profile.badge,
                },
              })
            )
          );
        }

        setPostsLoading(
          false
        );
      },
      [profile, isMinecraftOnly]
    );

  const loadProfile =
    useCallback(
      async () => {
        setLoading(true);
        setError('');
        setIsMinecraftOnly(false);

        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser();

        setCurrentUserId(
          user?.id || null
        );

        const searchParams =
          new URLSearchParams(
            window.location.search
          );

        const targetUserId =
          searchParams
            .get('id')
            ?.trim() || null;

        const targetUsername =
          searchParams
            .get('u')
            ?.trim() || null;

        const targetMinecraftUsername =
          searchParams
            .get('mc')
            ?.trim() || null;

        const targetMinecraftUuid =
          searchParams
            .get('mcu')
            ?.trim()
            .toLowerCase() || null;

        /*
         * ------------------------------------------------------
         * Normal website profile lookup
         * ------------------------------------------------------
         */
        if (targetUserId) {
          const {
            data,
            error: profileError,
          } =
            await supabase
              .from('profiles')
              .select(
                'id, full_name, username, bio, created_at, minecraft_username, role, badge, cover_image'
              )
              .eq(
                'id',
                targetUserId
              )
              .maybeSingle();

          if (profileError) {
            console.error(
              'Profile load error:',
              profileError
            );

            setProfile(null);
            setError(profileError.message);
            setLoading(false);
            return;
          }

          if (data) {
            setProfile(
              data as ProfileData
            );
            setIsMinecraftOnly(false);
            setLoading(false);
            return;
          }
        }

        if (targetUsername) {
          const {
            data,
            error: profileError,
          } =
            await supabase
              .from('profiles')
              .select(
                'id, full_name, username, bio, created_at, minecraft_username, role, badge, cover_image'
              )
              .ilike(
                'username',
                targetUsername
              )
              .limit(1)
              .maybeSingle();

          if (profileError) {
            console.error(
              'Website profile username lookup error:',
              profileError
            );
          }

          if (data) {
            setProfile(
              data as ProfileData
            );
            setIsMinecraftOnly(false);
            setLoading(false);
            return;
          }
        }

        /*
         * ------------------------------------------------------
         * Minecraft profile lookup
         *
         * This is the important fallback that makes a Minecraft
         * player visible even when there is NO website account and
         * no minecraft username saved in profiles.
         *
         * Priority:
         *   UUID -> minecraft_links -> profiles
         *   UUID -> player_minecraft_stats
         *   UUID -> season_leaderboard_entries
         *   Username -> profiles
         *   Username -> player_minecraft_stats
         * ------------------------------------------------------
         */
        if (
          targetMinecraftUuid ||
          targetMinecraftUsername
        ) {
          let resolvedUuid =
            targetMinecraftUuid;

          let resolvedUsername =
            targetMinecraftUsername;

          /*
           * 1) UUID -> linked website profile.
           */
          if (targetMinecraftUuid) {
            const {
              data: link,
              error: linkError,
            } =
              await supabase
                .from(
                  'minecraft_links'
                )
                .select(
                  'website_user_id, minecraft_uuid'
                )
                .eq(
                  'minecraft_uuid',
                  targetMinecraftUuid
                )
                .eq(
                  'is_active',
                  true
                )
                .limit(1)
                .maybeSingle();

            if (linkError) {
              console.error(
                'Minecraft link lookup error:',
                linkError
              );
            }

            if (
              link?.website_user_id
            ) {
              const {
                data: linkedProfile,
                error: linkedProfileError,
              } =
                await supabase
                  .from('profiles')
                  .select(
                    'id, full_name, username, bio, created_at, minecraft_username, role, badge, cover_image'
                  )
                  .eq(
                    'id',
                    link.website_user_id
                  )
                  .maybeSingle();

              if (linkedProfileError) {
                console.error(
                  'Linked profile lookup error:',
                  linkedProfileError
                );
              }

              if (linkedProfile) {
                setProfile(
                  linkedProfile as ProfileData
                );
                setIsMinecraftOnly(false);
                setLoading(false);
                return;
              }
            }
          }

          /*
           * 2) UUID/name -> synced player stats.
           */
          let statsQuery =
            supabase
              .from(
                'player_minecraft_stats'
              )
              .select(
                'minecraft_uuid, minecraft_username, server_id, updated_at'
              )
              .eq(
                'server_id',
                'main'
              )
              .order(
                'updated_at',
                {
                  ascending: false,
                }
              )
              .limit(1);

          if (resolvedUuid) {
            statsQuery =
              statsQuery.eq(
                'minecraft_uuid',
                resolvedUuid
              );
          } else if (resolvedUsername) {
            statsQuery =
              statsQuery.ilike(
                'minecraft_username',
                resolvedUsername
              );
          }

          const {
            data: statsPlayer,
            error: statsError,
          } =
            await statsQuery.maybeSingle();

          if (statsError) {
            console.error(
              'Minecraft stats profile lookup error:',
              statsError
            );
          }

          if (statsPlayer) {
            resolvedUuid =
              String(
                statsPlayer.minecraft_uuid ||
                  resolvedUuid ||
                  ''
              )
                .trim()
                .toLowerCase() || null;

            resolvedUsername =
              String(
                statsPlayer.minecraft_username ||
                  resolvedUsername ||
                  ''
              ).trim() || null;
          }

          /*
           * 3) If the player was never written to stats yet,
           *    use the leaderboard table as identity fallback.
           *    This is important for players visible in leaderboard.
           */
          if (
            !resolvedUsername ||
            !resolvedUuid
          ) {
            let leaderboardQuery =
              supabase
                .from(
                  'season_leaderboard_entries'
                )
                .select(
                  'minecraft_uuid, username'
                )
                .limit(1);

            if (resolvedUuid) {
              leaderboardQuery =
                leaderboardQuery.eq(
                  'minecraft_uuid',
                  resolvedUuid
                );
            } else if (
              resolvedUsername
            ) {
              leaderboardQuery =
                leaderboardQuery.ilike(
                  'username',
                  resolvedUsername
                );
            }

            const {
              data: leaderboardPlayer,
              error:
                leaderboardError,
            } =
              await leaderboardQuery.maybeSingle();

            if (leaderboardError) {
              console.error(
                'Leaderboard player identity lookup error:',
                leaderboardError
              );
            }

            if (
              leaderboardPlayer
            ) {
              resolvedUuid =
                String(
                  leaderboardPlayer.minecraft_uuid ||
                    resolvedUuid ||
                    ''
                )
                  .trim()
                  .toLowerCase() || null;

              resolvedUsername =
                String(
                  leaderboardPlayer.username ||
                    resolvedUsername ||
                    ''
                ).trim() || null;
            }
          }

          /*
           * IMPORTANT:
           * Before creating a Minecraft-only profile, always try to
           * resolve an existing website account by the Minecraft
           * username stored in `profiles`.
           *
           * This covers players who have a website account but:
           * - do not have a row in minecraft_links yet
           * - have an inactive/missing minecraft_links row
           * - linked their Minecraft username instead of the UUID
           * - have username casing differences
           */
          if (resolvedUsername) {
            const {
              data: existingWebsiteProfile,
              error:
                existingWebsiteProfileError,
            } =
              await supabase
                .from('profiles')
                .select(
                  'id, full_name, username, bio, created_at, minecraft_username, role, badge, cover_image'
                )
                .ilike(
                  'minecraft_username',
                  resolvedUsername
                )
                .limit(1)
                .maybeSingle();

            if (
              existingWebsiteProfileError
            ) {
              console.error(
                'Existing website profile lookup by Minecraft username failed:',
                existingWebsiteProfileError
              );
            }

            if (
              existingWebsiteProfile
            ) {
              setProfile(
                existingWebsiteProfile as ProfileData
              );

              setMinecraftUuid(
                resolvedUuid
              );

              setMinecraftUsername(
                existingWebsiteProfile.minecraft_username ||
                  resolvedUsername
              );

              setIsMinecraftOnly(
                false
              );

              setLoading(false);

              return;
            }
          }

          if (
            resolvedUuid ||
            resolvedUsername
          ) {
            const minecraftName =
              resolvedUsername ||
              `Player-${String(
                resolvedUuid ||
                  'unknown'
              ).slice(0, 8)}`;

            const minecraftId =
              resolvedUuid ||
              normalizeUsername(
                minecraftName
              );

            /*
             * Minecraft-only profile.
             * No row is inserted into `profiles`.
             * The existing ProfileHeader already supports this mode.
             */
            setProfile({
              id:
                `minecraft:${minecraftId}`,

              full_name:
                minecraftName,

              username:
                minecraftName,

              bio:
                null,

              created_at:
                null,

              minecraft_username:
                minecraftName,

              role:
                null,

              badge:
                null,

              cover_image:
                null,
            });

            setMinecraftUuid(
              resolvedUuid
            );

            setMinecraftUsername(
              resolvedUsername ||
                minecraftName
            );

            setIsMinecraftOnly(
              true
            );

            setLoading(false);
            return;
          }
        }

        /*
         * ------------------------------------------------------
         * Logged-in user's normal profile
         * ------------------------------------------------------
         */
        if (
          !targetUserId &&
          !targetUsername &&
          !targetMinecraftUsername &&
          !targetMinecraftUuid
        ) {
          if (
            userError ||
            !user
          ) {
            navigate('/login');
            return;
          }

          const {
            data,
            error: ownProfileError,
          } =
            await supabase
              .from('profiles')
              .select(
                'id, full_name, username, bio, created_at, minecraft_username, role, badge, cover_image'
              )
              .eq(
                'id',
                user.id
              )
              .maybeSingle();

          if (ownProfileError) {
            console.error(
              'Own profile lookup error:',
              ownProfileError
            );

            setProfile(null);
            setError(
              ownProfileError.message
            );
            setLoading(false);
            return;
          }

          if (data) {
            setProfile(
              data as ProfileData
            );
            setIsMinecraftOnly(false);
            setLoading(false);
            return;
          }
        }

        setProfile(null);

        setError(
          'This Minecraft player has not been synced yet.'
        );

        setLoading(false);
      },
      [navigate]
    );

  const loadMinecraftIdentity =
    useCallback(
      async () => {
        if (!profile) {
          return null;
        }

        const searchParams =
          new URLSearchParams(
            window.location.search
          );

        const urlUuid =
          searchParams
            .get('mcu')
            ?.trim()
            .toLowerCase() ||
          null;

        const urlUsername =
          searchParams
            .get('mc')
            ?.trim() ||
          null;

        /*
         * Minecraft-only profiles already have their identity in
         * the URL/profile object. Do not require a website account.
         */
        if (isMinecraftOnly) {
          const uuid =
            urlUuid ||
            (minecraftUuid ||
              null);

          const username =
            urlUsername ||
            minecraftUsername ||
            profile.minecraft_username ||
            null;

          setMinecraftUuid(
            uuid
          );

          setMinecraftUsername(
            username
          );

          return {
            uuid,
            username,
          };
        }

        const {
          data: link,
          error: linkError,
        } =
          await supabase
            .from(
              'minecraft_links'
            )
            .select(
              'minecraft_uuid'
            )
            .eq(
              'website_user_id',
              profile.id
            )
            .eq(
              'is_active',
              true
            )
            .limit(1)
            .maybeSingle();

        if (linkError) {
          console.error(
            'Minecraft link identity lookup error:',
            linkError
          );
        }

        let uuid =
          link?.minecraft_uuid
            ?.trim()
            .toLowerCase() ||
          null;

        let username =
          profile.minecraft_username
            ?.trim() ||
          null;

        if (
          !uuid &&
          username
        ) {
          const {
            data: fallback,
            error: fallbackError,
          } =
            await supabase
              .from(
                'player_minecraft_stats'
              )
              .select(
                'minecraft_uuid, minecraft_username'
              )
              .eq(
                'server_id',
                'main'
              )
              .ilike(
                'minecraft_username',
                username
              )
              .order(
                'updated_at',
                {
                  ascending: false,
                }
              )
              .limit(1)
              .maybeSingle();

          if (fallbackError) {
            console.error(
              'Minecraft stats identity fallback error:',
              fallbackError
            );
          }

          uuid =
            fallback?.minecraft_uuid
              ?.trim()
              .toLowerCase() ||
            null;

          username =
            fallback?.minecraft_username
              ?.trim() ||
            username;
        }

        setMinecraftUuid(
          uuid
        );

        setMinecraftUsername(
          username
        );

        return {
          uuid,
          username,
        };
      },
      [
        profile,
        isMinecraftOnly,
        minecraftUuid,
        minecraftUsername,
      ]
    );

  const loadSeasonData =
    useCallback(
      async () => {
        if (!profile) {
          return;
        }

        const identity =
          await loadMinecraftIdentity();

        if (
          !identity?.uuid
        ) {
          setSeasons(
            []
          );

          setSelectedSeasonId(
            null
          );

          return;
        }

        const [
          seasonResult,
          currentCategoryResult,
          statsResult,
          historyResult,
          participationResult,
        ] =
          await Promise.all([
            supabase
              .from('seasons')
              .select(
                'id, season_number, name, slug, status, cover_image_url, starts_at, ends_at'
              )
              .order(
                'season_number',
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                'leaderboard_categories'
              )
              .select(
                'category_id, display_name, stat_key, source_type, ranking_mode, display_format, prefix, suffix, decimal_places, icon_name, icon_url, image_url, sort_order, show_on_profile, is_active, is_archived'
              )
              .eq(
                'show_on_profile',
                true
              )
              .eq(
                'is_active',
                true
              )
              .eq(
                'is_archived',
                false
              )
              .order(
                'sort_order',
                {
                  ascending:
                    true,
                }
              ),

            supabase
              .from(
                'player_minecraft_stats'
              )
              .select(
                'minecraft_uuid, minecraft_username, server_id, hearts, kills, deaths, money, playtime_seconds, wins, kill_streak, blocks_broken, blocks_placed, items_crafted, items_used, mobs_killed, players_killed, distance_walked, distance_run, distance_flown, damage_dealt, damage_taken, jumps, updated_at'
              )
              .eq(
                'minecraft_uuid',
                identity.uuid
              )
              .eq(
                'server_id',
                'main'
              )
              .maybeSingle(),

            supabase.rpc(
              'get_player_season_history',
              {
                p_minecraft_uuid:
                  identity.uuid,

                p_server_id:
                  'main',
              }
            ),

            supabase
              .from('season_player_participation')
              .select(
                'season_id, minecraft_uuid, minecraft_username, server_id, rank_name, team_name, first_seen_at, last_seen_at, sync_count'
              )
              .eq('minecraft_uuid', identity.uuid)
              .eq('server_id', 'main')
              .limit(500),
          ]);

        if (
          seasonResult.error
        ) {
          setError(
            seasonResult.error.message
          );

          return;
        }

        const rawSeasons =
          (seasonResult.data ||
            []) as UnknownRecord[];

        const activeSeason =
          rawSeasons.find(
            (season) =>
              season.status ===
              'active'
          );

        const historicalSeasons =
          (
            historyResult.data ||
            []
          )
            .map(
              (
                row: UnknownRecord
              ) =>
                normalizeSnapshot(
                  row
                )
            )
            .sort(
              (
                a: UnknownRecord,
                b: UnknownRecord
              ) =>
                Number(
                  b.season_number
                ) -
                Number(
                  a.season_number
                )
            );

        const currentStats =
          statsResult.data as CurrentMinecraftStats | null;

        const participationRows =
          (participationResult.data || []) as UnknownRecord[];

        const playedSeasonIds = new Set<string>();

        for (const row of participationRows) {
          const seasonId = readString(
            row,
            ['season_id']
          );

          if (seasonId) {
            playedSeasonIds.add(seasonId);
          }
        }

        for (const season of historicalSeasons) {
          if (season.season_id) {
            playedSeasonIds.add(
              season.season_id
            );
          }
        }

        const activeParticipation =
          activeSeason
            ? participationRows.find(
                (row) =>
                  readString(
                    row,
                    ['season_id']
                  ) ===
                  String(activeSeason.id)
              )
            : undefined;

        const identityBase: UnknownRecord = {
          minecraft_uuid: identity.uuid,
          minecraft_username:
            identity.username ||
            profile.minecraft_username ||
            '',
          rank_name: readString(
            activeParticipation || {},
            ['rank_name', 'rank'],
            ''
          ),
          team_name: readString(
            activeParticipation || {},
            ['team_name', 'team'],
            ''
          ),
        };

        const next: SeasonSummary[] = [];

        /*
         * The active season is visible on EVERY Minecraft profile.
         * Playing status comes from seasonal participation/history,
         * never from lifetime Minecraft stats.
         */
        if (activeSeason) {
          const liveStats: CurrentMinecraftStats =
            currentStats ?? {
              minecraft_uuid: identity.uuid,
              minecraft_username:
                identity.username ||
                profile.minecraft_username ||
                '',
              server_id: 'main',
              hearts: 0,
              kills: 0,
              deaths: 0,
              money: 0,
              playtime_seconds: 0,
              wins: 0,
              kill_streak: 0,
              blocks_broken: 0,
              blocks_placed: 0,
              items_crafted: 0,
              items_used: 0,
              mobs_killed: 0,
              players_killed: 0,
              distance_walked: 0,
              distance_run: 0,
              distance_flown: 0,
              damage_dealt: 0,
              damage_taken: 0,
              jumps: 0,
              updated_at: null,
            };

          next.push(
            buildCurrentSeason(
              activeSeason,
              liveStats,
              {
                ...identityBase,
                ...activeParticipation,
              },
              playedSeasonIds.has(
                String(activeSeason.id)
              )
            )
          );
        }

        const seen = new Set<string>();

        for (const season of next) {
          if (season.season_id) {
            seen.add(
              season.season_id
            );
          }
        }

        /* Existing historical snapshots always mean the player played. */
        for (const season of historicalSeasons) {
          if (
            !season.season_id ||
            seen.has(season.season_id)
          ) {
            continue;
          }

          season.hasPlayedSeason = true;
          next.push(season);
          seen.add(season.season_id);
        }

        /*
         * Once a season is completed/archived, keep it visible even if
         * the player has no participation/snapshot. It becomes a
         * no-play season rather than showing misleading zero statistics.
         */
        for (const season of rawSeasons) {
          const seasonId = String(
            season.id || ''
          );

          const status = String(
            season.status || ''
          ).toLowerCase();

          if (
            !seasonId ||
            seen.has(seasonId) ||
            (status !== 'completed' &&
              status !== 'archived')
          ) {
            continue;
          }

          next.push(
            buildUnplayedSeason(
              season,
              identityBase
            )
          );

          seen.add(seasonId);
        }

        next.sort(
          (a, b) =>
            b.season_number -
            a.season_number
        );

        setSeasons(next);

        const currentConfigs =
          !currentCategoryResult.error
            ? (
                currentCategoryResult.data ||
                []
              ).map(
                (
                  row: UnknownRecord
                ) => ({
                  season_id:
                    String(
                      activeSeason?.id ||
                        ''
                    ),

                  category_id:
                    String(
                      row.category_id ||
                        ''
                    ),

                  display_name:
                    String(
                      row.display_name ||
                        row.category_id ||
                        'Stat'
                    ),

                  stat_key:
                    String(
                      row.stat_key ||
                        row.category_id ||
                        ''
                    ),

                  source_type:
                    String(
                      row.source_type ||
                        'player_stat'
                    ),

                  ranking_mode:
                    String(
                      row.ranking_mode ||
                        'current'
                    ),

                  display_format:
                    String(
                      row.display_format ||
                        'number'
                    ),

                  prefix:
                    String(
                      row.prefix ||
                        ''
                    ),

                  suffix:
                    String(
                      row.suffix ||
                        ''
                    ),

                  decimal_places:
                    Number(
                      row.decimal_places ||
                        0
                    ),

                  icon_name:
                    String(
                      row.icon_name ||
                        ''
                    ),

                  icon_url:
                    String(
                      row.icon_url ||
                        ''
                    ),

                  image_url:
                    String(
                      row.image_url ||
                        ''
                    ),

                  sort_order:
                    Number(
                      row.sort_order ||
                        0
                    ),
                }) as SeasonConfig
              )
            : [];

        setCurrentCategories(
          currentConfigs
        );

        const firstSeason =
          next[0] ||
          null;

        setSelectedSeasonId(
          (current) =>
            current &&
            next.some(
              (season) =>
                season.season_id ===
                current
            )
              ? current
              : firstSeason?.season_id ||
                null
        );

        if (
          currentConfigs.length >
          0
        ) {
          setSelectedStatKey(
            (current) =>
              currentConfigs.some(
                (
                  config: SeasonConfig
                ) =>
                  config.stat_key ===
                  current
              )
                ? current
                : currentConfigs[0]
                    .stat_key
          );
        }
      },
      [
        loadMinecraftIdentity,
        profile,
      ]
    );

  const loadHistoricalConfig =
    useCallback(
      async (
        seasonId: string
      ) => {
        if (!seasonId) {
          return;
        }

        const season = seasons.find(
          (item) => item.season_id === seasonId
        );

        if (season && !season.hasPlayedSeason) {
          return;
        }

        if (
          historicalConfigs[
            seasonId
          ]
        ) {
          return;
        }

        const {
          data,
          error:
            configError,
        } =
          await supabase.rpc(
            'get_season_profile_stats',
            {
              p_season_id:
                seasonId,
            }
          );

        if (configError) {
          return;
        }

        const configs =
          (data || []).map(
            (
              row: UnknownRecord
            ) => {
              const record =
                toRecord(row);

              return {
                season_id:
                  String(
                    record.season_id ||
                      seasonId
                  ),

                category_id:
                  String(
                    record.category_id ||
                      ''
                  ),

                display_name:
                  String(
                    record.display_name ||
                      record.category_id ||
                      'Stat'
                  ),

                stat_key:
                  String(
                    record.stat_key ||
                      record.category_id ||
                      ''
                  ),

                source_type:
                  String(
                    record.source_type ||
                      'player_stat'
                  ),

                ranking_mode:
                  String(
                    record.ranking_mode ||
                      'delta'
                  ),

                display_format:
                  String(
                    record.display_format ||
                      'number'
                  ),

                prefix:
                  String(
                    record.prefix ||
                      ''
                  ),

                suffix:
                  String(
                    record.suffix ||
                      ''
                  ),

                decimal_places:
                  Number(
                    record.decimal_places ||
                      0
                  ),

                icon_name:
                  String(
                    record.icon_name ||
                      ''
                  ),

                icon_url:
                  String(
                    record.icon_url ||
                      ''
                  ),

                image_url:
                  String(
                    record.image_url ||
                      ''
                  ),

                sort_order:
                  Number(
                    record.sort_order ||
                      0
                  ),
              } as SeasonConfig;
            }
          );

        setHistoricalConfigs(
          (current) => ({
            ...current,
            [seasonId]:
              configs,
          })
        );

        if (
          configs.length >
          0
        ) {
          setSelectedStatKey(
            (current) =>
              configs.some(
                (
                  config: SeasonConfig
                ) =>
                  config.stat_key ===
                  current
              )
                ? current
                : configs[0]
                    .stat_key
          );
        }
      },
      [historicalConfigs, seasons]
    );

  const loadLeaderboardPreview =
    useCallback(
      async () => {
        if (
          !selectedSeason ||
          !selectedSeason.hasPlayedSeason ||
          !selectedStatKey
        ) {
          setLeaderboardRows(
            []
          );

          setLeaderboardRank(
            {
              rank: null,
              score: null,
              totalPlayers: 0,
            }
          );

          return;
        }

        const config =
          selectedConfigs.find(
            (item) =>
              item.stat_key ===
              selectedStatKey
          );

        if (!config) {
          return;
        }

        setLeaderboardLoading(
          true
        );

        const [
          entriesResult,
          rankResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'season_leaderboard_entries'
              )
              .select(
                'minecraft_uuid, username, score, display_score, badge, guild, avatar_url'
              )
              .eq(
                'season_id',
                selectedSeason.season_id
              )
              .eq(
                'category',
                config.category_id
              )
              .order(
                'score',
                {
                  ascending:
                    config.ranking_mode ===
                    'asc',
                }
              )
              .limit(5),

            minecraftUuid
              ? supabase.rpc(
                  'get_player_leaderboard_rank',
                  {
                    p_season_id:
                      selectedSeason.season_id,

                    p_category:
                      config.category_id,

                    p_minecraft_uuid:
                      minecraftUuid,
                  }
                )
              : Promise.resolve({
                  data: null,
                  error: null,
                }),
          ]);

        setLeaderboardRows(
          (entriesResult.data ||
            []) as LeaderboardPreviewRow[]
        );

        const rankRow =
          Array.isArray(
            rankResult.data
          )
            ? rankResult.data[0]
            : null;

        setLeaderboardRank(
          {
            rank: rankRow
              ? Number(
                  rankRow.rank
                )
              : null,

            score: rankRow
              ? Number(
                  rankRow.score
                )
              : null,

            totalPlayers:
              rankRow
                ? Number(
                    rankRow.total_players
                  )
                : 0,
          }
        );

        setLeaderboardLoading(
          false
        );
      },
      [
        minecraftUuid,
        selectedConfigs,
        selectedSeason,
        selectedStatKey,
      ]
    );

  const loadSeasonExtras =
    useCallback(
      async () => {
        if (
          !selectedSeason ||
          !selectedSeason.hasPlayedSeason ||
          !minecraftUuid ||
          !profile
        ) {
          setAchievements(
            []
          );

          setAwards(
            []
          );

          setAdvancements(
            []
          );

          setShowAllAdvancements(false);

          setTeamInfo(
            null
          );

          return;
        }

        setExtrasLoading(
          true
        );

        const [
          playerAchievementRows,
          achievementRows,
          teamMemberRows,
          teamRows,
          teamResultRows,
          awardRows,
          recordHighlightsResult,
          advancementStatesResult,
        ] =
          await Promise.all([
            loadTable(
              'player_achievements'
            ),

            loadTable(
              'achievements'
            ),

            loadTable(
              'team_members'
            ),

            loadTable(
              'teams'
            ),

            loadTable(
              'season_team_results'
            ),

            loadTable(
              'season_awards'
            ),

            supabase.rpc(
              'get_season_achievement_highlights',
              {
                p_season_id: selectedSeason.season_id,
                p_minecraft_uuid: minecraftUuid,
                p_server_id: 'main',
              }
            ),

            supabase.rpc(
              'get_player_season_advancement_states',
              {
                p_season_id: selectedSeason.season_id,
                p_minecraft_uuid: minecraftUuid,
              }
            ),

          ]);

        const matchingAchievementLinks =
          playerAchievementRows.filter(
            (row: UnknownRecord) =>
              isRowForPlayer(
                row,
                minecraftUuid,
                minecraftUsername ||
                  profile.minecraft_username ||
                  '',
                profile.id
              ) &&
              rowMatchesSeason(
                row,
                selectedSeason,
                true
              )
          );

        const achievementMap =
          new Map<
            string,
            UnknownRecord
          >();

        for (
          const row of achievementRows
        ) {
          for (
            const key of [
              'id',
              'achievement_id',
              'slug',
              'key',
            ]
          ) {
            const value =
              readString(
                row,
                [key]
              );

            if (value) {
              achievementMap.set(
                value,
                row
              );
            }
          }
        }

        const normalizedAchievements =
          matchingAchievementLinks
            .map(
              (
                link: UnknownRecord,
                index: number
              ) => {
                const achievementId =
                  readString(
                    link,
                    [
                      'achievement_id',
                      'id',
                      'achievement',
                      'key',
                    ]
                  );

                const detail =
                  achievementMap.get(
                    achievementId
                  ) || {};

                const title =
                  readString(
                    detail,
                    [
                      'title',
                      'name',
                      'display_name',
                    ],
                    readString(
                      link,
                      [
                        'title',
                        'name',
                      ],
                      `Achievement ${
                        index + 1
                      }`
                    )
                  );

                const description =
                  readString(
                    detail,
                    [
                      'description',
                      'desc',
                    ],
                    readString(
                      link,
                      [
                        'description',
                      ],
                      'Season achievement unlocked.'
                    )
                  );

                const iconUrl =
                  readString(
                    detail,
                    [
                      'icon_url',
                      'image_url',
                      'icon',
                    ]
                  );

                const rarity =
                  readString(
                    detail,
                    [
                      'rarity',
                      'tier',
                    ],
                    readString(
                      link,
                      ['rarity'],
                      'Common'
                    )
                  );

                const rewardValue =
                  readString(
                    detail,
                    [
                      'reward',
                      'reward_text',
                      'points',
                    ],
                    readString(
                      link,
                      [
                        'reward',
                        'points',
                      ],
                      ''
                    )
                  );

                const custom =
                  readBoolean(
                    detail,
                    [
                      'is_custom',
                      'custom',
                    ]
                  ) ||
                  readBoolean(
                    link,
                    [
                      'is_custom',
                      'custom',
                    ]
                  ) ||
                  /custom/i.test(
                    readString(
                      detail,
                      [
                        'source_type',
                        'type',
                      ]
                    )
                  );

                const earnedAt =
                  readString(
                    link,
                    [
                      'unlocked_at',
                      'earned_at',
                      'completed_at',
                      'awarded_at',
                      'created_at',
                    ]
                  ) || null;

                return {
                  id:
                    achievementId ||
                    `${selectedSeason.season_id}-${index}`,

                  title,

                  description,

                  iconUrl,

                  rarity,

                  reward:
                    rewardValue,

                  isCustom:
                    custom,

                  earnedAt,
                } as SeasonAchievement;
              }
            )
            .filter(
              (
                item: SeasonAchievement,
                index: number,
                array: SeasonAchievement[]
              ) =>
                array.findIndex(
                  (
                    candidate: SeasonAchievement
                  ) =>
                    candidate.id ===
                    item.id
                ) ===
                index
            );

        const seasonHighlightRows =
          !recordHighlightsResult.error
            ? (recordHighlightsResult.data || []) as UnknownRecord[]
            : [];

        const seasonRecordAchievements: SeasonAchievement[] =
          seasonHighlightRows.map(
            (row: UnknownRecord, index: number) => ({
              id: `season-record-${selectedSeason.season_id}-${readString(row, ['achievement_key'], String(index))}`,
              title: `Highest ${seasonRecordLabel(readString(row, ['stat_key']))} in S${selectedSeason.season_number}`,
              description: `Highest ${seasonRecordLabel(readString(row, ['stat_key']))} in Season ${selectedSeason.season_number}.`,
              iconUrl: '',
              rarity: 'Season Record',
              reward: '',
              isCustom: false,
              earnedAt: selectedSeason.ends_at || selectedSeason.captured_at,
              kind: 'season-record',
              statKey: readString(row, ['stat_key']),
              recordValue: readNumber(row, ['value']),
            })
          );

        const advancementRows =
          !advancementStatesResult.error
            ? (advancementStatesResult.data || []) as UnknownRecord[]
            : [];

        const normalizedAdvancements: SeasonAdvancement[] =
          advancementRows
            .map((row: UnknownRecord, index: number) => ({
              id: readString(
                row,
                ['id'],
                `${selectedSeason.season_id}-adv-${index}`
              ),
              advancementKey: readString(
                row,
                ['advancement_key', 'key'],
                `advancement-${index}`
              ),
              title: readString(
                row,
                ['title'],
                readString(row, ['advancement_key'], 'Advancement')
              ),
              description: readString(row, ['description']),
              iconMaterial: readString(
                row,
                ['icon_material', 'iconMaterial']
              ),
              completed: readBoolean(
                row,
                ['completed']
              ),
              completedAt: readString(
                row,
                ['completed_at']
              ) || null,
            }))
            .filter(
              (item: SeasonAdvancement, index: number, array: SeasonAdvancement[]) =>
                array.findIndex(
                  (candidate) => candidate.advancementKey === item.advancementKey
                ) === index
            )
            .sort((a, b) => {
              if (a.completed !== b.completed) {
                return a.completed ? -1 : 1;
              }
              return a.title.localeCompare(b.title);
            });

        const normalizedAchievementsWithRecords = [
          ...seasonRecordAchievements,
          ...normalizedAchievements.map((achievement) => ({
            ...achievement,
            kind: achievement.isCustom ? 'custom' : 'standard',
            statKey: '',
            recordValue: null,
          })),
        ] as SeasonAchievement[];

        const normalizedAwards =
          awardRows
            .filter(
              (row: UnknownRecord) =>
                rowMatchesSeason(
                  row,
                  selectedSeason,
                  true
                )
            )
            .filter(
              (row: UnknownRecord) => {
                const playerMatch =
                  isRowForPlayer(
                    row,
                    minecraftUuid,
                    minecraftUsername ||
                      profile.minecraft_username ||
                      '',
                    profile.id
                  );

                return (
                  playerMatch ||
                  readString(
                    row,
                    [
                      'minecraft_uuid',
                      'uuid',
                      'website_user_id',
                      'profile_id',
                      'user_id',
                    ]
                  ) === ''
                );
              }
            )
            .map(
              (
                row: UnknownRecord,
                index: number
              ) =>
                ({
                  id:
                    readString(
                      row,
                      [
                        'id',
                        'award_id',
                      ],
                      `${selectedSeason.season_id}-award-${index}`
                    ),

                  title:
                    readString(
                      row,
                      [
                        'title',
                        'name',
                        'award_name',
                        'type',
                      ],
                      'Season Honor'
                    ),

                  description:
                    readString(
                      row,
                      [
                        'description',
                        'reason',
                        'details',
                      ],
                      ''
                    ),

                  iconUrl:
                    readString(
                      row,
                      [
                        'icon_url',
                        'image_url',
                        'icon',
                      ]
                    ),

                  type:
                    readString(
                      row,
                      [
                        'award_type',
                        'type',
                      ],
                      'Honor'
                    ),
                } as SeasonAward)
            )
            .filter(
              (
                item: SeasonAward,
                index: number,
                array: SeasonAward[]
              ) =>
                array.findIndex(
                  (
                    candidate: SeasonAward
                  ) =>
                    candidate.id ===
                    item.id
                ) ===
                index
            );

        const member =
          teamMemberRows
            .filter(
              (row: UnknownRecord) =>
                isRowForPlayer(
                  row,
                  minecraftUuid,
                  minecraftUsername ||
                    profile.minecraft_username ||
                    '',
                  profile.id
                )
            )
            .filter(
              (row: UnknownRecord) =>
                rowMatchesSeason(
                  row,
                  selectedSeason,
                  true
                )
            )
            .sort(
              (
                a: UnknownRecord,
                b: UnknownRecord
              ) => {
                const aSeason =
                  readString(
                    a,
                    ['season_id']
                  );

                const bSeason =
                  readString(
                    b,
                    ['season_id']
                  );

                if (
                  aSeason ===
                    selectedSeason.season_id &&
                  bSeason !==
                    selectedSeason.season_id
                ) {
                  return -1;
                }

                if (
                  bSeason ===
                    selectedSeason.season_id &&
                  aSeason !==
                    selectedSeason.season_id
                ) {
                  return 1;
                }

                return 0;
              }
            )[0];

        const teamId =
          member
            ? readString(
                member,
                [
                  'team_id',
                  'clan_id',
                  'guild_id',
                ]
              )
            : '';

        const team =
          teamRows.find(
            (row: UnknownRecord) =>
              readString(
                row,
                [
                  'id',
                  'team_id',
                  'clan_id',
                ]
              ) ===
              teamId
          ) || {};

        const teamResult =
          teamResultRows
            .filter(
              (row: UnknownRecord) =>
                rowMatchesSeason(
                  row,
                  selectedSeason,
                  false
                )
            )
            .find(
              (row: UnknownRecord) => {
                const rowTeamId =
                  readString(
                    row,
                    [
                      'team_id',
                      'clan_id',
                      'guild_id',
                    ]
                  );

                return teamId
                  ? rowTeamId ===
                      teamId
                  : false;
              }
            ) ||
          teamResultRows.find(
            (row: UnknownRecord) =>
              rowMatchesSeason(
                row,
                selectedSeason,
                false
              )
          ) ||
          {};

        const relevantAwards =
          normalizedAwards.map(
            (award) =>
              award.title
          );

        const honors = [
          readString(
            teamResult,
            [
              'best_team_award',
              'best_team',
              'dominator',
              'dominant_team',
              'richest_team',
            ]
          ),

          readString(
            teamResult,
            [
              'honor',
              'award',
              'achievement',
            ]
          ),

          ...relevantAwards,
        ].filter(Boolean);

        const dragonEggRaw =
          readString(
            teamResult,
            [
              'dragon_egg',
              'dragon_egg_count',
              'dragon_eggs',
              'dragon_egg_owned',
              'dragon_egg_won',
              'has_dragon_egg',
              'egg_count',
            ]
          ) ||
          readString(
            team,
            [
              'dragon_egg',
              'dragon_egg_count',
              'dragon_eggs',
              'has_dragon_egg',
            ]
          );

        const teamName =
          readString(
            team,
            [
              'name',
              'team_name',
              'display_name',
            ],
            readString(
              member || {},
              ['team_name'],
              ''
            )
          );

        const teamTag =
          readString(
            team,
            [
              'tag',
              'short_name',
              'team_tag',
            ],
            readString(
              member || {},
              ['team_tag'],
              ''
            )
          );

        const teamIcon =
          readString(
            team,
            [
              'icon_url',
              'image_url',
              'logo_url',
              'logo',
            ]
          );

        const teamRole =
          readString(
            member || {},
            [
              'role',
              'position',
              'team_role',
            ],
            'Member'
          );

        const resolvedTeamName =
          selectedSeason.team_name || teamName;

        setAchievements(
          normalizedAchievementsWithRecords
        );

        setAdvancements(
          normalizedAdvancements
        );

        setAwards(
          normalizedAwards
        );

        setTeamInfo(
          resolvedTeamName || teamId
            ? {
                name:
                  resolvedTeamName ||
                  'Team',

                tag:
                  teamTag,

                iconUrl:
                  teamIcon,

                role:
                  teamRole,

                dragonEgg:
                  dragonEggRaw ||
                  'Not recorded',

                honors:
                  [
                    ...new Set(
                      honors
                    ),
                  ].slice(
                    0,
                    6
                  ),
              }
            : null
        );

        setExtrasLoading(
          false
        );
      },
      [
        minecraftUuid,
        minecraftUsername,
        profile,
        selectedSeason,
      ]
    );

  useEffect(() => {
    void loadProfile();
  }, [
    loadProfile,
    window.location.pathname,
    window.location.search,
  ]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    void loadSeasonData();
  }, [
    loadSeasonData,
    profile,
  ]);

  useEffect(() => {
    if (
      !selectedSeason ||
      selectedSeason.isCurrent ||
      !selectedSeason.hasPlayedSeason
    ) {
      return;
    }

    void loadHistoricalConfig(
      selectedSeason.season_id
    );
  }, [
    loadHistoricalConfig,
    selectedSeason,
  ]);

  useEffect(() => {
    void loadLeaderboardPreview();
  }, [
    loadLeaderboardPreview,
  ]);

  useEffect(() => {
    void loadSeasonExtras();
  }, [
    loadSeasonExtras,
  ]);

  useEffect(() => {
    if (
      profile &&
      activeTab === 'posts'
    ) {
      void loadPosts();
    }
  }, [
    activeTab,
    loadPosts,
    profile,
  ]);

  const handleEditClick =
    () =>
      navigate(
        '/profile/edit'
      );

  const goLeaderboard =
    () =>
      navigate(
        '/leaderboard'
      );

  const selectedCategoryForDisplay =
    selectedConfigs.find(
      (config) =>
        config.stat_key ===
        selectedStatKey
    );

  const seasonStats =
    useMemo(
      () =>
        selectedConfigs.map(
          (config) => ({
            ...config,

            value:
              selectedSeason
                ? statValueFromSeason(
                    selectedSeason,
                    config.stat_key
                  )
                : 0,
          })
        ),
      [
        selectedConfigs,
        selectedSeason,
      ]
    );

  const seasonTitle =
    selectedSeason
      ? `S${selectedSeason.season_number} · ${selectedSeason.season_name}`
      : 'Season Profile';

  const playerAvatar =
    minecraftUsername
      ? `https://mc-heads.net/avatar/${encodeURIComponent(
          minecraftUsername
        )}/128`
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center px-4 pt-24">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-10 py-12 text-center backdrop-blur-xl">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-400" />

            <p className="mt-4 font-semibold text-white">
              Loading player profile…
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Syncing season history and profile data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 pb-20 pt-28 text-white">
        <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-3xl">
            ?
          </div>

          <h1 className="mt-5 font-heading text-2xl font-extrabold">
            Profile Not Found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              'This profile does not exist or is no longer available.'}
          </p>

          <button
            onClick={() =>
              navigate(
                '/social'
              )
            }
            className="mt-6 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Back to Social
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile =
    !isMinecraftOnly &&
    currentUserId ===
    profile.id;

  return (
    <div className="min-h-screen bg-[#050505] pb-20 text-white">
      <div className="pointer-events-none fixed inset-x-0 top-20 z-0 h-96 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(56,189,248,0.08),transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError(
                  ''
                )
              }
              className="text-amber-300 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl shadow-purple-950/10 backdrop-blur-xl">
          <ProfileHeader
            userId={profile.id}
            username={
              profile.username ||
              'user'
            }
            fullName={
              profile.full_name ||
              undefined
            }
            bio={
              profile.bio ||
              undefined
            }
            role={
              profile.role
            }
            badge={
              profile.badge
            }
            minecraftUsername={
              profile.minecraft_username
            }
            createdAt={
              profile.created_at ||
              undefined
            }
            coverImage={
              profile.cover_image ||
              null
            }
            isOwnProfile={
              isOwnProfile
            }
            isMinecraftOnly={
              isMinecraftOnly
            }
            currentUserId={
              currentUserId ||
              undefined
            }
            onEditClick={
              handleEditClick
            }
          />

          <div className="border-t border-white/[0.07] bg-black/20 px-3 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <GlassButton
                active={
                  activeTab ===
                  'season'
                }
                onClick={() =>
                  setActiveTab(
                    'season'
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Season Profile
                </span>
              </GlassButton>

              <GlassButton
                active={
                  activeTab ===
                  'activity'
                }
                onClick={() =>
                  setActiveTab(
                    'activity'
                  )
                }
              >
                Activity
              </GlassButton>

              <GlassButton
                active={
                  activeTab ===
                  'posts'
                }
                onClick={() =>
                  setActiveTab(
                    'posts'
                  )
                }
              >
                Posts
              </GlassButton>

              <div className="ml-auto hidden items-center gap-2 sm:flex">
                <GlassButton
                  onClick={() =>
                    void loadSeasonData()
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </span>
                </GlassButton>

                <GlassButton
                  onClick={
                    goLeaderboard
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    Leaderboards
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </GlassButton>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'season' ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-xl">
                <SectionHeader
                  icon={Medal}
                  eyebrow="Season Journey"
                  title="Your seasons"
                  description="Every season you played, preserved separately from future changes."
                  action={
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        {
                          seasons.filter(
                            (season) =>
                              season.hasPlayedSeason
                          ).length
                        }{' '}
                        played
                      </span>
                    </div>
                  }
                />

                {seasons.length ===
                0 ? (
                  <div className="px-6 py-14 text-center">
                    <CalendarDays className="mx-auto h-10 w-10 text-slate-700" />

                    <h3 className="mt-4 font-bold text-white">
                      No season history yet
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Once your Minecraft account is synced, your season journey appears here.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                      {previewSeasons.map(
                        (
                          season
                        ) => {
                          const selected =
                            season.season_id ===
                            selectedSeasonId;

                          return (
                            <button
                              key={
                                season.season_id
                              }
                              onClick={() => {
                                setSelectedSeasonId(
                                  season.season_id
                                );

                                setSelectedStatKey(
                                  (
                                    season.season_id ===
                                    selectedSeasonId
                                      ? selectedStatKey
                                      : season.isCurrent
                                      ? currentCategories[0]
                                          ?.stat_key
                                      : historicalConfigs[
                                          season.season_id
                                        ]?.[0]
                                          ?.stat_key
                                  ) ||
                                    'kills'
                                );
                              }}
                              className={`group relative overflow-hidden rounded-2xl border text-left transition ${
                                selected
                                  ? 'border-purple-400/50 shadow-[0_0_35px_rgba(168,85,247,0.18)]'
                                  : 'border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="relative aspect-[0.82] overflow-hidden">
                                {season.season_cover_image_url ? (
                                  <img
                                    src={
                                      season.season_cover_image_url
                                    }
                                    alt={
                                      season.season_name
                                    }
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.45),transparent_35%),linear-gradient(145deg,#0e1020,#020203)]" />
                                )}

                                <div className="absolute left-3 top-3 z-30 flex items-center gap-2">
                                  <span
                                    className={`rounded-lg border px-2 py-1 text-[10px] font-black tracking-widest ${
                                      selected
                                        ? 'border-purple-300/30 bg-purple-500/20 text-purple-100'
                                        : 'border-white/15 bg-black/40 text-white'
                                    }`}
                                  >
                                    S
                                    {
                                      season.season_number
                                    }
                                  </span>

                                  {season.isCurrent && (
                                    <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                                      Live
                                    </span>
                                  )}
                                </div>

                                <div className="absolute inset-x-2 bottom-2 z-30 flex justify-start">
                                  <div className="max-w-[calc(100%-0.5rem)] rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-[3px]">
                                    <p className="text-xs font-extrabold leading-tight text-white">
                                      {season.season_name}
                                    </p>

                                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-300">
                                      {formatDateRange(
                                        season.starts_at,
                                        season.ends_at
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {!season.hasPlayedSeason &&
                                  season.isCurrent && (
                                    <div className="absolute inset-x-3 bottom-20 z-20 flex justify-center">
                                      <span className="rounded-full border border-amber-300/20 bg-black/60 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-200 backdrop-blur-md">
                                        Not played yet
                                      </span>
                                    </div>
                                  )}

                                {!season.hasPlayedSeason &&
                                  (season.season_status === 'completed' ||
                                    season.season_status === 'archived') && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                                      <div className="px-4 text-center">
                                        <LockKeyhole className="mx-auto h-7 w-7 text-slate-300" />
                                        <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                                          Didn&apos;t Play
                                        </p>
                                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                          No season data
                                        </p>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>

                    {seasons.length >
                      5 && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() =>
                            setShowAllSeasons(
                              (
                                value
                              ) =>
                                !value
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-purple-400/25 hover:bg-purple-500/10 hover:text-white"
                        >
                          {showAllSeasons
                            ? 'Show latest 5'
                            : `More Seasons (${
                                seasons.length -
                                5
                              })`}

                          <ChevronDown
                            className={`h-4 w-4 transition ${
                              showAllSeasons
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-purple-400/25 bg-purple-500/10">
                      {playerAvatar ? (
                        <img
                          src={
                            playerAvatar
                          }
                          alt={
                            minecraftUsername ||
                            'Minecraft player'
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Users className="h-5 w-5 text-purple-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-white">
                        {minecraftUsername ||
                          profile.minecraft_username ||
                          'Minecraft account'}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Server synced
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">
                        Seasons
                      </p>

                      <p className="mt-1 text-xl font-black text-white">
                        {
                          seasons.length
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">
                        Latest
                      </p>

                      <p className="mt-1 text-xl font-black text-white">
                        {seasons[0]
                          ? `S${seasons[0].season_number}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-purple-400/10 bg-gradient-to-br from-purple-500/10 via-white/[0.02] to-cyan-500/5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/10 text-amber-300">
                      <LockKeyhole className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-white">
                        Historical data is frozen
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        Completed seasons keep their own stat layout, so later admin changes do not rewrite your old season pages.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            {selectedSeason && (
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-xl">
                <div className="relative overflow-hidden border-b border-white/[0.07]">
                  {selectedSeason.season_cover_image_url && (
                    <img
                      src={
                        selectedSeason.season_cover_image_url
                      }
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-20 blur-sm"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-[#07070a] via-[#07070a]/90 to-[#07070a]/70" />

                  <div className="relative flex flex-col gap-5 px-5 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-7">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg border border-purple-400/25 bg-purple-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-purple-200">
                          Season{' '}
                          {
                            selectedSeason.season_number
                          }
                        </span>

                        <span
                          className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                            selectedSeason.isCurrent
                              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                              : 'border-sky-400/20 bg-sky-400/10 text-sky-300'
                          }`}
                        >
                          {selectedSeason.isCurrent
                            ? 'Current season'
                            : 'Frozen history'}
                        </span>
                      </div>

                      <h2 className="mt-3 font-heading text-2xl font-black text-white sm:text-3xl">
                        {
                          seasonTitle
                        }
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateRange(
                          selectedSeason.starts_at,
                          selectedSeason.ends_at
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        [
                          'Kills',
                          selectedSeason.kills,
                        ],
                        [
                          'Deaths',
                          selectedSeason.deaths,
                        ],
                        [
                          'Wins',
                          selectedSeason.wins,
                        ],
                        [
                          'Playtime',
                          formatHours(
                            selectedSeason.playtime_seconds
                          ),
                        ],
                      ].map(
                        ([
                          label,
                          value,
                        ]) => (
                          <div
                            key={String(
                              label
                            )}
                            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 backdrop-blur-md"
                          >
                            <p className="text-[9px] uppercase tracking-wider text-slate-500">
                              {
                                label
                              }
                            </p>

                            <p className="mt-1 text-sm font-black text-white">
                              {typeof value ===
                              'number'
                                ? formatInteger(
                                    value
                                  )
                                : value}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {!selectedSeason.hasPlayedSeason ? (
                  <div className="relative min-h-[360px] overflow-hidden">
                    {selectedSeason.season_cover_image_url && (
                      <img
                        src={selectedSeason.season_cover_image_url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[2px]"
                      />
                    )}

                    <div
                      className={`absolute inset-0 ${
                        selectedSeason.season_status === 'completed' ||
                        selectedSeason.season_status === 'archived'
                          ? 'bg-black/75'
                          : 'bg-black/45'
                      }`}
                    />

                    <div className="relative z-20 flex min-h-[360px] items-center justify-center px-6 py-16">
                      <div className="max-w-md text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/50 shadow-2xl">
                          <LockKeyhole className="h-7 w-7 text-slate-300" />
                        </div>

                        <h3 className="mt-5 text-xl font-black uppercase tracking-wide text-white">
                          {selectedSeason.season_status === 'completed' ||
                          selectedSeason.season_status === 'archived'
                            ? "Didn't Play"
                            : 'Not Played Yet'}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {selectedSeason.season_status === 'completed' ||
                          selectedSeason.season_status === 'archived'
                            ? 'No Minecraft activity was recorded for this season. There is no season data to display.'
                            : 'This player has not played this season yet. Season statistics will appear after they participate.'}
                        </p>

                        <div className="mx-auto mt-5 inline-flex items-center rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          No season data
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-7">
                  <div className="space-y-6">
                    <div>
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-400/80">
                            Profile stats
                          </p>

                          <h3 className="mt-1 text-lg font-extrabold text-white">
                            Season performance
                          </h3>
                        </div>

                        {selectedConfigs.length >
                          0 && (
                          <select
                            value={
                              selectedStatKey
                            }
                            onChange={(
                              event
                            ) =>
                              setSelectedStatKey(
                                event
                                  .target
                                  .value
                              )
                            }
                            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white outline-none transition focus:border-purple-400/30"
                          >
                            {selectedConfigs.map(
                              (
                                config
                              ) => (
                                <option
                                  key={
                                    config.category_id
                                  }
                                  value={
                                    config.stat_key
                                  }
                                >
                                  {
                                    config.display_name
                                  }
                                </option>
                              )
                            )}
                          </select>
                        )}
                      </div>

                      {seasonStats.length ===
                      0 ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-xs text-slate-500">
                          No profile statistics are enabled for this season yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                          {seasonStats.map(
                            (stat) => {
                              const Icon =
                                STAT_ICONS[
                                  stat.stat_key
                                ] ||
                                BarChart3;

                              return (
                                <button
                                  key={
                                    stat.category_id
                                  }
                                  onClick={() =>
                                    setSelectedStatKey(
                                      stat.stat_key
                                    )
                                  }
                                  className={`rounded-2xl border p-4 text-left transition ${
                                    selectedStatKey ===
                                    stat.stat_key
                                      ? 'border-purple-400/35 bg-purple-500/10 shadow-[0_0_24px_rgba(168,85,247,0.07)]'
                                      : 'border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-purple-300">
                                      {stat.icon_url ? (
                                        <img
                                          src={
                                            stat.icon_url
                                          }
                                          alt=""
                                          className="h-5 w-5 object-contain"
                                        />
                                      ) : (
                                        <Icon className="h-4 w-4" />
                                      )}
                                    </span>

                                    {selectedStatKey ===
                                      stat.stat_key && (
                                      <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                                    )}
                                  </div>

                                  <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                    {
                                      stat.display_name
                                    }
                                  </p>

                                  <p className="mt-1 text-xl font-black text-white">
                                    {formatValue(
                                      stat.value,
                                      stat
                                    )}
                                  </p>
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
                        <SectionHeader
                          icon={Award}
                          eyebrow="Seasonal"
                          title="Achievements"
                          description="Unlocked achievements associated with this season."
                          action={
                            <span className="rounded-full border border-amber-400/15 bg-amber-400/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                              {
                                achievements.length
                              }{' '}
                              unlocked
                            </span>
                          }
                        />

                        <div className="p-4">
                          {!extrasLoading && (selectedSeason.rank_name || selectedSeason.team_name) && (
                            <div className="mb-3 grid grid-cols-2 gap-3">
                              <div className="rounded-2xl border border-amber-400/15 bg-amber-500/5 p-3">
                                <p className="text-[9px] uppercase tracking-wider text-slate-500">Server Rank</p>
                                <p className="mt-1 truncate text-sm font-black text-amber-200">
                                  {selectedSeason.rank_name || 'Not recorded'}
                                </p>
                                <p className="mt-1 text-[8px] font-semibold uppercase tracking-wider text-slate-600">LuckPerms</p>
                              </div>

                              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-3">
                                <p className="text-[9px] uppercase tracking-wider text-slate-500">Server Team</p>
                                <p className="mt-1 truncate text-sm font-black text-cyan-200">
                                  {selectedSeason.team_name || 'Not recorded'}
                                </p>
                                <p className="mt-1 text-[8px] font-semibold uppercase tracking-wider text-slate-600">Season sync</p>
                              </div>
                            </div>
                          )}

                          {extrasLoading ? (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
                            </div>
                          ) : achievements.length ===
                            0 ? (
                            <div className="py-10 text-center">
                              <Medal className="mx-auto h-8 w-8 text-slate-700" />

                              <p className="mt-3 text-xs font-semibold text-slate-500">
                                No recorded achievements for this season.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {achievements
                                .slice(
                                  0,
                                  6
                                )
                                .map(
                                  (
                                    achievement,
                                    index
                                  ) => {
                                    const AchievementIcon =
                                      FALLBACK_ACHIEVEMENT_ICONS[
                                        index %
                                          FALLBACK_ACHIEVEMENT_ICONS.length
                                      ];

                                    return (
                                      <div
                                        key={
                                          achievement.id
                                        }
                                        className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-center"
                                      >
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 text-purple-300">
                                          {achievement.iconUrl ? (
                                            <img
                                              src={
                                                achievement.iconUrl
                                              }
                                              alt=""
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <AchievementIcon className="h-5 w-5" />
                                          )}
                                        </div>

                                        <p className="mt-3 line-clamp-2 text-[11px] font-extrabold text-white">
                                          {
                                            achievement.title
                                          }
                                        </p>

                                        <div className="mt-2 flex flex-wrap justify-center gap-1">
                                          <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                                            achievement.kind === 'season-record'
                                              ? 'border-amber-400/20 bg-amber-500/10 text-amber-300'
                                              : 'border-white/10 bg-black/20 text-slate-400'
                                          }`}>
                                            {achievement.rarity}
                                          </span>

                                          {achievement.isCustom && (
                                            <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-fuchsia-300">
                                              Custom
                                            </span>
                                          )}
                                        </div>

                                        {achievement.kind === 'season-record' && achievement.recordValue !== null && (
                                          <p className="mt-2 text-[9px] font-black text-amber-300">
                                            {formatSeasonRecordValue(
                                              achievement.statKey,
                                              achievement.recordValue
                                            )}
                                          </p>
                                        )}

                                        {achievement.reward && (
                                          <p className="mt-2 text-[9px] font-bold text-emerald-300">
                                            {achievement.reward}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
                        <SectionHeader
                          icon={Users}
                          eyebrow="Team & Custom"
                          title="Season identity"
                          description="Team, role, Dragon Egg and seasonal honors."
                        />

                        <div className="p-4">
                          {extrasLoading ? (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
                            </div>
                          ) : !teamInfo &&
                            awards.length ===
                              0 ? (
                            <div className="py-10 text-center">
                              <Users className="mx-auto h-8 w-8 text-slate-700" />

                              <p className="mt-3 text-xs font-semibold text-slate-500">
                                No team or seasonal custom data recorded.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {teamInfo && (
                                <>
                                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-red-400/15 bg-red-500/5">
                                      {teamInfo.iconUrl ? (
                                        <img
                                          src={
                                            teamInfo.iconUrl
                                          }
                                          alt=""
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <Swords className="h-5 w-5 text-red-300" />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-extrabold text-white">
                                          {
                                            teamInfo.name
                                          }
                                        </p>

                                        {teamInfo.tag && (
                                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[8px] font-black text-slate-400">
                                            {
                                              teamInfo.tag
                                            }
                                          </span>
                                        )}
                                      </div>

                                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        {
                                          teamInfo.role
                                        }
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-500/5 p-3">
                                      <p className="text-[9px] uppercase tracking-wider text-slate-500">
                                        Dragon Egg
                                      </p>

                                      <p className="mt-1 text-sm font-black text-fuchsia-200">
                                        {
                                          teamInfo.dragonEgg
                                        }
                                      </p>
                                    </div>

                                    <div className="rounded-2xl border border-amber-400/15 bg-amber-500/5 p-3">
                                      <p className="text-[9px] uppercase tracking-wider text-slate-500">
                                        Honors
                                      </p>

                                      <p className="mt-1 text-sm font-black text-amber-200">
                                        {
                                          teamInfo.honors.length
                                        }
                                      </p>
                                    </div>
                                  </div>

                                  {teamInfo.honors.length >
                                    0 && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                        Season highlights
                                      </p>

                                      <div className="mt-3 space-y-2">
                                        {teamInfo.honors.map(
                                          (
                                            honor
                                          ) => (
                                            <div
                                              key={
                                                honor
                                              }
                                              className="flex items-center gap-2 text-[10px] font-semibold text-slate-300"
                                            >
                                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                              {
                                                honor
                                              }
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {awards.length >
                                0 && (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                    Player honors
                                  </p>

                                  <div className="mt-3 space-y-2">
                                    {awards
                                      .slice(
                                        0,
                                        5
                                      )
                                      .map(
                                        (
                                          award
                                        ) => (
                                          <div
                                            key={
                                              award.id
                                            }
                                            className="flex items-center gap-3"
                                          >
                                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/20">
                                              {award.iconUrl ? (
                                                <img
                                                  src={
                                                    award.iconUrl
                                                  }
                                                  alt=""
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <Crown className="h-4 w-4 text-amber-300" />
                                              )}
                                            </div>

                                            <div className="min-w-0">
                                              <p className="truncate text-[10px] font-extrabold text-white">
                                                {
                                                  award.title
                                                }
                                              </p>

                                              <p className="text-[9px] text-slate-500">
                                                {
                                                  award.type
                                                }
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
                      <SectionHeader
                        icon={Trophy}
                        eyebrow="Minecraft Server"
                        title="Seasonal Advancements"
                        description={`Advancements earned in ${selectedSeason.season_name}. Other seasons are never mixed.`}
                        action={
                          <span className="rounded-full border border-emerald-400/15 bg-emerald-400/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                            {formatInteger(advancements.filter((item) => item.completed).length)}/{formatInteger(advancements.length)}
                          </span>
                        }
                      />

                      <div className="p-4">
                        {advancements.length === 0 ? (
                          <div className="py-10 text-center">
                            <Trophy className="mx-auto h-8 w-8 text-slate-700" />
                            <p className="mt-3 text-xs font-semibold text-slate-500">
                              No server advancements have been synced for this season yet.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {advancements.slice(0, 6).map((advancement) => (
                                <div
                                  key={advancement.id}
                                  className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 ${
                                    advancement.completed
                                      ? 'border-emerald-400/20 bg-emerald-500/5'
                                      : 'border-red-400/15 bg-red-500/5'
                                  }`}
                                >
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-black ${
                                    advancement.completed
                                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                      : 'border-red-400/20 bg-red-400/10 text-red-300'
                                  }`}>
                                    {advancement.completed ? '✓' : '✕'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`truncate text-[10px] font-extrabold ${
                                      advancement.completed ? 'text-emerald-100' : 'text-red-100'
                                    }`}>
                                      {advancement.title}
                                    </p>
                                    {advancement.description && (
                                      <p className="mt-0.5 truncate text-[8px] text-slate-500">
                                        {advancement.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowAllAdvancements(true)}
                              className="mt-4 flex w-full items-center justify-between rounded-xl border border-purple-400/15 bg-purple-500/5 px-3 py-2.5 text-[10px] font-bold text-purple-200 transition hover:border-purple-400/30 hover:bg-purple-500/10"
                            >
                              View all {formatInteger(advancements.length)} advancements
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <aside className="space-y-6">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
                      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">
                            Season leaderboard
                          </p>

                          <h3 className="mt-1 text-sm font-extrabold text-white">
                            {selectedCategoryForDisplay?.display_name ||
                              'Leaderboard'}
                          </h3>
                        </div>

                        <button
                          onClick={
                            goLeaderboard
                          }
                          className="text-slate-500 transition hover:text-white"
                          aria-label="Open leaderboards"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="p-4">
                        {leaderboardLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
                          </div>
                        ) : leaderboardRows.length ===
                          0 ? (
                          <div className="py-10 text-center">
                            <Trophy className="mx-auto h-8 w-8 text-slate-700" />

                            <p className="mt-3 text-xs font-semibold text-slate-500">
                              No leaderboard entries yet.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {leaderboardRows.map(
                              (
                                entry,
                                index
                              ) => {
                                const isPlayer =
                                  minecraftUuid ===
                                  entry.minecraft_uuid;

                                return (
                                  <div
                                    key={`${entry.minecraft_uuid}-${index}`}
                                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                                      isPlayer
                                        ? 'border-purple-400/25 bg-purple-500/10'
                                        : 'border-white/10 bg-white/[0.015]'
                                    }`}
                                  >
                                    <span
                                      className={`w-5 text-center text-[10px] font-black ${
                                        index ===
                                        0
                                          ? 'text-amber-300'
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      {
                                        index +
                                          1
                                      }
                                    </span>

                                    <img
                                      src={
                                        entry.avatar_url ||
                                        `https://mc-heads.net/avatar/${encodeURIComponent(
                                          entry.username
                                        )}/40`
                                      }
                                      alt={
                                        entry.username
                                      }
                                      className="h-7 w-7 rounded-lg border border-white/10 bg-black/30 object-cover"
                                    />

                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`truncate text-[10px] font-extrabold ${
                                          isPlayer
                                            ? 'text-purple-100'
                                            : 'text-white'
                                        }`}
                                      >
                                        {
                                          entry.username
                                        }
                                      </p>

                                      <p className="text-[8px] text-slate-500">
                                        {entry.badge ||
                                          entry.guild ||
                                          'Player'}
                                      </p>
                                    </div>

                                    <span className="text-[10px] font-black text-purple-200">
                                      {
                                        entry.display_score ||
                                        entry.score
                                      }
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}

                        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                                Your rank
                              </p>

                              <p className="mt-1 text-xl font-black text-white">
                                {leaderboardRank.rank
                                  ? `#${leaderboardRank.rank}`
                                  : 'Unranked'}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                                Players
                              </p>

                              <p className="mt-1 text-sm font-black text-slate-300">
                                {formatInteger(
                                  leaderboardRank.totalPlayers
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={
                            goLeaderboard
                          }
                          className="mt-3 flex w-full items-center justify-between rounded-xl border border-purple-400/15 bg-purple-500/5 px-3 py-2.5 text-[10px] font-bold text-purple-200 transition hover:border-purple-400/30 hover:bg-purple-500/10"
                        >
                          View full leaderboard

                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.035] to-black/20 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/15 bg-sky-400/5 text-sky-300">
                          <Zap className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-xs font-extrabold text-white">
                            Season spotlight
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-slate-500">
                            Your selected season keeps its own stats, achievements, team context and leaderboard identity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
                )}
              </section>
            )}

            {showAllAdvancements && selectedSeason && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Seasonal advancements">
                <button
                  type="button"
                  aria-label="Close advancements"
                  onClick={() => setShowAllAdvancements(false)}
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                />

                <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#09090e]/95 shadow-2xl shadow-black/50">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/80">
                        {selectedSeason.season_name}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-white">
                        Seasonal Advancements
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllAdvancements(false)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {advancements.map((advancement) => (
                        <div
                          key={advancement.id}
                          className={`rounded-2xl border p-3 transition ${
                            advancement.completed
                              ? 'border-emerald-400/20 bg-emerald-500/[0.06]'
                              : 'border-red-400/15 bg-red-500/[0.05]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${
                              advancement.completed
                                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                : 'border-red-400/20 bg-red-400/10 text-red-300'
                            }`}>
                              {advancement.completed ? '✓' : '✕'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className={`text-[11px] font-extrabold ${
                                  advancement.completed ? 'text-emerald-50' : 'text-red-50'
                                }`}>
                                  {advancement.title}
                                </p>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                                  advancement.completed
                                    ? 'bg-emerald-400/10 text-emerald-300'
                                    : 'bg-red-400/10 text-red-300'
                                }`}>
                                  {advancement.completed ? 'Completed' : 'Locked'}
                                </span>
                              </div>
                              {advancement.description && (
                                <p className="mt-1 text-[9px] leading-4 text-slate-500">
                                  {advancement.description}
                                </p>
                              )}
                              <p className="mt-2 truncate font-mono text-[8px] text-slate-700">
                                {advancement.advancementKey}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-500/10 via-white/[0.025] to-cyan-500/5 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-300/80">
                    Forever on Butterfly Network
                  </p>

                  <h3 className="mt-1 font-heading text-xl font-black text-white">
                    Every season tells a story.
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Your stats, achievements and team moments stay tied to the season they belong to.
                  </p>
                </div>

                <button
                  onClick={
                    goLeaderboard
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/25 px-4 py-2.5 text-xs font-bold text-white transition hover:border-purple-400/25 hover:bg-purple-500/10"
                >
                  Explore Leaderboards
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        ) : activeTab ===
          'activity' ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-10 text-center backdrop-blur-xl">
            <Clock3 className="mx-auto h-10 w-10 text-slate-700" />

            <h3 className="mt-4 font-extrabold text-white">
              Activity
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Website activity only. Minecraft server events stay inside the selected season.
            </p>
          </div>
        ) : postsLoading ? (
          <div className="mt-6 flex items-center justify-center rounded-3xl border border-white/10 bg-white/[0.025] py-20 backdrop-blur-xl">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : userPosts.length ===
          0 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-10 text-center backdrop-blur-xl">
            <Sparkles className="mx-auto h-10 w-10 text-slate-700" />

            <h3 className="mt-4 font-extrabold text-white">
              No posts yet
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              This profile has not published any posts.
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-6 max-w-2xl space-y-6">
            {userPosts.map(
              (post) => (
                <PostCard
                  key={post.id}
                  post={post}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};