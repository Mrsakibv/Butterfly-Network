import { useState, useEffect, useCallback } from 'react';
import { fetchLiveServerStatus } from '../services/serverStatus';
import { ServerStatusData, ServerStatusState } from '../types';
import { SERVER_CONFIG } from '../config/server';

export interface UseServerStatusReturn {
  loading: boolean;
  online: boolean;
  playersOnline: number;
  playersMax: number;
  version: string;
  ping: number;
  error: string | null;
  state: ServerStatusState;
  motd?: string;
  icon?: string;
  isDemo: boolean;
  lastUpdated: number;
  refetch: () => Promise<void>;
}

export function useServerStatus(customIp?: string): UseServerStatusReturn {
  const ip = customIp || SERVER_CONFIG.javaIp;
  
  const [data, setData] = useState<ServerStatusData>({
    state: 'LOADING',
    online: false,
    playersOnline: 0,
    playersMax: 1000,
    version: SERVER_CONFIG.version,
    ping: 0,
    error: null,
    lastUpdated: 0,
    isDemo: false,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLiveServerStatus(ip);
      setData(result);
    } catch {
      setData({
        state: 'ERROR',
        online: false,
        playersOnline: 0,
        playersMax: 0,
        version: SERVER_CONFIG.version,
        ping: 0,
        error: 'Unable to reach Minecraft status service',
        lastUpdated: Date.now(),
        isDemo: true,
      });
    } finally {
      setLoading(false);
    }
  }, [ip]);

  useEffect(() => {
    loadStatus();
    // Poll every 60 seconds
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  return {
    loading,
    online: data.online,
    playersOnline: data.playersOnline,
    playersMax: data.playersMax,
    version: data.version,
    ping: data.ping,
    error: data.error ?? null,
    state: data.state,
    motd: data.motd,
    icon: data.icon,
    isDemo: data.isDemo,
    lastUpdated: data.lastUpdated,
    refetch: loadStatus,
  };
}
