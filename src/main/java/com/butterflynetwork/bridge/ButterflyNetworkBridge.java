package com.butterflynetwork.bridge;

import io.papermc.paper.advancement.AdvancementDisplay;
import net.luckperms.api.LuckPerms;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Statistic;
import org.bukkit.advancement.Advancement;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
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
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;

import java.io.IOException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ButterflyNetworkBridge
        extends JavaPlugin
        implements Listener {

    private static final int STATUS_MENU_SIZE = 27;
    private static final Pattern SUCCESS_RESPONSE_PATTERN =
            Pattern.compile("\"success\"\\s*:\\s*true\\b");
    private static final Pattern SYNCED_PLAYERS_PATTERN =
            Pattern.compile("\"syncedPlayers\"\\s*:\\s*(\\d+)");
    private static final Pattern WARNINGS_PATTERN =
            Pattern.compile("\"warnings\"\\s*:\\s*\\[(.*?)]", Pattern.DOTALL);

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

    private final Map<UUID, Long> sessionStartMillis =
            new HashMap<>();

    private final List<CachedAdvancement> cachedAdvancements =
            new ArrayList<>();

    private final AtomicBoolean periodicSyncInProgress =
            new AtomicBoolean(false);

    private final AtomicLong syncRequestSequence =
            new AtomicLong();

    private volatile SyncStatus lastSyncStatus =
            new SyncStatus(
                    "NEVER",
                    "",
                    null,
                    null,
                    0,
                    0,
                    -1,
                    "No sync request has been sent yet."
            );

    private volatile Instant lastSuccessfulSyncAt;

    private final DateTimeFormatter statusTimeFormatter =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                    .withZone(ZoneId.systemDefault());

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

        getCommand("butterflybridge")
                .setExecutor(this::handleCommand);

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

        bridgeVersion = getDescription().getVersion();

        intervalSeconds =
                Math.max(
                        30,
                        getConfig()
                                .getInt(
                                        "api.interval-seconds",
                                        2400
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

    }

    private void startSyncTask() {

        long intervalTicks =
                intervalSeconds * 20L;

        syncTask =
                Bukkit.getScheduler()
                        .runTaskTimer(
                                this,
                                () -> startPeriodicSnapshot(),
                                40L,
                                intervalTicks
                        );
    }

    private void startPeriodicSnapshot() {

        startPeriodicSnapshot("periodic");
    }

    private boolean startPeriodicSnapshot(String syncType) {

        if (!periodicSyncInProgress.compareAndSet(false, true)) {

            logSuccess(
                    "Skipping periodic sync because the previous snapshot is still in progress."
            );

            return false;
        }

        List<UUID> onlinePlayerIds =
                new ArrayList<>();

        for (Player player : Bukkit.getOnlinePlayers()) {
            onlinePlayerIds.add(
                    player.getUniqueId()
            );
        }

        lastSyncStatus = new SyncStatus(
                onlinePlayerIds.isEmpty() ? "SENDING" : "COLLECTING",
                syncType,
                Instant.now(),
                null,
                0,
                onlinePlayerIds.size(),
                -1,
                onlinePlayerIds.isEmpty()
                        ? "Sending an empty heartbeat request."
                        : "Collecting online player stats."
        );

        if (onlinePlayerIds.isEmpty()) {

            periodicSyncInProgress.set(false);

            logSuccess(
                    "No online players; periodic player sync skipped. Season maintenance heartbeat will be sent."
            );

            sendHeartbeat();
            return true;
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
                                                    syncType
                                            ),
                                            snapshots.size()
                                    );
                                }
                            }
                        },
                        1L,
                        1L
                );

        return true;
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
    public void onStatusMenuClick(InventoryClickEvent event) {

        if (!(event.getView().getTopInventory().getHolder() instanceof StatusMenu)) {
            return;
        }

        event.setCancelled(true);

        if (!(event.getWhoClicked() instanceof Player player)
                || event.getRawSlot() < 0
                || event.getRawSlot() >= STATUS_MENU_SIZE) {
            return;
        }

        switch (event.getRawSlot()) {
            case 11 -> {
                if (!hasApiKey()) {
                    player.sendMessage(Component.text(
                            "Set api.api-key in the plugin config before syncing."
                    ));
                    return;
                }

                if (startPeriodicSnapshot("manual")) {
                    player.sendMessage(Component.text(
                            "Current online player stats are being sent to the website."
                    ));
                } else {
                    player.sendMessage(Component.text(
                            "A player sync is already in progress."
                    ));
                }
                renderStatusMenu(event.getView().getTopInventory());
            }
            case 13 -> {
                if (!hasApiKey()) {
                    player.sendMessage(Component.text(
                            "Set api.api-key in the plugin config before testing the connection."
                    ));
                    return;
                }

                sendHeartbeat();
                player.sendMessage(Component.text(
                        "Connection test sent. Refresh the menu to see the website response."
                ));
                renderStatusMenu(event.getView().getTopInventory());
            }
            case 15 -> renderStatusMenu(event.getView().getTopInventory());
            default -> {
            }
        }
    }

    private boolean handleCommand(
            CommandSender sender,
            Command command,
            String label,
            String[] args
    ) {

        if (!sender.hasPermission("butterflynetworkbridge.admin")) {
            sender.sendMessage(Component.text(
                    "You do not have permission to use this command."
            ));
            return true;
        }

        if (args.length > 0 && args[0].equalsIgnoreCase("sync")) {
            if (!hasApiKey()) {
                sender.sendMessage(Component.text(
                        "Set api.api-key in the plugin config before syncing."
                ));
            } else if (startPeriodicSnapshot("manual")) {
                sender.sendMessage(Component.text(
                        "Current online player stats are being sent to the website."
                ));
            } else {
                sender.sendMessage(Component.text(
                        "A player sync is already in progress."
                ));
            }
            return true;
        }

        if (args.length > 0 && args[0].equalsIgnoreCase("test")) {
            if (!hasApiKey()) {
                sender.sendMessage(Component.text(
                        "Set api.api-key in the plugin config before testing the connection."
                ));
            } else {
                sendHeartbeat();
                sender.sendMessage(Component.text(
                        "Connection test sent. Check the bridge status for the website response."
                ));
            }
            return true;
        }

        if (sender instanceof Player player) {
            openStatusMenu(player);
        } else {
            sendStatus(sender);
        }

        return true;
    }

    private boolean hasApiKey() {

        return apiKey != null && !apiKey.isBlank();
    }

    private void openStatusMenu(Player player) {

        StatusMenu holder = new StatusMenu();
        Inventory inventory = Bukkit.createInventory(
                holder,
                STATUS_MENU_SIZE,
                Component.text("Butterfly Bridge Status")
        );
        holder.setInventory(inventory);
        renderStatusMenu(inventory);
        player.openInventory(inventory);
    }

    private void renderStatusMenu(Inventory inventory) {

        ItemStack filler = createMenuItem(
                Material.GRAY_STAINED_GLASS_PANE,
                " ",
                List.of()
        );
        for (int slot = 0; slot < inventory.getSize(); slot++) {
            inventory.setItem(slot, filler);
        }

        SyncStatus status = lastSyncStatus;
        Material statusMaterial = switch (status.state()) {
            case "SENDING", "COLLECTING" -> Material.YELLOW_DYE;
            case "SUCCESS" -> Material.LIME_DYE;
            case "WARNING" -> Material.ORANGE_DYE;
            case "FAILED" -> Material.RED_DYE;
            default -> Material.GRAY_DYE;
        };

        List<String> statusLore = new ArrayList<>();
        statusLore.add("Result: " + status.state().toLowerCase().replace('_', ' '));
        if (!status.syncType().isBlank()) {
            statusLore.add("Request type: " + status.syncType());
        }
        statusLore.add("Players sent: " + status.playersSent());
        if (status.playersAccepted() >= 0) {
            statusLore.add("Players accepted: " + status.playersAccepted());
        }
        if (status.httpStatus() > 0) {
            statusLore.add("Website HTTP status: " + status.httpStatus());
        }
        if (status.startedAt() != null) {
            statusLore.add("Last attempt: " + formatStatusTime(status.startedAt()));
        }
        if (status.completedAt() != null) {
            statusLore.add("Last response: " + formatStatusTime(status.completedAt()));
        }
        statusLore.add("Last successful delivery: "
                + (lastSuccessfulSyncAt == null
                        ? "never"
                        : formatStatusTime(lastSuccessfulSyncAt)));
        statusLore.addAll(wrapStatusDetail(status.detail()));

        inventory.setItem(
                4,
                createMenuItem(
                        statusMaterial,
                        "Latest Website Delivery",
                        statusLore
                )
        );
        inventory.setItem(
                10,
                createMenuItem(
                        Material.COMPASS,
                        "Server & Schedule",
                        List.of(
                                "Server ID: " + serverId,
                                "Auto-sync: every " + intervalSeconds + " seconds",
                                "Sync on join: " + syncOnJoin,
                                "Sync on leave: " + syncOnLeave,
                                "API key: " + (hasApiKey() ? "configured" : "missing")
                        )
                )
        );
        inventory.setItem(
                11,
                createMenuItem(
                        Material.EMERALD,
                        "Sync Current Players",
                        List.of(
                                "Send live stats for all online players now.",
                                "The response confirms how many the website accepted."
                        )
                )
        );
        inventory.setItem(
                13,
                createMenuItem(
                        Material.ENDER_EYE,
                        "Test Website Connection",
                        List.of(
                                "Send a heartbeat without player data.",
                                "Checks the endpoint, API key and server ID."
                        )
                )
        );
        inventory.setItem(
                15,
                createMenuItem(
                        Material.CLOCK,
                        "Refresh Status",
                        List.of("Update this menu with the latest response.")
                )
        );
    }

    private ItemStack createMenuItem(
            Material material,
            String title,
            List<String> lore
    ) {

        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        meta.displayName(Component.text(title));
        meta.lore(lore.stream().map(Component::text).toList());
        item.setItemMeta(meta);
        return item;
    }

    private List<String> wrapStatusDetail(String detail) {

        if (detail == null || detail.isBlank()) {
            return List.of();
        }

        String normalized = detail.replaceAll("\\s+", " ");
        if (normalized.length() > 180) {
            normalized = normalized.substring(0, 177) + "...";
        }
        return List.of("Details: " + normalized);
    }

    private String formatStatusTime(Instant instant) {

        return statusTimeFormatter.format(instant);
    }

    private void sendStatus(CommandSender sender) {

        SyncStatus status = lastSyncStatus;
        sender.sendMessage(
                "Bridge status: " + status.state()
                        + " | Server ID: " + serverId
                        + " | API key: " + (hasApiKey() ? "configured" : "missing")
        );
        sender.sendMessage(
                "Last delivery: " + status.detail()
                        + (status.httpStatus() > 0
                                ? " (HTTP " + status.httpStatus() + ")"
                                : "")
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
            Player player,
            boolean online,
            boolean includeAdvancements
    ) {

        UUID uuid =
                player.getUniqueId();

        String uuidString =
                uuid.toString();

        double hearts =
                Math.max(
                        0,
                        player.getHealth() / 2.0
                );

        long kills =
                safeGetStatisticLong(
                        player,
                        Statistic.PLAYER_KILLS
                );

        long deaths =
                safeGetStatisticLong(
                        player,
                        Statistic.DEATHS
                );

        MaterialStatisticTotals materialStatistics =
                collectMaterialStatistics(player);

        double money =
                readVaultBalance(
                        player
                );

        long playtimeSeconds =
                readPlaytimeSeconds(
                        player
                );

        long blocksBroken =
                Math.max(
                        getPersistentLong(
                                player.getPersistentDataContainer(),
                                blocksBrokenKey
                        ),
                        materialStatistics.blocksMined()
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

        for (Statistic statistic : Statistic.values()) {
            if (statistic.getType() == Statistic.Type.UNTYPED) {
                statistics.put(
                        statistic.getKey().toString(),
                        safeGetStatisticLong(
                                player,
                                statistic
                        )
                );
            }
        }

        statistics.put(
                "minecraft:play_one_minute",
                playtimeSeconds * 20L
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
                materialStatistics.itemsCrafted()
        );

        snapshot.put(
                "itemsUsed",
                materialStatistics.itemsUsed()
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

    private MaterialStatisticTotals collectMaterialStatistics(
            Player player
    ) {

        long blocksMined = 0;
        long itemsCrafted = 0;
        long itemsUsed = 0;

        for (Material material : Material.values()) {

            if (material.isBlock()) {
                blocksMined += Math.max(
                        0,
                        player.getStatistic(
                                Statistic.MINE_BLOCK,
                                material
                        )
                );
            }

            if (material.isItem()) {
                itemsCrafted += Math.max(
                        0,
                        player.getStatistic(
                                Statistic.CRAFT_ITEM,
                                material
                        )
                );

                itemsUsed += Math.max(
                        0,
                        player.getStatistic(
                                Statistic.USE_ITEM,
                                material
                        )
                );
            }
        }

        return new MaterialStatisticTotals(
                blocksMined,
                itemsCrafted,
                itemsUsed
        );
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

        long requestSequence = syncRequestSequence.incrementAndGet();
        Instant startedAt = Instant.now();
        String syncType = String.valueOf(payload.getOrDefault("syncType", "unknown"));
        lastSyncStatus = new SyncStatus(
                "SENDING",
                syncType,
                startedAt,
                null,
                0,
                playerCount,
                -1,
                "Waiting for the website response."
        );

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

                            boolean successful =
                                    response.statusCode() >= 200
                                            && response.statusCode() < 300
                                            && SUCCESS_RESPONSE_PATTERN
                                                    .matcher(response.body())
                                                    .find();
                            int acceptedPlayers =
                                    readResponseCount(response.body());
                            String warnings =
                                    readResponseWarnings(response.body());
                            String detail;

                            if (successful) {

                                lastSuccessfulSyncAt = Instant.now();
                                detail =
                                        "Website accepted "
                                                + (acceptedPlayers >= 0
                                                        ? acceptedPlayers
                                                        : playerCount)
                                                + " player(s).";

                                if (!warnings.isBlank()) {
                                    detail += " Website warnings: " + warnings;
                                }

                                if (requestSequence == syncRequestSequence.get()) {
                                    lastSyncStatus = new SyncStatus(
                                            warnings.isBlank() ? "SUCCESS" : "WARNING",
                                            syncType,
                                            startedAt,
                                            Instant.now(),
                                            response.statusCode(),
                                            playerCount,
                                            acceptedPlayers,
                                            detail
                                    );
                                }

                                logSuccess(
                                        detail + " HTTP " + response.statusCode()
                                );

                            } else {

                                String responseBody =
                                        response.body().replaceAll("\\s+", " ");
                                if (responseBody.length() > 400) {
                                    responseBody =
                                            responseBody.substring(0, 397) + "...";
                                }
                                detail =
                                        "Website rejected the request. HTTP "
                                                + response.statusCode()
                                                + (responseBody.isBlank()
                                                        ? ""
                                                        : " Response: " + responseBody);

                                if (requestSequence == syncRequestSequence.get()) {
                                    lastSyncStatus = new SyncStatus(
                                            "FAILED",
                                            syncType,
                                            startedAt,
                                            Instant.now(),
                                            response.statusCode(),
                                            playerCount,
                                            acceptedPlayers,
                                            detail
                                    );
                                }

                                logError(
                                        detail
                                );
                            }
                        }
                )
                .exceptionally(
                        exception -> {

                            String detail =
                                    "Website sync request failed: "
                                            + exception.getMessage();
                            if (requestSequence == syncRequestSequence.get()) {
                                lastSyncStatus = new SyncStatus(
                                        "FAILED",
                                        syncType,
                                        startedAt,
                                        Instant.now(),
                                        0,
                                        playerCount,
                                        -1,
                                        detail
                                );
                            }

                            logError(
                                    detail
                            );

                            return null;
                        }
                );
    }

    private int readResponseCount(String responseBody) {

        Matcher matcher =
                SYNCED_PLAYERS_PATTERN.matcher(responseBody);
        if (!matcher.find()) {
            return -1;
        }

        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException exception) {
            return -1;
        }
    }

    private String readResponseWarnings(String responseBody) {

        Matcher matcher =
                WARNINGS_PATTERN.matcher(responseBody);
        if (!matcher.find()) {
            return "";
        }

        return matcher.group(1)
                .replaceAll("\\s+", " ")
                .trim();
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

    private record MaterialStatisticTotals(
            long blocksMined,
            long itemsCrafted,
            long itemsUsed
    ) {
    }

    private record SyncStatus(
            String state,
            String syncType,
            Instant startedAt,
            Instant completedAt,
            int httpStatus,
            int playersSent,
            int playersAccepted,
            String detail
    ) {
    }

    private static final class StatusMenu implements InventoryHolder {

        private Inventory inventory;

        private void setInventory(Inventory inventory) {
            this.inventory = inventory;
        }

        @Override
        public Inventory getInventory() {
            return inventory;
        }
    }
}