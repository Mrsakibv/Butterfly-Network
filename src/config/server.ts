/**
 * Central Server Configuration for Butterfly Network
 * Update these values to automatically update the entire website.
 */
export interface ServerConfig {
  serverName: string;
  tagline: string;
  javaIp: string;
  bedrockIp: string;
  port: number;
  bedrockPort: number;
  version: string;
  discordUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  storeUrl: string;
  voteUrl: string;
  serverStatusApi: string;
  copyrightYear: number;
}

export const SERVER_CONFIG: ServerConfig = {
  serverName: "Butterfly Network",
  tagline: "Your next Minecraft adventure starts here :)",
  javaIp: "play.hypixel.net",
  bedrockIp: "play.hypixel.net",
  port: 25565,
  bedrockPort: 19132,
  version: "1.8.x - 1.21.x",
  discordUrl: "https://discord.com/invite/d57g4gjXuc",
  facebookUrl: "https://www.facebook.com/mrsakib232/",
  tiktokUrl: "https://www.tiktok.com/@mrsakib.232?is_from_webapp=1&sender_device=pc",
  twitterUrl: "https://x.com/Mrsakib_",
  storeUrl: "#",
  voteUrl: "#",
  // Leave empty or set to custom endpoint. If empty, will use public mcstatus.io API with demo fallback
  serverStatusApi: "https://api.mcstatus.io/v2/status/java/play.hypixel.net",
  copyrightYear: 2026,
};
