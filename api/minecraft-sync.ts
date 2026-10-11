import { createClient } from '@supabase/supabase-js';

interface MinecraftAdvancementPayload {
  key: string;
  title: string;
  description: string;
  iconMaterial: string;
  completed: boolean;
  completedAt?: string | null;
}

interface MinecraftPlayerPayload {
  uuid: string;
  username: string;

  rankName?: string;
  teamName?: string;

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
  advancements?: MinecraftAdvancementPayload[];
}

interface MinecraftSyncPayload {
  serverId: string;
  bridgeVersion?: string;
  sentAt?: string;
  syncType?: 'periodic' | 'join' | 'leave';
  players: MinecraftPlayerPayload[];
}

interface ActiveSeason {
  id: string;
  season_number: number;
  name: string;
  slug: string;
  status: 'active';
}

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

const normalizeAdvancements = (
  value: unknown
): MinecraftAdvancementPayload[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .filter(
      (item) =>
        item !== null &&
        typeof item === 'object'
    )
    .map((item) => {
      const row = item as Record<string, unknown>;

      return {
        key: cleanText(
          row.key ??
            row.advancementKey ??
            row.advancement_key,
          300
        ),
        title: cleanText(row.title, 300),
        description: cleanText(row.description, 500),
        iconMaterial: cleanText(
          row.iconMaterial ??
            row.icon_material,
          120
        ),
        completed:
          row.completed === true ||
          row.completed === 1 ||
          String(row.completed ?? '').toLowerCase() ===
            'true',
        completedAt:
          cleanText(
            row.completedAt ??
              row.completed_at,
            64
          ) || null,
      };
    })
    .filter((item) => item.key.length > 0);

  const seen = new Set<string>();

  return normalized.filter((item) => {
    if (seen.has(item.key)) {
      return false;
    }

    seen.add(item.key);
    return true;
  });
};

const sendJson = (
  res: any,
  status: number,
  body: Record<string, unknown>
) => {
  return res.status(status).json(body);
};

