import { SERVER_CONFIG } from '../config/server';
import { ServerStatusData } from '../types';

/**
 * Server Status Service
 * Connects to live Minecraft Server status API or falls back gracefully to a clearly labeled demo state.
 */
export async function fetchLiveServerStatus(ip: string = SERVER_CONFIG.javaIp): Promise<ServerStatusData> {
  const startTime = performance.now();
  
  // If explicitly disabled or custom endpoint
  const endpoint = SERVER_CONFIG.serverStatusApi || `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(ip)}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    const elapsedPing = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`Status API returned code ${response.status}`);
    }

    const data = await response.json();

    // mcstatus.io v2 schema parsing
    if (typeof data.online === 'boolean') {
      if (data.online) {
        return {
          state: 'ONLINE',
          online: true,
          playersOnline: data.players?.online ?? 0,
          playersMax: data.players?.max ?? 1000,
          version: data.version?.name_clean || data.version?.name || SERVER_CONFIG.version,
          ping: elapsedPing,
          motd: data.motd?.clean || data.motd?.raw || 'Welcome to Butterfly Network',
          icon: data.icon,
          error: null,
          lastUpdated: Date.now(),
          isDemo: false,
        };
      } else {
        return {
          state: 'OFFLINE',
          online: false,
          playersOnline: 0,
          playersMax: 1000,
          version: SERVER_CONFIG.version,
          ping: 0,
          motd: 'Server is currently undergoing scheduled maintenance.',
          error: null,
          lastUpdated: Date.now(),
          isDemo: false,
        };
      }
    }

    throw new Error('Unrecognized response format from server status API');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to query live status';
    
    // When live status fails or network is blocked in sandboxed environment,
    // we return a clearly labeled DEMO status so users see a realistic representation
    return {
      state: 'DEMO',
      online: true,
      playersOnline: 482,
      playersMax: 1500,
      version: SERVER_CONFIG.version,
      ping: 24,
      motd: '§d§lButterfly Network §8» §7Skyblock §8• §7BedWars §8• §7Lifesteal',
      error: `Live query unavailable (${errorMessage}). Showing live simulated metrics.`,
      lastUpdated: Date.now(),
      isDemo: true,
    };
  }
}
