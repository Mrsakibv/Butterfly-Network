import { createClient } from '@supabase/supabase-js';

interface MinecraftPlayerPayload {
  uuid: string;
  username: string;

  hearts?: number;
  kills?: number;
  deaths?: number;
  money?: number;
  playtimeSeconds?: number;
  wins?: number;
  killStreak?: number;

  blocksBroken?: number;
  blocksPlaced?: number;
  itemsCrafted?: number;
  itemsUsed?: number;
  mobsKilled?: number;
  playersKilled?: number;

  distanceWalked?: number;
  distanceRun?: number;
  distanceFlown?: number;

  damageDealt?: number;
  damageTaken?: number;

  jumps?: number;

  statistics?: Record<string, number>;
}

interface MinecraftSyncPayload {
  serverId: string;
  bridgeVersion?: string;
  sentAt?: string;
  players: MinecraftPlayerPayload[];
}

interface ExistingStatRow {
  minecraft_uuid: string;
  first_seen_at: string | null;
}

const MAX_PLAYERS = 500;
const MAX_STATISTICS_PER_PLAYER = 100;

const cleanText = (
  value: unknown,
  maxLength: number
): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
};

const safeNumber = (
  value: unknown,
  fallback = 0
): number => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(0, value);
};

const integer = (
  value: unknown,
  fallback = 0
): number => {
  return Math.floor(
    safeNumber(value, fallback)
  );
};

const sendJson = (
  res: any,
  status: number,
  body: Record<string, unknown>
) => {
  return res.status(status).json(body);
};

const statisticValue = (
  statistics: Record<string, number>,
  keys: string[],
  fallback = 0
): number => {
  for (const key of keys) {
    const value = statistics[key];

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return Math.max(0, value);
    }
  }

  return fallback;
};

