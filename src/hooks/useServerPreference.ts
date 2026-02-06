import { useState, useEffect, useCallback } from 'react';

export interface VideoServer {
  id: string;
  name: string;
  flag: string;
  category: 'primary' | 'dubbed' | 'backup' | 'custom';
  getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => string;
  customUrl?: string; // For custom user-added streams
}

export type LanguagePreference = 'default' | 'hindi' | 'bengali' | 'asian' | 'dubbed';

// Create a custom "My Server" entry from a URL
export const createCustomServer = (url: string, name: string = 'My Server'): VideoServer => ({
  id: 'custom',
  name,
  flag: '⭐',
  category: 'custom',
  customUrl: url,
  getUrl: () => url,
});

export interface ReportedServer {
  serverId: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  reportedAt: number;
}

const STORAGE_KEYS = {
  SERVER: 'wellplayer_preferred_server',
  LANGUAGE: 'wellplayer_language_preference',
  AUTO_FALLBACK: 'wellplayer_auto_fallback',
  REPORTED_SERVERS: 'wellplayer_reported_servers',
};

const REPORT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// VERIFIED WORKING PROVIDERS (Tested February 2026)
// These are actively maintained and allow iframe embedding
export const VIDEO_SERVERS: VideoServer[] = [
  // HINDI / DUBBED - High Priority for regional content
  {
    id: 'vidsrcxyz',
    name: 'Hindi',
    flag: '🇮🇳',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.xyz/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'embedsu',
    name: 'Desi',
    flag: '🇮🇳',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.su/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidsrcpro',
    name: 'Prime',
    flag: '🇮🇳',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.pro/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidsrcin',
    name: 'Max',
    flag: '🌏',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.in/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.in/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidlink',
    name: 'Regal',
    flag: '🎬',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidlink.pro/movie/${tmdbId}`;
    },
  },
  // PRIMARY - English/International (Fast & Reliable)
  {
    id: 'autoembed',
    name: 'Crown',
    flag: '🇺🇸',
    category: 'primary',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://player.autoembed.cc/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidsrcto',
    name: 'Apex',
    flag: '🔥',
    category: 'primary',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.to/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'multiembed',
    name: 'Blaze',
    flag: '⚡',
    category: 'primary',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    },
  },
  {
    id: 'smashystream',
    name: 'Nexon',
    flag: '🌐',
    category: 'primary',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`;
      }
      return `https://player.smashy.stream/movie/${tmdbId}`;
    },
  },
  // BACKUP - Alternative sources
  {
    id: '2embed',
    name: 'Echo',
    flag: '🔷',
    category: 'backup',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://2embed.org/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://2embed.org/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidbinge',
    name: 'Nova',
    flag: '✨',
    category: 'backup',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidbinge.dev/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidbinge.dev/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'moviesapi',
    name: 'Orion',
    flag: '🌙',
    category: 'backup',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`;
      }
      return `https://moviesapi.club/movie/${tmdbId}`;
    },
  },
];

// Get servers by category
export const getServersByCategory = (category: VideoServer['category']) => 
  VIDEO_SERVERS.filter(s => s.category === category);

// Get all servers (for fallback)
export const getAllServers = () => VIDEO_SERVERS;

// Get default server based on language preference
export const getDefaultServerForLanguage = (lang: LanguagePreference): VideoServer => {
  switch (lang) {
    case 'hindi':
      return VIDEO_SERVERS.find(s => s.id === 'moviesapi') || VIDEO_SERVERS[0];
    case 'bengali':
      // Bengali content works best with dubbed servers
      return VIDEO_SERVERS.find(s => s.id === 'multiembed') || VIDEO_SERVERS[0];
    case 'asian':
      return VIDEO_SERVERS.find(s => s.id === 'embedapi') || VIDEO_SERVERS[0];
    case 'dubbed':
      return VIDEO_SERVERS.find(s => s.id === 'multiembed') || VIDEO_SERVERS[0];
    default:
      return VIDEO_SERVERS[0];
  }
};

// Get reported servers from storage
const getReportedServers = (): ReportedServer[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REPORTED_SERVERS);
    if (!stored) return [];
    const reports: ReportedServer[] = JSON.parse(stored);
    // Filter out expired reports
    const now = Date.now();
    return reports.filter(r => now - r.reportedAt < REPORT_EXPIRY_MS);
  } catch {
    return [];
  }
};

// Save reported servers to storage
const saveReportedServers = (reports: ReportedServer[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REPORTED_SERVERS, JSON.stringify(reports));
};

// Check if a server is reported for specific content
export const isServerReported = (
  serverId: string, 
  tmdbId: number, 
  mediaType: 'movie' | 'tv'
): boolean => {
  const reports = getReportedServers();
  return reports.some(
    r => r.serverId === serverId && r.tmdbId === tmdbId && r.mediaType === mediaType
  );
};