export default async function handler(
  req: any,
  res: any
) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      message: 'Method not allowed.',
    });
  }

  const expectedApiKey = process.env.MINECRAFT_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const configuredServerId =
    process.env.MINECRAFT_SERVER_ID || 'main';

  if (!expectedApiKey) {
    return sendJson(res, 500, {
      success: false,
      message: 'MINECRAFT_API_KEY is not configured.',
    });
  }

  if (!supabaseUrl) {
    return sendJson(res, 500, {
      success: false,
      message: 'SUPABASE_URL is not configured.',
    });
  }

  if (!serviceRoleKey) {
    return sendJson(res, 500, {
      success: false,
      message:
        'SUPABASE_SERVICE_ROLE_KEY is not configured.',
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

  if (!body || typeof body !== 'object') {
    return sendJson(res, 400, {
      success: false,
      message: 'Invalid request body.',
    });
  }

  const serverId = cleanText(body.serverId, 64);

  const syncType =
    body.syncType === 'join' ||
    body.syncType === 'leave'
      ? body.syncType
      : 'periodic';

  if (!serverId) {
    return sendJson(res, 400, {
      success: false,
      message: 'serverId is required.',
    });
  }

  if (serverId !== configuredServerId) {
    return sendJson(res, 403, {
      success: false,
      message: 'Unknown Minecraft server.',
    });
  }

  if (!Array.isArray(body.players)) {
    return sendJson(res, 400, {
      success: false,
      message: 'players must be an array.',
    });
  }

  if (body.players.length > 500) {
    return sendJson(res, 413, {
      success: false,
      message: 'Too many players in one request.',
    });
  }

  const players = body.players
    .filter(
      (player) =>
        player !== null &&
        typeof player === 'object'
    )
    .map((player) => ({
      uuid: cleanText(player.uuid, 64),
      username: cleanText(player.username, 32),
      rankName: cleanText(player.rankName, 120),
      teamName: cleanText(player.teamName, 120),
      hearts: safeNumber(player.hearts),
      kills: Math.floor(safeNumber(player.kills)),
      deaths: Math.floor(safeNumber(player.deaths)),
      money: safeNumber(player.money),
      playtimeSeconds: Math.floor(
        safeNumber(player.playtimeSeconds)
      ),
      wins: Math.floor(safeNumber(player.wins)),
      killStreak: Math.floor(
        safeNumber(player.killStreak)
      ),
      blocksBroken: Math.floor(
        safeNumber(player.blocksBroken)
      ),
      blocksPlaced: Math.floor(
        safeNumber(player.blocksPlaced)
      ),
      itemsCrafted: Math.floor(
        safeNumber(player.itemsCrafted)
      ),
      itemsUsed: Math.floor(
        safeNumber(player.itemsUsed)
      ),
      mobsKilled: Math.floor(
        safeNumber(player.mobsKilled)
      ),
      playersKilled: Math.floor(
        safeNumber(player.playersKilled)
      ),
      distanceWalked: Math.floor(
        safeNumber(player.distanceWalked)
      ),
      distanceRun: Math.floor(
        safeNumber(player.distanceRun)
      ),
      distanceFlown: Math.floor(
        safeNumber(player.distanceFlown)
      ),
      damageDealt: safeNumber(player.damageDealt),
      damageTaken: safeNumber(player.damageTaken),
      jumps: Math.floor(safeNumber(player.jumps)),
      statistics:
        player.statistics &&
        typeof player.statistics === 'object'
          ? Object.fromEntries(
              Object.entries(player.statistics)
                .filter(
                  ([key, value]) =>
                    typeof key === 'string' &&
                    key.length <= 120 &&
                    typeof value === 'number' &&
                    Number.isFinite(value)
                )
                .slice(0, 200)
                .map(([key, value]) => [
                  cleanText(key, 120),
                  Math.max(0, value as number),
                ])
            )
          : {},
      advancements: normalizeAdvancements(
        player.advancements
      ),
    }))
    .filter(
      (player) =>
        player.uuid.length > 0 &&
        player.username.length > 0
    );

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

  /* =========================================================
   * ACTIVE SEASON BEFORE CURRENT-DATA SYNC
   * ========================================================= */

  const getActiveSeason = async (): Promise<ActiveSeason | null> => {
    const { data, error } = await supabase
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

    if (error) {
      throw new Error(error.message);
    }

    return (data as ActiveSeason | null) ?? null;
  };

  let activeSeasonBeforeFinalization: ActiveSeason | null =
    null;

  try {
    activeSeasonBeforeFinalization =
      await getActiveSeason();
  } catch (error) {
    console.error(
      '[Minecraft Sync] Active season lookup error:',
      error
    );

    return sendJson(res, 500, {
      success: false,
      message: 'Failed to read active season.',
    });
  }

  /* =========================================================
   * CURRENT GLOBAL PLAYER DATA
   * ========================================================= */

  if (players.length > 0) {
    const statsRows = players.map((player) => ({
      minecraft_uuid: player.uuid,
      minecraft_username: player.username,
      server_id: serverId,
      hearts: player.hearts,
      kills: player.kills,
      deaths: player.deaths,
      money: player.money,
      playtime_seconds: player.playtimeSeconds,
      wins: player.wins,
      kill_streak: player.killStreak,
      blocks_broken: player.blocksBroken,
      blocks_placed: player.blocksPlaced,
      items_crafted: player.itemsCrafted,
      items_used: player.itemsUsed,
      mobs_killed: player.mobsKilled,
      players_killed: player.playersKilled,
      distance_walked: player.distanceWalked,
      distance_run: player.distanceRun,
      distance_flown: player.distanceFlown,
      damage_dealt: player.damageDealt,
      damage_taken: player.damageTaken,
      jumps: player.jumps,
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
        '[Minecraft Sync] Stats error:',
        statsError
      );

      return sendJson(res, 500, {
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
          '[Minecraft Sync] Statistic error:',
          statisticError
        );

        return sendJson(res, 500, {
          success: false,
          message: 'Failed to update statistics.',
        });
      }
    }
  }

  /* =========================================================
   * SEASON PARTICIPATION + ADVANCEMENTS
   * ========================================================= */

  let participationSyncedCount = 0;
  let advancementSyncedCount = 0;
  let leaderboardSyncedCount = 0;
  const syncWarnings: string[] = [];

  const syncPlayersIntoSeason = async (
    seasonId: string
  ): Promise<void> => {
    if (players.length === 0) {
      return;
    }

    const results = await Promise.all(
      players.map(async (player) => {
        let participationOk = false;
        let advancementCount = 0;
        let warning: string | null = null;

        /* -----------------------------------------------------
         * PARTICIPATION
         * ----------------------------------------------------- */

        try {
          const { data, error } = await supabase.rpc(
            'record_season_player_participation',
            {
              p_season_id: seasonId,
              p_minecraft_uuid: player.uuid,
              p_minecraft_username: player.username,
              p_server_id: serverId,
            }
          );

          if (!error && data === true) {
            participationOk = true;
          } else {
            if (error) {
              console.warn(
                '[Minecraft Sync] Participation RPC warning:',
                error.message
              );
            }

            const { error: fallbackError } =
              await supabase
                .from('season_player_participation')
                .upsert(
                  {
                    season_id: seasonId,
                    minecraft_uuid: player.uuid,
                    minecraft_username: player.username,
                    server_id: serverId,
                    last_seen_at: now,
                  },
                  {
                    onConflict:
                      'season_id,minecraft_uuid',
                  }
                );

            if (!fallbackError) {
              participationOk = true;
            } else {
              warning =
                `Season participation sync failed for ${player.username}: ${fallbackError.message}`;
            }
          }
        } catch (error) {
          console.warn(
            '[Minecraft Sync] Participation exception:',
            error
          );

          try {
            const { error: fallbackError } =
              await supabase
                .from('season_player_participation')
                .upsert(
                  {
                    season_id: seasonId,
                    minecraft_uuid: player.uuid,
                    minecraft_username: player.username,
                    server_id: serverId,
                    last_seen_at: now,
                  },
                  {
                    onConflict:
                      'season_id,minecraft_uuid',
                  }
                );

            if (!fallbackError) {
              participationOk = true;
            } else {
              warning =
                `Season participation sync failed for ${player.username}: ${fallbackError.message}`;
            }
          } catch {
            warning =
              `Season participation sync failed for ${player.username}.`;
          }
        }

        /* -----------------------------------------------------
         * ADVANCEMENTS
         * ----------------------------------------------------- */

        try {
          const { data, error } = await supabase.rpc(
            'sync_player_season_advancements',
            {
              p_season_id: seasonId,
              p_minecraft_uuid: player.uuid,
              p_minecraft_username: player.username,
              p_server_id: serverId,
              p_advancements: player.advancements || [],
            }
          );

          if (error) {
            console.warn(
              '[Minecraft Sync] Advancement RPC warning:',
              error.message
            );

            warning ||= `Advancement sync skipped for ${player.username}.`;
          } else if (typeof data === 'number') {
            advancementCount = data;
          }
        } catch (error) {
          console.warn(
            '[Minecraft Sync] Advancement exception:',
            error
          );

          warning ||= `Advancement sync skipped for ${player.username}.`;
        }

        return {
          participationOk,
          advancementCount,
          warning,
        };
      })
    );

    for (const result of results) {
      if (result.participationOk) {
        participationSyncedCount += 1;
      }

      advancementSyncedCount +=
        result.advancementCount || 0;

      if (result.warning) {
        syncWarnings.push(result.warning);
      }
    }
  };

  if (
    activeSeasonBeforeFinalization &&
    players.length > 0
  ) {
    await syncPlayersIntoSeason(
      activeSeasonBeforeFinalization.id
    );

    /* ---------------------------------------------------------
     * BASELINES ARE CREATED AFTER THE PLAYER'S CURRENT DATA AND
     * SEASON PARTICIPATION HAVE BOTH BEEN WRITTEN.
     *
     * This is intentional:
     *   - New season + server reset before first sync -> baseline
     *     becomes the reset value.
     *   - New season + no server reset -> current value is synced,
     *     and delta starts from that first observed value.
     *   - Existing baselines are never overwritten.
     * --------------------------------------------------------- */

    const {
      error: baselineError,
    } = await supabase.rpc(
      'initialize_active_season_baselines',
      {
        p_server_id: serverId,
      }
    );

    if (baselineError) {
      console.warn(
        '[Minecraft Sync] Baseline initialization warning:',
        baselineError.message
      );

      syncWarnings.push(
        `Season baseline initialization warning: ${baselineError.message}`
      );
    }
  }

  /* =========================================================
   * ACTIVE-SEASON LEADERBOARD SYNC
   * ========================================================= */

  if (activeSeasonBeforeFinalization) {
    const {
      data: syncResult,
      error: syncError,
    } = await supabase.rpc(
      'sync_active_season_leaderboard',
      {
        p_server_id: serverId,
      }
    );

    if (syncError) {
      console.warn(
        '[Minecraft Sync] Leaderboard sync warning:',
        syncError.message
      );

      syncWarnings.push(
        `Leaderboard sync warning: ${syncError.message}`
      );
    } else if (typeof syncResult === 'number') {
      leaderboardSyncedCount = syncResult;
    }
  }

  /* =========================================================
   * FINALIZE EXPIRED SEASONS
   * ========================================================= */

  const {
    data: finalizedSeasonCount,
    error: finalizeError,
  } = await supabase.rpc(
    'finalize_expired_seasons',
    {
      p_server_id: serverId,
    }
  );

  if (finalizeError) {
    console.error(
      '[Minecraft Sync] Season finalization error:',
      finalizeError
    );

    return sendJson(res, 500, {
      success: false,
      message:
        'Player data synced, but season finalization failed.',
      warnings: syncWarnings.slice(0, 25),
    });
  }

  /* =========================================================
   * CHECK ACTIVE SEASON AGAIN
   * ========================================================= */

  let activeSeason: ActiveSeason | null = null;

  try {
    activeSeason = await getActiveSeason();
  } catch (error) {
    console.error(
      '[Minecraft Sync] Active season re-check error:',
      error
    );

    return sendJson(res, 500, {
      success: false,
      message: 'Failed to re-check active season.',
      warnings: syncWarnings.slice(0, 25),
    });
  }

  const previousActiveSeasonId =
    activeSeasonBeforeFinalization?.id ?? null;

  const seasonChanged =
    activeSeason?.id != null &&
    activeSeason.id !== previousActiveSeasonId;

  /* =========================================================
   * NEW ACTIVE SEASON IMMEDIATE SYNC
   * =========================================================
   *
   * When a season is completed/expired and another season is
   * already active, the currently online players are immediately
   * recorded into the new season. No wait for the next periodic
   * sync is necessary.
   *
   * The same logic is also useful when the server request started
   * while there was no active season and one becomes active during
   * the same request.
   * ========================================================= */

  if (
    activeSeason?.id != null &&
    (seasonChanged || !activeSeasonBeforeFinalization) &&
    players.length > 0
  ) {
    await syncPlayersIntoSeason(
      activeSeason.id
    );

    /* First observation in the new season establishes the baseline. */
    const {
      error: newSeasonBaselineError,
    } = await supabase.rpc(
      'initialize_active_season_baselines',
      {
        p_server_id: serverId,
      }
    );

    if (newSeasonBaselineError) {
      console.warn(
        '[Minecraft Sync] New-season baseline warning:',
        newSeasonBaselineError.message
      );

      syncWarnings.push(
        `New-season baseline warning: ${newSeasonBaselineError.message}`
      );
    }

    const {
      data: newSeasonSyncResult,
      error: newSeasonSyncError,
    } = await supabase.rpc(
      'sync_active_season_leaderboard',
      {
        p_server_id: serverId,
      }
    );

    if (newSeasonSyncError) {
      console.warn(
        '[Minecraft Sync] New-season leaderboard sync warning:',
        newSeasonSyncError.message
      );

      syncWarnings.push(
        `New-season leaderboard sync warning: ${newSeasonSyncError.message}`
      );
    } else if (typeof newSeasonSyncResult === 'number') {
      leaderboardSyncedCount +=
        newSeasonSyncResult;
    }
  }

  /* =========================================================
   * HEARTBEAT
   * ========================================================= */

  const { error: heartbeatError } =
    await supabase
      .from('leaderboard_sync_state')
      .upsert(
        {
          server_id: serverId,
          bridge_version:
            cleanText(
              body.bridgeVersion,
              32
            ) || 'unknown',
          active_season_id:
            activeSeason?.id || null,
          last_success_at: now,
          updated_at: now,
        },
        {
          onConflict: 'server_id',
        }
      );

  if (heartbeatError) {
    console.warn(
      '[Minecraft Sync] Heartbeat warning:',
      heartbeatError.message
    );
  }

  /* =========================================================
   * RESPONSE
   * ========================================================= */

  return sendJson(res, 200, {
    success: true,
    syncType,
    syncedPlayers: players.length,
    participationSyncedCount,
    advancementSyncedCount,
    leaderboardSyncedCount,
    finalizedSeasonCount:
      typeof finalizedSeasonCount === 'number'
        ? finalizedSeasonCount
        : 0,
    activeSeason: activeSeason
      ? {
          id: activeSeason.id,
          seasonNumber: activeSeason.season_number,
          name: activeSeason.name,
          slug: activeSeason.slug,
          status: activeSeason.status,
        }
      : null,
    previousActiveSeasonId,
    bridgeVersion:
      cleanText(
        body.bridgeVersion,
        32
      ) || 'unknown',
    syncedAt: now,
    warnings: syncWarnings.slice(0, 25),
  });
}
