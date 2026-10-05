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

  statistics?: Record<string, number>;
}

interface MinecraftSyncPayload {
  serverId: string;
  bridgeVersion?: string;
  sentAt?: string;
  players: MinecraftPlayerPayload[];
}

const json = (
  res: any,
  status: number,
  body: Record<string, unknown>
) => {
  res.status(status).json(body);
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const safeNumber = (value: unknown, fallback = 0) => {
  if (!isFiniteNumber(value)) return fallback;
  return value >= 0 ? value : fallback;
};

const cleanText = (
  value: unknown,
  maxLength: number
): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return json(res, 405, {
      success: false,
      message: 'Method not allowed.',
    });
  }

  const expectedApiKey = process.env.MINECRAFT_API_KEY;

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!expectedApiKey) {
    return json(res, 500, {
      success: false,
      message: 'MINECRAFT_API_KEY is not configured.',
    });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, {
      success: false,
      message: 'Supabase server credentials are not configured.',
    });
  }

  const receivedApiKey =
    typeof req.headers['x-api-key'] === 'string'
      ? req.headers['x-api-key']
      : '';

  if (!receivedApiKey || receivedApiKey !== expectedApiKey) {
    return json(res, 401, {
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
    return json(res, 400, {
      success: false,
      message: 'Invalid JSON body.',
    });
  }

  if (!body || typeof body !== 'object') {
    return json(res, 400, {
      success: false,
      message: 'Invalid request body.',
    });
  }

  const serverId = cleanText(body.serverId, 64);

  if (!serverId) {
    return json(res, 400, {
      success: false,
      message: 'serverId is required.',
    });
  }

  const configuredServerId =
    process.env.MINECRAFT_SERVER_ID || 'main';

  if (serverId !== configuredServerId) {
    return json(res, 403, {
      success: false,
      message: 'Unknown Minecraft server.',
    });
  }

  if (!Array.isArray(body.players)) {
    return json(res, 400, {
      success: false,
      message: 'players must be an array.',
    });
  }

  if (body.players.length > 500) {
    return json(res, 413, {
      success: false,
      message: 'Too many players in one sync request.',
    });
  }

  const players = body.players
    .filter((player) => player && typeof player === 'object')
    .map((player) => ({
      uuid: cleanText(player.uuid, 64),
      username: cleanText(player.username, 32),

      hearts: safeNumber(player.hearts),
      kills: Math.floor(safeNumber(player.kills)),
      deaths: Math.floor(safeNumber(player.deaths)),
      money: safeNumber(player.money),
      playtimeSeconds: Math.floor(
        safeNumber(player.playtimeSeconds)
      ),

      wins: isFiniteNumber(player.wins)
        ? Math.floor(Math.max(0, player.wins))
        : undefined,

      killStreak: isFiniteNumber(player.killStreak)
        ? Math.floor(Math.max(0, player.killStreak))
        : undefined,

      statistics:
        player.statistics &&
        typeof player.statistics === 'object'
          ? Object.fromEntries(
              Object.entries(player.statistics)
                .filter(
                  ([key, value]) =>
                    typeof key === 'string' &&
                    key.length <= 120 &&
                    isFiniteNumber(value)
                )
                .slice(0, 100)
                .map(([key, value]) => [
                  cleanText(key, 120),
                  Math.floor(Math.max(0, value as number)),
                ])
            )
          : {},
    }))
    .filter(
      (player) =>
        player.uuid.length > 0 &&
        player.username.length > 0
    );

  if (players.length === 0) {
    return json(res, 400, {
      success: false,
      message: 'No valid players received.',
    });
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const now = new Date().toISOString();

  const statsRows = players.map((player) => ({
    minecraft_uuid: player.uuid,
    minecraft_username: player.username,
    server_id: serverId,

    hearts: player.hearts,
    kills: player.kills,
    deaths: player.deaths,
    money: player.money,
    playtime_seconds: player.playtimeSeconds,

    ...(player.wins !== undefined
      ? { wins: player.wins }
      : {}),

    ...(player.killStreak !== undefined
      ? { kill_streak: player.killStreak }
      : {}),

    last_seen_at: now,
    updated_at: now,
  }));

  const { error: statsError } = await supabase
    .from('player_minecraft_stats')
    .upsert(statsRows, {
      onConflict: 'minecraft_uuid',
    });

  if (statsError) {
    console.error(
      '[Minecraft Sync] Stats upsert failed:',
      statsError
    );

    return json(res, 500, {
      success: false,
      message: 'Failed to update player stats.',
    });
  }

  const statisticRows = players.flatMap((player) =>
    Object.entries(player.statistics).map(
      ([statisticKey, statisticValue]) => ({
        minecraft_uuid: player.uuid,
        statistic_key: statisticKey,
        statistic_value: statisticValue,
        category: 'minecraft',
        updated_at: now,
      })
    )
  );

  if (statisticRows.length > 0) {
    const { error: statisticError } = await supabase
      .from('player_statistics')
      .upsert(statisticRows, {
        onConflict:
          'minecraft_uuid,statistic_key',
      });

    if (statisticError) {
      console.error(
        '[Minecraft Sync] Statistics upsert failed:',
        statisticError
      );

      return json(res, 500, {
        success: false,
        message: 'Failed to update Minecraft statistics.',
      });
    }
  }

  const { data: activeSeason, error: seasonError } =
    await supabase
      .from('seasons')
      .select(
        'id, season_number, name, slug, status'
      )
      .eq('server_id', serverId)
      .eq('status', 'active')
      .order('season_number', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (seasonError) {
    console.error(
      '[Minecraft Sync] Season lookup failed:',
      seasonError
    );

    return json(res, 500, {
      success: false,
      message: 'Failed to find active season.',
    });
  }

  return json(res, 200, {
    success: true,
    syncedPlayers: players.length,

    activeSeason: activeSeason
      ? {
          id: activeSeason.id,
          seasonNumber: activeSeason.season_number,
          name: activeSeason.name,
          slug: activeSeason.slug,
          status: activeSeason.status,
        }
      : null,

    bridgeVersion:
      cleanText(body.bridgeVersion, 32) ||
      'unknown',

    syncedAt: now,
  });
}