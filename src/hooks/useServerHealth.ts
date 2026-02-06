import { useState, useEffect, useCallback } from 'react';

export interface ServerHealth {
  id: string;
  status: 'online' | 'slow' | 'offline' | 'unknown';
  latency?: number;
  lastChecked: number;
}

const STORAGE_KEY = 'wellplayer_server_health';
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const HEALTH_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Get cached health data
const getCachedHealth = (): Record<string, ServerHealth> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

// Save health data
const saveHealth = (health: Record<string, ServerHealth>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(health));
};

// Check if a server is reachable by loading a test embed in a hidden iframe
const checkServerHealth = async (
  serverId: string,
  testUrl: string
): Promise<ServerHealth> => {
  const startTime = Date.now();
  
  try {
    // Use a simple fetch to check if the domain is reachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors', // We just want to check reachability
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    return {
      id: serverId,
      status: latency < 2000 ? 'online' : latency < 5000 ? 'slow' : 'offline',
      latency,
      lastChecked: Date.now(),
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    // If request was aborted due to timeout
    if ((error as Error).name === 'AbortError') {
      return {
        id: serverId,
        status: 'slow',
        latency,
        lastChecked: Date.now(),
      };
    }
    
    // For CORS errors on no-cors, it means the server responded
    // This is actually a success case for no-cors
    if (latency < 3000) {
      return {
        id: serverId,
        status: 'online',
        latency,
        lastChecked: Date.now(),
      };
    }
    
    return {
      id: serverId,
      status: 'offline',
      latency,
      lastChecked: Date.now(),
    };
  }
};

export const useServerHealth = () => {
  const [healthData, setHealthData] = useState<Record<string, ServerHealth>>(getCachedHealth);
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<number>(0);

  // Get health status for a specific server
  const getServerHealth = useCallback((serverId: string): ServerHealth | undefined => {
    return healthData[serverId];
  }, [healthData]);

  // Check health for a single server
  const checkServer = useCallback(async (serverId: string, testUrl: string) => {
    const health = await checkServerHealth(serverId, testUrl);
    setHealthData(prev => {
      const updated = { ...prev, [serverId]: health };
      saveHealth(updated);
      return updated;
    });
    return health;
  }, []);

  // Check all servers
  const checkAllServers = useCallback(async (servers: { id: string; testUrl: string }[]) => {
    setIsChecking(true);
    
    // Check servers in parallel batches of 4
    const batchSize = 4;
    const results: Record<string, ServerHealth> = {};
    
    for (let i = 0; i < servers.length; i += batchSize) {
      const batch = servers.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(s => checkServerHealth(s.id, s.testUrl))
      );
      batchResults.forEach(r => {
        results[r.id] = r;
      });
    }
    
    setHealthData(results);
    saveHealth(results);
    setLastFullCheck(Date.now());
    setIsChecking(false);
    
    return results;
  }, []);

  // Check if health data is stale
  const isHealthStale = useCallback((serverId: string): boolean => {
    const health = healthData[serverId];
    if (!health) return true;
    return Date.now() - health.lastChecked > HEALTH_CACHE_DURATION;
  }, [healthData]);

  // Get status color for UI
  const getStatusColor = useCallback((status: ServerHealth['status']): string => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'slow': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  }, []);

  // Get status badge class
  const getStatusBadgeClass = useCallback((status: ServerHealth['status']): string => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'slow': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'offline': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  }, []);

  return {
    healthData,
    isChecking,
    lastFullCheck,
    getServerHealth,
    checkServer,
    checkAllServers,
    isHealthStale,
    getStatusColor,
    getStatusBadgeClass,
  };
};

// Export test URLs for each server
export const getServerTestUrls = (tmdbId: number = 550): { id: string; testUrl: string }[] => [
  // Primary servers
  { id: 'vidsrcto', testUrl: 'https://vidsrc.to/embed/movie/550' },
  { id: 'vidsrccc', testUrl: 'https://vidsrc.cc/v2/embed/movie/550' },
  { id: 'multiembed', testUrl: 'https://multiembed.mov/?video_id=550&tmdb=1' },
  { id: 'smashystream', testUrl: 'https://player.smashy.stream/movie/550' },
  // Hindi/Dubbed servers
  { id: 'vidsrcpro', testUrl: 'https://vidsrc.pro/embed/movie/550' },
  { id: 'superembed', testUrl: 'https://multiembed.mov/directstream.php?video_id=550&tmdb=1' },
  { id: 'vidlink', testUrl: 'https://vidlink.pro/movie/550' },
  { id: 'autoembed2', testUrl: 'https://autoembed.cc/embed/movie/550' },
  // Backup servers
  { id: '2embed', testUrl: 'https://2embed.org/embed/movie/550' },
  { id: 'vidbinge', testUrl: 'https://vidbinge.dev/embed/movie/550' },
  { id: 'vidsrcicu', testUrl: 'https://vidsrc.icu/embed/movie/550' },
  { id: 'vidsrcwtf', testUrl: 'https://vidsrc.wtf/embed/movie/550' },
  { id: 'vidsrcme', testUrl: 'https://vidsrc-embed.su/embed/movie?tmdb=550' },
];
