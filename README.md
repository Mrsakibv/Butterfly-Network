# 🦋 Butterfly Network

A modern Minecraft server Network website built with React, TypeScript, Vite, Tailwind CSS and Supabase.

---

## 🎮 About Butterfly Network

Butterfly Network is a Minecraft server Network featuring multiple game modes and a modern web interface.

### Current Game Modes

- ☁️ SkyWars
- 🛏️ BedWars
- 🌳 Survival
- 🧱 SkyBlock

More game modes may be added in the future.

---

## 🛠️ Technologies

This project uses:

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide React
- Motion
- Canvas Confetti

## Minecraft server stats bridge

The Paper plugin sends live player statistics to `/api/minecraft-sync` on join and leave, and performs a full online-player sync every 40 minutes by default. It also exposes an in-game status menu that reports the website's HTTP response and accepted player count.

Build the plugin with `.\gradlew.bat build`, then copy `build\libs\ButterflyNetworkBridge-1.3.0.jar` to the server's `plugins` folder and restart the server. In `plugins\ButterflyNetworkBridge\config.yml`, set `api.api-key` to the same secret as the website's `MINECRAFT_API_KEY`, and make sure `server-id` matches `MINECRAFT_SERVER_ID`.

`api.interval-seconds` controls the periodic sync interval (`2400` means 40 minutes). Existing config files are preserved on upgrade, so change that setting in the server's config if it still has an older value. Join and leave syncs can be toggled with `bridge.sync-on-join` and `bridge.sync-on-leave`.

Use `/butterflybridge` in-game to open the status menu. Its buttons can send current player stats, test the endpoint/API key/server ID with a heartbeat, and refresh the displayed result. Console and players with operator permissions can also use `/butterflybridge sync` and `/butterflybridge test`.

---

## 📋 Requirements

Before running the project, make sure you have installed:

- Node.js
- npm
- Git (optional, but recommended)

You can check your Node.js and npm versions with:

```bash
node -v
npm -v