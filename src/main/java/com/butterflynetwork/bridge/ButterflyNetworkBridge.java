package com.butterflynetwork.bridge;

import ch.njol.skript.variables.Variables;

import io.papermc.paper.advancement.AdvancementDisplay;
import net.luckperms.api.LuckPerms;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.World;
import org.bukkit.advancement.Advancement;
import org.bukkit.attribute.Attribute;
import org.bukkit.entity.Player;
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.Team;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

import org.bukkit.persistence.PersistentDataContainer;
import org.bukkit.persistence.PersistentDataType;

import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;

import java.io.IOException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import java.time.Duration;
import java.time.Instant;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

public final class ButterflyNetworkBridge
        extends JavaPlugin
        implements Listener {

    private HttpClient httpClient;
    private BukkitTask syncTask;

    private String serverId;
    private String apiUrl;
    private String apiKey;
    private String bridgeVersion;
    private int intervalSeconds;
    private boolean syncOnJoin;
    private boolean syncOnLeave;
    private int playersPerTick;
    private boolean logSnapshotDetails;

    private LuckPerms luckPerms;
    private final PlainTextComponentSerializer plainTextSerializer =
            PlainTextComponentSerializer.plainText();

    private final Set<String> lifestealWorlds =
            new HashSet<>();

    private final Map<UUID, Long> sessionStartMillis =
            new HashMap<>();

    private final List<CachedAdvancement> cachedAdvancements =
            new ArrayList<>();

    private final AtomicBoolean periodicSyncInProgress =
            new AtomicBoolean(false);

    private BukkitTask activePeriodicSnapshotTask;

    private NamespacedKey playtimeKey;
    private NamespacedKey blocksBrokenKey;
    private NamespacedKey blocksPlacedKey;
    private NamespacedKey playtimeInitializedKey;

    @Override
    public void onEnable() {

        saveDefaultConfig();

        loadConfiguration();
        loadLuckPerms();

        initializePersistentKeys();
        refreshAdvancementCache();

        Bukkit.getScheduler().runTaskLater(
                this,
                this::refreshAdvancementCache,
                20L
        );

        Bukkit.getPluginManager()
                .registerEvents(this, this);

        httpClient =
                HttpClient.newBuilder()
                        .connectTimeout(
                                Duration.ofSeconds(10)
                        )
                        .build();

        getLogger().info(
                "=============================================="
        );

        getLogger().info(
                " Butterfly Network Bridge"
        );

        getLogger().info(
                " Version: " + bridgeVersion
        );

        getLogger().info(
                " Server ID: " + serverId
        );

        getLogger().info(
                " Paper: " + Bukkit.getMinecraftVersion()
        );

        getLogger().info(
                " Java: " + System.getProperty("java.version")
        );

        getLogger().info(
                " Sync interval: "
                        + intervalSeconds
                        + " seconds"
        );

        getLogger().info(
                " Sync on join: "
                        + syncOnJoin
                        + " | Sync on leave: "
                        + syncOnLeave
                        + " | Players/tick: "
                        + playersPerTick
        );

        getLogger().info(
                " Cached advancements: "
                        + cachedAdvancements.size()
        );

        getLogger().info(
                " Lifesteal worlds: "
                        + lifestealWorlds
        );

        getLogger().info(
                "=============================================="
        );

        if (
                apiKey == null
                        || apiKey.isBlank()
        ) {

            getLogger().warning(
                    "Minecraft API key is empty."
            );

            getLogger().warning(
                    "Bridge will not start until api.api-key is configured."
            );

            return;
        }

        for (
                Player player
                : Bukkit.getOnlinePlayers()
        ) {

            initializePlayerTracking(
                    player
            );
        }

        startSyncTask();

        getLogger().info(
                "Bridge enabled successfully."
        );
    }

    @Override
    public void onDisable() {

        if (syncTask != null) {

            syncTask.cancel();

            syncTask = null;
        }

        if (activePeriodicSnapshotTask != null) {

            activePeriodicSnapshotTask.cancel();

            activePeriodicSnapshotTask = null;
        }

        periodicSyncInProgress.set(false);

        for (
                Player player
                : Bukkit.getOnlinePlayers()
        ) {

            flushPlaytime(
                    player
            );
        }

        getLogger().info(
                "Butterfly Network Bridge disabled."
        );
    }

    private void loadLuckPerms() {

        try {

            var registration =
                    getServer()
                            .getServicesManager()
                            .getRegistration(
                                    LuckPerms.class
                            );

            luckPerms =
                    registration != null
                            ? registration.getProvider()
                            : null;

            if (luckPerms == null) {

                getLogger().warning(
                        "LuckPerms not found. Seasonal rank sync will be skipped."
                );

            }

        } catch (Exception exception) {

            luckPerms = null;

            getLogger().warning(
                    "Could not hook LuckPerms: "
                            + exception.getMessage()
            );
        }
    }

    private void initializePersistentKeys() {

        playtimeKey =
                new NamespacedKey(
                        this,
                        "playtime_seconds"
                );

        blocksBrokenKey =
                new NamespacedKey(
                        this,
                        "blocks_broken"
                );

        blocksPlacedKey =
                new NamespacedKey(
                        this,
                        "blocks_placed"
                );

        playtimeInitializedKey =
                new NamespacedKey(
                        this,
                        "playtime_initialized"
                );
    }

    private void loadConfiguration() {

        serverId =
                getConfig()
                        .getString(
                                "server-id",
                                "main"
                        )
                        .trim();

        apiUrl =
                getConfig()
                        .getString(
                                "api.url",
                                "https://butterfly-network.vercel.app/api/minecraft-sync"
                        )
                        .trim();

        apiKey =
                getConfig()
                        .getString(
                                "api.api-key",
                                ""
                        )
                        .trim();

        bridgeVersion =
                getConfig()
                        .getString(
                                "bridge.version",
                                "1.1.0"
                        )
                        .trim();

        intervalSeconds =
                Math.max(
                        30,
                        getConfig()
                                .getInt(
                                        "api.interval-seconds",
                                        60
                                )
                );

        syncOnJoin =
                getConfig().getBoolean(
                        "bridge.sync-on-join",
                        true
                );

        syncOnLeave =
                getConfig().getBoolean(
                        "bridge.sync-on-leave",
                        true
                );

        playersPerTick =
                Math.max(
                        1,
                        Math.min(
                                10,
                                getConfig().getInt(
                                        "bridge.players-per-tick",
                                        1
                                )
                        )
                );

        logSnapshotDetails =
                getConfig().getBoolean(
                        "logging.snapshot-details",
                        false
                );

        lifestealWorlds.clear();

        for (
                String worldName
                : getConfig()
                        .getStringList(
                                "bridge.lifesteal-worlds"
                        )
        ) {

            if (
                    worldName != null
                            && !worldName.isBlank()
            ) {

                lifestealWorlds.add(
                        worldName.trim()
                );
            }
        }
    }

    private void startSyncTask() {

        long intervalTicks =
                intervalSeconds * 20L;

        syncTask =
                Bukkit.getScheduler()
                        .runTaskTimer(
                                this,
                                this::startPeriodicSnapshot,
                                40L,
                                intervalTicks
                        );
    }

    private void startPeriodicSnapshot() {

        if (!periodicSyncInProgress.compareAndSet(false, true)) {

            logSuccess(
                    "Skipping periodic sync because the previous snapshot is still in progress."
            );

            return;
        }

        List<UUID> onlinePlayerIds =
                new ArrayList<>();

        for (Player player : Bukkit.getOnlinePlayers()) {
            onlinePlayerIds.add(
                    player.getUniqueId()
            );
        }

        if (onlinePlayerIds.isEmpty()) {

            periodicSyncInProgress.set(false);

            logSuccess(
                    "No online players; periodic player sync skipped. Season maintenance heartbeat will be sent."
            );

            sendHeartbeat();
            return;
        }

        List<Map<String, Object>> snapshots =
                new ArrayList<>();

        activePeriodicSnapshotTask =
                Bukkit.getScheduler().runTaskTimer(
                        this,
                        new Runnable() {

                            private int index = 0;

                            @Override
                            public void run() {

                                int processed = 0;

                                while (
                                        index < onlinePlayerIds.size()
                                                && processed < playersPerTick
                                ) {

                                    UUID uuid =
                                            onlinePlayerIds.get(index++);

                                    Player player =
                                            Bukkit.getPlayer(uuid);

                                    if (player != null && player.isOnline()) {

                                        Map<String, Object> snapshot =
                                                createPlayerSnapshot(
                                                        player,
                                                        true,
                                                        true
                                                );

                                        if (snapshot != null) {
                                            snapshots.add(snapshot);
                                        }
                                    }

                                    processed++;
                                }

                                if (index >= onlinePlayerIds.size()) {

                                    if (activePeriodicSnapshotTask != null) {
                                        activePeriodicSnapshotTask.cancel();
                                        activePeriodicSnapshotTask = null;
                                    }

                                    periodicSyncInProgress.set(false);

                                    if (snapshots.isEmpty()) {
                                        sendHeartbeat();
                                        return;
                                    }

                                    sendSnapshot(
                                            createPayload(
                                                    snapshots,
                                                    "periodic"
                                            ),
                                            snapshots.size()
                                    );
                                }
                            }
                        },
                        1L,
                        1L
                );
    }

    private Map<String, Object> createPayload(
            List<Map<String, Object>> players,
            String syncType
    ) {

        Map<String, Object> payload =
                new LinkedHashMap<>();

        payload.put(
                "serverId",
                serverId
        );

        payload.put(
                "bridgeVersion",
                bridgeVersion
        );

        payload.put(
                "sentAt",
                Instant.now().toString()
        );

        payload.put(
                "syncType",
                syncType
        );

        payload.put(
                "players",
                players
        );

        return payload;
    }

    private void sendHeartbeat() {

        sendSnapshot(
                createPayload(
                        List.of(),
                        "heartbeat"
                ),
                0
        );
    }

    @EventHandler
    public void onPlayerJoin(
            PlayerJoinEvent event
    ) {

        Player player =
                event.getPlayer();

        initializePlayerTracking(
                player
        );

        if (
                syncOnJoin
                        && apiKey != null
                        && !apiKey.isBlank()
        ) {
            Bukkit.getScheduler().runTaskLater(
                    this,
                    () -> {
                        if (player.isOnline()) {
                            collectAndSendSnapshotForPlayer(
                                    player,
                                    true
                            );
                        }
                    },
                    40L
            );
        }
    }

    @EventHandler
    public void onPlayerQuit(
            PlayerQuitEvent event
    ) {

        Player player =
                event.getPlayer();

        flushPlaytime(
                player
        );

        if (
                syncOnLeave
                        && apiKey != null
                        && !apiKey.isBlank()
        ) {
            Map<String, Object> snapshot =
                    createPlayerSnapshot(
                            player,
                            false,
                            false
                    );

            if (snapshot != null) {
                sendSnapshot(
                        createPayload(
                                List.of(snapshot),
                                "leave"
                        ),
                        1
                );
            }
        }

        sessionStartMillis.remove(
                player.getUniqueId()
        );
    }

    @EventHandler
    public void onBlockBreak(
            BlockBreakEvent event
    ) {

        if (event.isCancelled()) {
            return;
        }

        Player player =
                event.getPlayer();

        incrementPersistentCounter(
                player,
                blocksBrokenKey,
                1L
        );
    }

    @EventHandler
    public void onBlockPlace(
            BlockPlaceEvent event
    ) {

        if (event.isCancelled()) {
            return;
        }

        Player player =
                event.getPlayer();

        incrementPersistentCounter(
                player,
                blocksPlacedKey,
                1L
        );
    }

    private void initializePlayerTracking(
            Player player
    ) {

        UUID uuid =
                player.getUniqueId();

        sessionStartMillis.put(
                uuid,
                System.currentTimeMillis()
        );

        PersistentDataContainer pdc =
                player.getPersistentDataContainer();

        if (
                !pdc.has(
                        playtimeInitializedKey,
                        PersistentDataType.BYTE
                )
        ) {

            long vanillaPlaytime =
                    readVanillaPlaytimeSeconds(
                            player
                    );

            pdc.set(
                    playtimeKey,
                    PersistentDataType.LONG,
                    Math.max(
                            0L,
                            vanillaPlaytime
                    )
            );

            pdc.set(
                    playtimeInitializedKey,
                    PersistentDataType.BYTE,
                    (byte) 1
            );
        }

        if (
                !pdc.has(
                        blocksBrokenKey,
                        PersistentDataType.LONG
                )
        ) {

            pdc.set(
                    blocksBrokenKey,
                    PersistentDataType.LONG,
                    0L
            );
        }

        if (
                !pdc.has(
                        blocksPlacedKey,
                        PersistentDataType.LONG
                )
        ) {

            pdc.set(
                    blocksPlacedKey,
                    PersistentDataType.LONG,
                    0L
            );
        }
    }

    private void flushPlaytime(
            Player player
    ) {

        UUID uuid =
                player.getUniqueId();

        long startedAt =
                sessionStartMillis.getOrDefault(
                        uuid,
                        System.currentTimeMillis()
                );

        long now =
                System.currentTimeMillis();

        long elapsedSeconds =
                Math.max(
                        0L,
                        (now - startedAt) / 1000L
                );

        if (elapsedSeconds <= 0) {
            return;
        }

        PersistentDataContainer pdc =
                player.getPersistentDataContainer();

        long current =
                getPersistentLong(
                        pdc,
                        playtimeKey
                );

        pdc.set(
                playtimeKey,
                PersistentDataType.LONG,
                current + elapsedSeconds
        );

        sessionStartMillis.put(
                uuid,
                now
        );
    }

    private long readPlaytimeSeconds(
            Player player
    ) {

        flushPlaytime(
                player
        );

        return getPersistentLong(
                player.getPersistentDataContainer(),
                playtimeKey
        );
    }

    private long readVanillaPlaytimeSeconds(
            Player player
    ) {

        try {

            long ticks =
                    player.getStatistic(
                            org.bukkit.Statistic.PLAY_ONE_MINUTE
                    );

            return Math.max(
                    0L,
                    ticks / 20L
            );

        } catch (Exception exception) {

            return 0L;
        }
    }

    private void incrementPersistentCounter(
            Player player,
            NamespacedKey key,
            long amount
    ) {

        PersistentDataContainer pdc =
                player.getPersistentDataContainer();

        long current =
                getPersistentLong(
                        pdc,
                        key
                );

        pdc.set(
                key,
                PersistentDataType.LONG,
                current + Math.max(
                        0L,
                        amount
                )
        );
    }

    private long getPersistentLong(
            PersistentDataContainer pdc,
            NamespacedKey key
    ) {

        Long value =
                pdc.get(
                        key,
                        PersistentDataType.LONG
                );

        if (value == null) {
            return 0L;
        }

        return Math.max(
                0L,
                value
        );
    }

    private void collectAndSendSnapshot() {
        startPeriodicSnapshot();
    }

    private void collectAndSendSnapshotForPlayer(
            Player player,
            boolean includeAdvancements
    ) {

        if (player == null || !player.isOnline()) {
            return;
        }

        Map<String, Object> snapshot =
                createPlayerSnapshot(
                        player,
                        true,
                        includeAdvancements
                );

        if (snapshot == null) {
            return;
        }

        sendSnapshot(
                createPayload(
                        List.of(snapshot),
                        "join"
                ),
                1
        );
    }

    private Map<String, Object> createPlayerSnapshot(
            Player player
    ) {

        return createPlayerSnapshot(
                player,
                true,
                true
        );
    }

    private Map<String, Object> createPlayerSnapshot(
            Player player,
            boolean online,
            boolean includeAdvancements
    ) {

        UUID uuid =
                player.getUniqueId();

        String uuidString =
                uuid.toString();

        boolean lifestealWorld =
                isLifestealWorld(
                        player.getWorld()
                );

        double hearts = 10.0;

        if (lifestealWorld) {

            hearts =
                    readLifestealVariable(
                            "lifesteal::player::"
                                    + uuidString
                                    + "::hearts",
                            readMaximumHealthFallback(
                                    player
                            )
                    );
        }

        long kills =
                readLifestealVariable(
                        "lifesteal::player::"
                                + uuidString
                                + "::kills",
                        0
                );

        long deaths =
                readLifestealVariable(
                        "lifesteal::player::"
                                + uuidString
                                + "::deaths",
                        0
                );

        long killStreak =
                readLifestealVariable(
                        "lifesteal::player::"
                                + uuidString
                                + "::streak",
                        0
                );

        long wins =
                readLifestealVariable(
                        "lifesteal::player::"
                                + uuidString
                                + "::wins",
                        0
                );

        double money =
                readVaultBalance(
                        player
                );

        long playtimeSeconds =
                readPlaytimeSeconds(
                        player
                );

        long blocksBroken =
                getPersistentLong(
                        player.getPersistentDataContainer(),
                        blocksBrokenKey
                );

        long blocksPlaced =
                getPersistentLong(
                        player.getPersistentDataContainer(),
                        blocksPlacedKey
                );

        int playerKills =
                safeGetStatistic(
                        player,
                        org.bukkit.Statistic.PLAYER_KILLS
                );

        int mobKills =
                safeGetStatistic(
                        player,
                        org.bukkit.Statistic.MOB_KILLS
                );

        int jumps =
                safeGetStatistic(
                        player,
                        org.bukkit.Statistic.JUMP
                );

        int damageDealt =
                safeGetStatistic(
                        player,
                        org.bukkit.Statistic.DAMAGE_DEALT
                );

        int damageTaken =
                safeGetStatistic(
                        player,
                        org.bukkit.Statistic.DAMAGE_TAKEN
                );

        long distanceWalked =
                centimetersToBlocks(
                        safeGetStatisticLong(
                                player,
                                org.bukkit.Statistic.WALK_ONE_CM
                        )
                );

        long distanceRun =
                centimetersToBlocks(
                        safeGetStatisticLong(
                                player,
                                org.bukkit.Statistic.SPRINT_ONE_CM
                        )
                );

        long distanceFlown =
                centimetersToBlocks(
                        safeGetStatisticLong(
                                player,
                                org.bukkit.Statistic.FLY_ONE_CM
                        )
                );

        Map<String, Object> statistics =
                new LinkedHashMap<>();

        /*
         * Keep the real Minecraft statistic meaning:
         * PLAY_ONE_MINUTE is stored in ticks.
         */
        statistics.put(
                "minecraft:play_one_minute",
                playtimeSeconds * 20L
        );

        statistics.put(
                "minecraft:player_kills",
                Math.max(
                        0,
                        playerKills
                )
        );

        statistics.put(
                "minecraft:mob_kills",
                Math.max(
                        0,
                        mobKills
                )
        );

        statistics.put(
                "minecraft:jumps",
                Math.max(
                        0,
                        jumps
                )
        );

        statistics.put(
                "minecraft:walk_one_cm",
                safeGetStatisticLong(
                        player,
                        org.bukkit.Statistic.WALK_ONE_CM
                )
        );

        statistics.put(
                "minecraft:sprint_one_cm",
                safeGetStatisticLong(
                        player,
                        org.bukkit.Statistic.SPRINT_ONE_CM
                )
        );

        statistics.put(
                "minecraft:fly_one_cm",
                safeGetStatisticLong(
                        player,
                        org.bukkit.Statistic.FLY_ONE_CM
                )
        );

        statistics.put(
                "minecraft:walk_on_water_one_cm",
                safeGetStatisticLong(
                        player,
                        org.bukkit.Statistic.WALK_ON_WATER_ONE_CM
                )
        );

        statistics.put(
                "minecraft:walk_under_water_one_cm",
                safeGetStatisticLong(
                        player,
                        org.bukkit.Statistic.WALK_UNDER_WATER_ONE_CM
                )
        );

        statistics.put(
                "minecraft:climb_one_cm",
                safeGetStatisticLong(
                        player,
                        org.bukkit.Statistic.CLIMB_ONE_CM
                )
        );

        statistics.put(
                "minecraft:damage_dealt",
                Math.max(
                        0,
                        damageDealt
                )
        );

        statistics.put(
                "minecraft:damage_taken",
                Math.max(
                        0,
                        damageTaken
                )
        );

        String rankName =
                getLuckPermsRankName(player);

        String teamName =
                getScoreboardTeamName(player);

        List<Map<String, Object>> advancements =
                includeAdvancements
                        ? collectAdvancements(player)
                        : List.of();

        Map<String, Object> snapshot =
                new LinkedHashMap<>();

        snapshot.put(
                "uuid",
                uuidString
        );

        snapshot.put(
                "username",
                player.getName()
        );

        snapshot.put(
                "online",
                online
        );

        snapshot.put(
                "rankName",
                rankName
        );

        snapshot.put(
                "teamName",
                teamName
        );

        snapshot.put(
                "advancements",
                advancements
        );

        snapshot.put(
                "hearts",
                Math.max(
                        0,
                        hearts
                )
        );

        snapshot.put(
                "kills",
                Math.max(
                        0,
                        kills
                )
        );

        snapshot.put(
                "deaths",
                Math.max(
                        0,
                        deaths
                )
        );

        snapshot.put(
                "money",
                Math.max(
                        0,
                        money
                )
        );

        snapshot.put(
                "playtimeSeconds",
                Math.max(
                        0L,
                        playtimeSeconds
                )
        );

        snapshot.put(
                "wins",
                Math.max(
                        0L,
                        wins
                )
        );

        snapshot.put(
                "killStreak",
                Math.max(
                        0L,
                        killStreak
                )
        );

        snapshot.put(
                "blocksBroken",
                Math.max(
                        0L,
                        blocksBroken
                )
        );

        snapshot.put(
                "blocksPlaced",
                Math.max(
                        0L,
                        blocksPlaced
                )
        );

        snapshot.put(
                "itemsCrafted",
                0L
        );

        snapshot.put(
                "itemsUsed",
                0L
        );

        snapshot.put(
                "mobsKilled",
                Math.max(
                        0,
                        mobKills
                )
        );

        snapshot.put(
                "playersKilled",
                Math.max(
                        0,
                        playerKills
                )
        );

        snapshot.put(
                "distanceWalked",
                Math.max(
                        0L,
                        distanceWalked
                )
        );

        snapshot.put(
                "distanceRun",
                Math.max(
                        0L,
                        distanceRun
                )
        );

        snapshot.put(
                "distanceFlown",
                Math.max(
                        0L,
                        distanceFlown
                )
        );

        snapshot.put(
                "damageDealt",
                Math.max(
                        0,
                        damageDealt
                )
        );

        snapshot.put(
                "damageTaken",
                Math.max(
                        0,
                        damageTaken
                )
        );

        snapshot.put(
                "jumps",
                Math.max(
                        0,
                        jumps
                )
        );

        snapshot.put(
                "statistics",
                statistics
        );

        if (logSnapshotDetails) {
            getLogger().info(
                    "[Snapshot] "
                            + player.getName()
                            + " | Playtime="
                            + playtimeSeconds
                            + "s"
                            + " | Walk="
                            + distanceWalked
                            + " blocks"
                            + " | Run="
                            + distanceRun
                            + " blocks"
                            + " | Fly="
                            + distanceFlown
                            + " blocks"
                            + " | BlocksBroken="
                            + blocksBroken
                            + " | BlocksPlaced="
                            + blocksPlaced
                            + " | Money="
                            + money
                            + " | Hearts="
                            + hearts
                            + " | Kills="
                            + kills
            );
        }

        return snapshot;
    }

    private String getLuckPermsRankName(
            Player player
    ) {

        if (luckPerms == null || player == null) {
            return "";
        }

        try {

            var user =
                    luckPerms
                            .getUserManager()
                            .getUser(
                                    player.getUniqueId()
                            );

            if (user == null) {
                return "";
            }

            String group =
                    user.getPrimaryGroup();

            if (group == null || group.isBlank()) {
                return "";
            }

            if (group.equalsIgnoreCase("default")) {
                return "";
            }

            return group.trim();

        } catch (Exception exception) {

            logError(
                    "Could not read LuckPerms rank for "
                            + player.getName()
                            + ": "
                            + exception.getMessage()
            );

            return "";
        }
    }

    private String getScoreboardTeamName(
            Player player
    ) {

        if (player == null) {
            return "";
        }

        try {

            Team team = null;

            Scoreboard playerScoreboard =
                    player.getScoreboard();

            if (playerScoreboard != null) {
                team =
                        playerScoreboard.getEntryTeam(
                                player.getName()
                        );
            }

            if (team == null) {
                Scoreboard mainScoreboard =
                        Bukkit.getScoreboardManager()
                                != null
                                ? Bukkit.getScoreboardManager()
                                        .getMainScoreboard()
                                : null;

                if (mainScoreboard != null) {
                    team =
                            mainScoreboard.getEntryTeam(
                                    player.getName()
                            );
                }
            }

            if (team == null) {
                return "";
            }

            return team.getName().trim();

        } catch (Exception exception) {

            logError(
                    "Could not read scoreboard team for "
                            + player.getName()
                            + ": "
                            + exception.getMessage()
            );

            return "";
        }
    }

    private static final class CachedAdvancement {

        private final String key;
        private final String title;
        private final String description;
        private final String iconMaterial;
        private final Advancement advancement;

        private CachedAdvancement(
                String key,
                String title,
                String description,
                String iconMaterial,
                Advancement advancement
        ) {
            this.key = key;
            this.title = title;
            this.description = description;
            this.iconMaterial = iconMaterial;
            this.advancement = advancement;
        }
    }

    private void refreshAdvancementCache() {

        List<CachedAdvancement> refreshed =
                new ArrayList<>();

        try {
            var iterator =
                    Bukkit.advancementIterator();

            while (iterator.hasNext()) {

                Advancement advancement =
                        iterator.next();

                AdvancementDisplay display =
                        advancement.getDisplay();

                if (display == null) {
                    continue;
                }

                String key =
                        advancement.getKey().toString();

                String title =
                        plainTextSerializer.serialize(
                                display.title()
                        );

                String description =
                        plainTextSerializer.serialize(
                                display.description()
                        );

                String iconMaterial =
                        display.icon() != null
                                ? display.icon()
                                        .getType()
                                        .getKey()
                                        .toString()
                                : "";

                refreshed.add(
                        new CachedAdvancement(
                                key,
                                title,
                                description,
                                iconMaterial,
                                advancement
                        )
                );
            }

            refreshed.sort(
                    (a, b) ->
                            a.key.compareToIgnoreCase(
                                    b.key
                            )
            );

            cachedAdvancements.clear();
            cachedAdvancements.addAll(refreshed);

        } catch (Exception exception) {
            logError(
                    "Could not refresh advancement cache: "
                            + exception.getMessage()
            );
        }
    }

    private List<Map<String, Object>> collectAdvancements(
            Player player
    ) {

        List<Map<String, Object>> result =
                new ArrayList<>();

        if (player == null) {
            return result;
        }

        try {

            for (CachedAdvancement advancement : cachedAdvancements) {

                if (advancement.advancement == null) {
                    continue;
                }

                boolean completed =
                        player.getAdvancementProgress(
                                advancement.advancement
                        ).isDone();

                Map<String, Object> row =
                        new LinkedHashMap<>();

                row.put(
                        "key",
                        advancement.key
                );

                row.put(
                        "title",
                        advancement.title
                );

                row.put(
                        "description",
                        advancement.description
                );

                row.put(
                        "iconMaterial",
                        advancement.iconMaterial
                );

                row.put(
                        "completed",
                        completed
                );

                row.put(
                        "completedAt",
                        null
                );

                result.add(row);
            }

        } catch (Exception exception) {

            logError(
                    "Could not collect advancements for "
                            + player.getName()
                            + ": "
                            + exception.getMessage()
            );
        }

        return result;
    }

    private boolean isLifestealWorld(
            World world
    ) {

        if (world == null) {
            return false;
        }

        return lifestealWorlds.contains(
                world.getName()
        );
    }

    private double readMaximumHealthFallback(
            Player player
    ) {

        try {

            var attribute =
                    player.getAttribute(
                            Attribute.MAX_HEALTH
                    );

            if (attribute == null) {
                return 10.0;
            }

            return Math.max(
                    0,
                    attribute.getValue()
            );

        } catch (Exception ignored) {

            return 10.0;
        }
    }

    private long readLifestealVariable(
            String variableName,
            long fallback
    ) {

        Object value =
                Variables.getVariable(
                        variableName,
                        null,
                        false
                );

        if (value instanceof Number number) {

            return Math.max(
                    0L,
                    number.longValue()
            );
        }

        return fallback;
    }

    private double readLifestealVariable(
            String variableName,
            double fallback
    ) {

        Object value =
                Variables.getVariable(
                        variableName,
                        null,
                        false
                );

        if (value instanceof Number number) {

            return Math.max(
                    0D,
                    number.doubleValue()
            );
        }

        return fallback;
    }

    private double readVaultBalance(
            Player player
    ) {

        if (
                Bukkit.getPluginManager()
                        .getPlugin("Vault")
                        == null
        ) {

            return 0;
        }

        try {

            var registration =
                    getServer()
                            .getServicesManager()
                            .getRegistration(
                                    net.milkbowl.vault.economy.Economy.class
                            );

            if (registration == null) {
                return 0;
            }

            var economy =
                    registration.getProvider();

            if (economy == null) {
                return 0;
            }

            return Math.max(
                    0,
                    economy.getBalance(
                            player
                    )
            );

        } catch (Exception exception) {

            getLogger().warning(
                    "Could not read Vault balance for "
                            + player.getName()
                            + ": "
                            + exception.getMessage()
            );

            return 0;
        }
    }

    private int safeGetStatistic(
            Player player,
            org.bukkit.Statistic statistic
    ) {

        try {

            return Math.max(
                    0,
                    player.getStatistic(
                            statistic
                    )
            );

        } catch (Exception ignored) {

            return 0;
        }
    }

    private long safeGetStatisticLong(
            Player player,
            org.bukkit.Statistic statistic
    ) {

        try {

            return Math.max(
                    0L,
                    player.getStatistic(
                            statistic
                    )
            );

        } catch (Exception ignored) {

            return 0L;
        }
    }

    private long centimetersToBlocks(
            long centimeters
    ) {

        if (centimeters <= 0) {
            return 0L;
        }

        return centimeters / 100L;
    }

    private void sendSnapshot(
            Map<String, Object> payload,
            int playerCount
    ) {

        CompletableFuture
                .supplyAsync(
                        () -> {

                            String json;

                            try {
                                json = toJson(payload);
                            } catch (Exception exception) {
                                throw new IllegalStateException(
                                        "Could not serialize snapshot: "
                                                + exception.getMessage(),
                                        exception
                                );
                            }

                            return HttpRequest.newBuilder()
                                    .uri(
                                            URI.create(
                                                    apiUrl
                                            )
                                    )
                        .timeout(
                                Duration.ofSeconds(20)
                        )
                        .header(
                                "Content-Type",
                                "application/json"
                        )
                        .header(
                                "Accept",
                                "application/json"
                        )
                        .header(
                                "X-API-Key",
                                apiKey
                        )
                                    .POST(
                                            HttpRequest.BodyPublishers
                                                    .ofString(
                                                            json
                                                    )
                                    )
                                    .build();
                        }
                )
                .thenCompose(
                        request ->
                                CompletableFuture.supplyAsync(
                                        () -> {

                                            try {
                                                return httpClient.send(
                                                        request,
                                                        HttpResponse.BodyHandlers
                                                                .ofString()
                                                );
                                            } catch (
                                                    IOException |
                                                    InterruptedException exception
                                            ) {
                                                if (exception instanceof InterruptedException) {
                                                    Thread.currentThread().interrupt();
                                                }

                                                throw new RuntimeException(
                                                        exception
                                                );
                                            }
                                        }
                                )
                )
                .thenAccept(
                        response -> {

                            if (
                                    response.statusCode() >= 200
                                            && response.statusCode() < 300
                            ) {

                                logSuccess(
                                        "Synced "
                                                + playerCount
                                                + " player(s) to website. HTTP "
                                                + response.statusCode()
                                );

                            } else {

                                logError(
                                        "Website sync failed. HTTP "
                                                + response.statusCode()
                                                + " Response: "
                                                + response.body()
                                );
                            }
                        }
                )
                .exceptionally(
                        exception -> {

                            logError(
                                    "Website sync request failed: "
                                            + exception.getMessage()
                            );

                            return null;
                        }
                );
    }

    private String toJson(
            Object value
    ) {

        if (value == null) {
            return "null";
        }

        if (value instanceof String string) {

            return "\""
                    + escapeJson(
                            string
                    )
                    + "\"";
        }

        if (
                value instanceof Number
                        || value instanceof Boolean
        ) {

            return String.valueOf(
                    value
            );
        }

        if (value instanceof Map<?, ?> map) {

            StringBuilder builder =
                    new StringBuilder();

            builder.append("{");

            boolean first = true;

            for (
                    Map.Entry<?, ?> entry
                    : map.entrySet()
            ) {

                if (!first) {
                    builder.append(",");
                }

                first = false;

                builder
                        .append("\"")
                        .append(
                                escapeJson(
                                        String.valueOf(
                                                entry.getKey()
                                        )
                                )
                        )
                        .append("\":")
                        .append(
                                toJson(
                                        entry.getValue()
                                )
                        );
            }

            builder.append("}");

            return builder.toString();
        }

        if (value instanceof Iterable<?> iterable) {

            StringBuilder builder =
                    new StringBuilder();

            builder.append("[");

            boolean first = true;

            for (
                    Object item
                    : iterable
            ) {

                if (!first) {
                    builder.append(",");
                }

                first = false;

                builder.append(
                        toJson(
                                item
                        )
                );
            }

            builder.append("]");

            return builder.toString();
        }

        return "\""
                + escapeJson(
                        String.valueOf(
                                value
                        )
                )
                + "\"";
    }

    private String escapeJson(
            String value
    ) {

        return value
                .replace(
                        "\\",
                        "\\\\"
                )
                .replace(
                        "\"",
                        "\\\""
                )
                .replace(
                        "\b",
                        "\\b"
                )
                .replace(
                        "\f",
                        "\\f"
                )
                .replace(
                        "\n",
                        "\\n"
                )
                .replace(
                        "\r",
                        "\\r"
                )
                .replace(
                        "\t",
                        "\\t"
                );
    }

    private void logSuccess(
            String message
    ) {

        if (
                getConfig().getBoolean(
                        "logging.success",
                        true
                )
        ) {

            getLogger().info(
                    "[Sync] " + message
            );
        }
    }

    private void logError(
            String message
    ) {

        if (
                getConfig().getBoolean(
                        "logging.errors",
                        true
                )
        ) {

            getLogger().severe(
                    "[Sync] " + message
            );
        }
    }
}