// Get report count for a server (across all content)
export const getServerReportCount = (serverId: string): number => {
  const reports = getReportedServers();
  return reports.filter(r => r.serverId === serverId).length;
};

// Get next server for fallback - prioritizes servers with fewer reports
export const getNextServer = (
  currentServer: VideoServer, 
  attemptedServers: string[],
  tmdbId?: number,
  mediaType?: 'movie' | 'tv'
): VideoServer | null => {
  const allServers = getAllServers();
  const reports = getReportedServers();
  
  // Create a score for each server (lower is better)
  const getServerScore = (server: VideoServer): number => {
    let score = 0;
    
    // Penalize servers reported for this specific content
    if (tmdbId && mediaType) {
      const isReportedForContent = reports.some(
        r => r.serverId === server.id && r.tmdbId === tmdbId && r.mediaType === mediaType
      );
      if (isReportedForContent) score += 100;
    }
    
    // Penalize servers with more general reports
    const reportCount = reports.filter(r => r.serverId === server.id).length;
    score += reportCount * 10;
    
    return score;
  };
  
  // Get available servers sorted by score
  const availableServers = allServers
    .filter(s => s.id !== currentServer.id && !attemptedServers.includes(s.id))
    .sort((a, b) => {
      // First prioritize same category
      const aCategory = a.category === currentServer.category ? 0 : 1;
      const bCategory = b.category === currentServer.category ? 0 : 1;
      if (aCategory !== bCategory) return aCategory - bCategory;
      
      // Then sort by report score
      return getServerScore(a) - getServerScore(b);
    });
    
  return availableServers[0] || null;
};

export const useServerPreference = () => {
  const [preferredServer, setPreferredServerState] = useState<VideoServer>(() => {
    if (typeof window === 'undefined') return getDefaultServerForLanguage('hindi');
    const saved = localStorage.getItem(STORAGE_KEYS.SERVER);
    if (saved) {
      const found = VIDEO_SERVERS.find(s => s.id === saved);
      if (found) return found;
    }
    // Default to Hindi server for prioritizing dubbed content globally
    const savedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as LanguagePreference;
    return getDefaultServerForLanguage(savedLang || 'hindi');
  });

  const [languagePreference, setLanguagePreferenceState] = useState<LanguagePreference>(() => {
    if (typeof window === 'undefined') return 'hindi';
    // Default to Hindi for prioritizing dubbed content globally
    return (localStorage.getItem(STORAGE_KEYS.LANGUAGE) as LanguagePreference) || 'hindi';
  });

  const [autoFallback, setAutoFallbackState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_FALLBACK);
    return saved !== 'false'; // Default to true
  });

  const [reportedServers, setReportedServers] = useState<ReportedServer[]>(() => getReportedServers());

  const setPreferredServer = useCallback((server: VideoServer) => {
    setPreferredServerState(server);
    localStorage.setItem(STORAGE_KEYS.SERVER, server.id);
  }, []);

  const setLanguagePreference = useCallback((lang: LanguagePreference) => {
    setLanguagePreferenceState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    
    // IMPORTANT: Auto-update preferred server based on language
    // This ensures the server actually changes when user selects a language
    const defaultServer = getDefaultServerForLanguage(lang);
    setPreferredServerState(defaultServer);
    localStorage.setItem(STORAGE_KEYS.SERVER, defaultServer.id);
  }, []);

  const setAutoFallback = useCallback((enabled: boolean) => {
    setAutoFallbackState(enabled);
    localStorage.setItem(STORAGE_KEYS.AUTO_FALLBACK, String(enabled));
  }, []);

  const reportServer = useCallback((
    serverId: string, 
    tmdbId: number, 
    mediaType: 'movie' | 'tv'
  ) => {
    const newReport: ReportedServer = {
      serverId,
      tmdbId,
      mediaType,
      reportedAt: Date.now(),
    };
    
    // Remove any existing report for same server+content combo
    const existing = reportedServers.filter(
      r => !(r.serverId === serverId && r.tmdbId === tmdbId && r.mediaType === mediaType)
    );
    
    const updated = [...existing, newReport];
    setReportedServers(updated);
    saveReportedServers(updated);
  }, [reportedServers]);

  const clearServerReports = useCallback((serverId?: string) => {
    if (serverId) {
      const updated = reportedServers.filter(r => r.serverId !== serverId);
      setReportedServers(updated);
      saveReportedServers(updated);
    } else {
      setReportedServers([]);
      saveReportedServers([]);
    }
  }, [reportedServers]);

  return {
    preferredServer,
    setPreferredServer,
    languagePreference,
    setLanguagePreference,
    autoFallback,
    setAutoFallback,
    servers: VIDEO_SERVERS,
    reportedServers,
    reportServer,
    clearServerReports,
    isServerReported: (serverId: string, tmdbId: number, mediaType: 'movie' | 'tv') => 
      isServerReported(serverId, tmdbId, mediaType),
    getServerReportCount,
  };
};