export default async function handler(
  req: any,
  res: any
) {
  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      message: 'Method not allowed.',
    });
  }

  const expectedApiKey =
    process.env.MINECRAFT_API_KEY;

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const configuredServerId =
    process.env.MINECRAFT_SERVER_ID ||
    'main';

  if (
    !expectedApiKey ||
    !supabaseUrl ||
    !supabaseServiceKey
  ) {
    return sendJson(res, 500, {
      success: false,
      message:
        'Minecraft sync server configuration is incomplete.',
    });
  }

  const receivedApiKey =
    typeof req.headers?.['x-api-key'] === 'string'
      ? req.headers['x-api-key']
      : '';

  if (
    !receivedApiKey ||
    receivedApiKey !== expectedApiKey
  ) {
    return sendJson(res, 401, {
      success: false,
      message: 'Unauthorized.',
    });
  }

  let body: MinecraftSyncPayload;

  try {
    body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;
  } catch {
    return sendJson(res, 400, {
      success: false,
      message: 'Invalid JSON body.',
    });
  }

  if (
    !body ||
    typeof body !== 'object'
  ) {
    return sendJson(res, 400, {
      success: false,
      message: 'Invalid request body.',
    });
  }

  const serverId =
    cleanText(body.serverId, 64);

  if (!serverId) {
    return sendJson(res, 400, {
      success: false,
      message: 'serverId is required.',
    });
  }

  if (
    serverId !== configuredServerId
  ) {
    return sendJson(res, 403, {
      success: false,
      message:
        'Unknown Minecraft server.',
    });
  }

  if (
    !Array.isArray(body.players)
  ) {
    return sendJson(res, 400, {
      success: false,
      message:
        'players must be an array.',
    });
  }

  if (
    body.players.length > MAX_PLAYERS
  ) {
    return sendJson(res, 413, {
      success: false,
      message:
        `Too many players. Maximum is ${MAX_PLAYERS}.`,
    });
  }

  const players =
    body.players
      .filter(
        (player) =>
          player &&
          typeof player === 'object' &&
          typeof player.uuid === 'string' &&
          typeof player.username === 'string'
      )
      .map((player) => {
        const statistics =
          player.statistics &&
          typeof player.statistics === 'object'
            ? Object.fromEntries(
                Object.entries(
                  player.statistics
                )
                  .filter(
                    ([key, value]) =>
                      typeof key === 'string' &&
                      key.length <= 120 &&
                      typeof value === 'number' &&
                      Number.isFinite(value)
                  )
                  .slice(
                    0,
                    MAX_STATISTICS_PER_PLAYER
                  )
                  .map(
                    ([key, value]) => [
                      cleanText(key, 120),
                      integer(value),
                    ]
                  )
              )
            : {};

        return {
          uuid: cleanText(
            player.uuid,
            64
          ),

          username: cleanText(
            player.username,
            32
          ),

          hearts: safeNumber(
            player.hearts
          ),

          kills: integer(
            player.kills
          ),

          deaths: integer(
            player.deaths
          ),

          money: safeNumber(
            player.money
          ),

          playtimeSeconds: integer(
            player.playtimeSeconds
          ),

          wins: integer(
            player.wins
          ),

          killStreak: integer(
            player.killStreak
          ),

          blocksBroken: integer(
            player.blocksBroken,
            statisticValue(
              statistics,
              ['MINE_BLOCK']
            )
          ),

          blocksPlaced: integer(
            player.blocksPlaced
          ),

          itemsCrafted: integer(
            player.itemsCrafted
          ),

          itemsUsed: integer(
            player.itemsUsed
          ),

          mobsKilled: integer(
            player.mobsKilled,
            statisticValue(
              statistics,
              ['MOB_KILLS']
            )
          ),

          playersKilled: integer(
            player.playersKilled,
            integer(player.kills)
          ),

          distanceWalked: integer(
            player.distanceWalked,
            statisticValue(
              statistics,
              ['WALK_ONE_CM']
            )
          ),

          distanceRun: integer(
            player.distanceRun,
            statisticValue(
              statistics,
              ['SPRINT_ONE_CM']
            )
          ),

          distanceFlown: integer(
            player.distanceFlown,
            statisticValue(
              statistics,
              ['FLY_ONE_CM']
            )
          ),

          damageDealt: safeNumber(
            player.damageDealt,
            statisticValue(
              statistics,
              ['DAMAGE_DEALT']
            )
          ),

          damageTaken: safeNumber(
            player.damageTaken,
            statisticValue(
              statistics,
              ['DAMAGE_TAKEN']
            )
          ),

          jumps: integer(
            player.jumps,
            statisticValue(
              statistics,
              ['JUMP']
            )
          ),

          statistics,
        };
      })
      .filter(
        (player) =>
          player.uuid.length > 0 &&
          player.username.length > 0
      );

  if (
    players.length === 0
  ) {
    return sendJson(res, 400, {
      success: false,
      message:
        'No valid players received.',
    });
  }

  const supabase =
    createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

  const now =
    new Date().toISOString();

  const uuids = players.map(
    (player) => player.uuid
  );

  /*
   * Read existing records so first_seen_at
   * remains permanent.
   */
  const {
    data: existingRows,
    error: existingError,
  } =
    await supabase
      .from(
        'player_minecraft_stats'
      )
      .select(
        'minecraft_uuid, first_seen_at'
      )
      .in(
        'minecraft_uuid',
        uuids
      );

  if (existingError) {
    console.error(
      '[Minecraft Sync] Existing player lookup failed:',
      existingError
    );

    return sendJson(res, 500, {
      success: false,
      message:
        'Failed to prepare player stats sync.',
      code:
        existingError.code || null,
    });
  }

  const existingMap =
    new Map<
      string,
      string | null
    >(
      (
        (existingRows ?? []) as ExistingStatRow[]
      ).map((row) => [
        row.minecraft_uuid,
        row.first_seen_at,
      ])
    );

  /*
   * IMPORTANT:
   * Every NOT NULL stats column is sent explicitly.
   */
  const statsRows =
    players.map((player) => ({
      minecraft_uuid:
        player.uuid,

      minecraft_username:
        player.username,

      server_id:
        serverId,

      hearts:
        player.hearts,

      kills:
        player.kills,

      deaths:
        player.deaths,

      money:
        player.money,

      playtime_seconds:
        player.playtimeSeconds,

      wins:
        player.wins,

      kill_streak:
        player.killStreak,

      blocks_broken:
        player.blocksBroken,

      blocks_placed:
        player.blocksPlaced,

      items_crafted:
        player.itemsCrafted,

      items_used:
        player.itemsUsed,

      mobs_killed:
        player.mobsKilled,

      players_killed:
        player.playersKilled,

      distance_walked:
        player.distanceWalked,

      distance_run:
        player.distanceRun,

      distance_flown:
        player.distanceFlown,

      damage_dealt:
        player.damageDealt,

      damage_taken:
        player.damageTaken,

      jumps:
        player.jumps,

      first_seen_at:
        existingMap.get(
          player.uuid
        ) ?? now,

      last_seen_at:
        now,

      updated_at:
        now,
    }));

  const {
    error: statsError,
  } =
    await supabase
      .from(
        'player_minecraft_stats'
      )
      .upsert(
        statsRows,
        {
          onConflict:
            'minecraft_uuid',
        }
      );

  if (statsError) {
    console.error(
      '[Minecraft Sync] Stats upsert failed:',
      {
        code:
          statsError.code,
        message:
          statsError.message,
        details:
          statsError.details,
        hint:
          statsError.hint,
      }
    );

    return sendJson(res, 500, {
      success: false,
      message:
        'Failed to update player stats.',
      code:
        statsError.code || null,
      details:
        statsError.details || null,
      hint:
        statsError.hint || null,
    });
  }

  /*
   * Generic Minecraft statistics.
   */
  const statisticRows =
    players.flatMap(
      (player) =>
        Object.entries(
          player.statistics
        ).map(
          ([
            statisticKey,
            statisticValue,
          ]) => ({
            minecraft_uuid:
              player.uuid,

            statistic_key:
              statisticKey,

            statistic_value:
              statisticValue,

            category:
              'minecraft',

            updated_at:
              now,
          })
        )
    );

  if (
    statisticRows.length > 0
  ) {
    const {
      error: statisticError,
    } =
      await supabase
        .from(
          'player_statistics'
        )
        .upsert(
          statisticRows,
          {
            onConflict:
              'minecraft_uuid,statistic_key',
          }
        );

    if (statisticError) {
      console.error(
        '[Minecraft Sync] Statistics upsert failed:',
        {
          code:
            statisticError.code,
          message:
            statisticError.message,
          details:
            statisticError.details,
          hint:
            statisticError.hint,
        }
      );

      return sendJson(res, 500, {
        success: false,
        message:
          'Failed to update Minecraft statistics.',
        code:
          statisticError.code || null,
        details:
          statisticError.details || null,
        hint:
          statisticError.hint || null,
      });
    }
  }

  /*
   * Find current active season.
   */
  const {
    data: activeSeason,
    error: seasonError,
  } =
    await supabase
      .from('seasons')
      .select(
        'id, season_number, name, slug, status'
      )
      .eq(
        'server_id',
        serverId
      )
      .eq(
        'status',
        'active'
      )
      .order(
        'season_number',
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

  if (seasonError) {
    console.error(
      '[Minecraft Sync] Active season lookup failed:',
      seasonError
    );

    return sendJson(res, 500, {
      success: false,
      message:
        'Failed to read active season.',
      code:
        seasonError.code || null,
      details:
        seasonError.details || null,
      hint:
        seasonError.hint || null,
    });
  }

  /*
   * Update season leaderboard automatically.
   *
   * This function:
   * 1. Creates missing season baselines.
   * 2. Calculates season-specific kills/deaths/playtime.
   * 3. Updates current hearts/money/wins/streak.
   */
  let leaderboardSyncedCount = 0;

  if (activeSeason) {
    const {
      data: leaderboardResult,
      error: leaderboardError,
    } =
      await supabase.rpc(
        'sync_active_season_leaderboard',
        {
          p_server_id:
            serverId,
        }
      );

    if (leaderboardError) {
      console.error(
        '[Minecraft Sync] Leaderboard sync failed:',
        {
          code:
            leaderboardError.code,
          message:
            leaderboardError.message,
          details:
            leaderboardError.details,
          hint:
            leaderboardError.hint,
        }
      );

      return sendJson(res, 500, {
        success: false,
        message:
          'Player stats synced, but leaderboard sync failed.',
        code:
          leaderboardError.code || null,
        details:
          leaderboardError.details || null,
        hint:
          leaderboardError.hint || null,
      });
    }

    /*
     * Supabase may return the scalar directly
     * or a single-item array depending on API layer.
     */
    if (
      Array.isArray(
        leaderboardResult
      )
    ) {
      leaderboardSyncedCount =
        Number(
          leaderboardResult[0]
        ) || 0;
    } else {
      leaderboardSyncedCount =
        Number(
          leaderboardResult
        ) || 0;
    }
  }

  return sendJson(res, 200, {
    success: true,

    syncedPlayers:
      players.length,

    leaderboardSyncedCount,

    activeSeason:
      activeSeason || null,

    syncedAt:
      now,

    bridgeVersion:
      cleanText(
        body.bridgeVersion,
        32
      ) || 'unknown',
  });
}