import { useState, useEffect, useCallback } from 'react';

export interface VideoServer {
  id: string;
  name: string;
  flag: string;
  category: 'primary' | 'dubbed' | 'backup';
  getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => string;
}

export type LanguagePreference = 'default' | 'hindi' | 'asian' | 'dubbed';

const STORAGE_KEYS = {
  SERVER: 'wellplayer_preferred_server',
  LANGUAGE: 'wellplayer_language_preference',
  AUTO_FALLBACK: 'wellplayer_auto_fallback',
};

export const VIDEO_SERVERS: VideoServer[] = [
  // Primary servers
  {
    id: 'autoembed',
    name: 'Crown',
    flag: '🇺🇸',
    category: 'primary',
    getUrl: (tmdbId, mediaType, season, episode) => {
      let url = `https://player.autoembed.cc/embed/${mediaType}/${tmdbId}`;
      if (mediaType === 'tv' && season && episode) url += `/${season}/${episode}`;
      return url;
    },
  },
  {
    id: 'vidsrc',
    name: 'Viet',
    flag: '🇻🇳',
    category: 'primary',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.cc/v2/embed/${mediaType}/${tmdbId}`;
    },
  },
  {
    id: 'vidsrcpro',
    name: 'Wink',
    flag: '🇺🇸',
    category: 'primary',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.pro/embed/${mediaType}/${tmdbId}`;
    },
  },
  // Dubbed / Multi-language servers
  {
    id: 'moviesapi',
    name: 'Hindi',
    flag: '🇮🇳',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`;
      }
      return `https://moviesapi.club/movie/${tmdbId}`;
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
    id: 'vidsrcicu',
    name: 'Dub',
    flag: '🌏',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.icu/embed/${mediaType}/${tmdbId}`;
    },
  },
  {
    id: 'nontongo',
    name: 'Asia',
    flag: '🇯🇵',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://www.nontongo.win/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://www.nontongo.win/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'hindiserver',
    name: 'Bolly',
    flag: '🎬',
    category: 'dubbed',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}-${episode}`;
      }
      return `https://vidsrc.xyz/embed/movie/${tmdbId}`;
    },
  },
  // Backup servers
  {
    id: '2embed',
    name: 'Orion',
    flag: '🇦🇺',
    category: 'backup',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      }
      return `https://www.2embed.cc/embed/${tmdbId}`;
    },
  },
  {
    id: 'multiembed',
    name: 'Cine',
    flag: '🇺🇸',
    category: 'backup',
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
    flag: '🇺🇸',
    category: 'backup',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`;
      }
      return `https://player.smashy.stream/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidlink',
    name: 'Nova',
    flag: '🌐',
    category: 'backup',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidlink.pro/movie/${tmdbId}`;
    },
  },
  {
    id: 'superembed',
    name: 'Super',
    flag: '⚡',
    category: 'backup',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`;
    },
  },
  {
    id: 'vidsrcin',
    name: 'Indo',
    flag: '🇮🇩',
    category: 'backup',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.in/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.in/embed/${mediaType}/${tmdbId}`;
    },
  },
];

// Get servers by category
export const getServersByCategory = (category: VideoServer['category']) => 
  VIDEO_SERVERS.filter(s => s.category === category);

// Get default server based on language preference
export const getDefaultServerForLanguage = (lang: LanguagePreference): VideoServer => {
  switch (lang) {
    case 'hindi':
      return VIDEO_SERVERS.find(s => s.id === 'moviesapi') || VIDEO_SERVERS[0];
    case 'asian':
      return VIDEO_SERVERS.find(s => s.id === 'nontongo') || VIDEO_SERVERS[0];
    case 'dubbed':
      return VIDEO_SERVERS.find(s => s.id === 'vidsrcicu') || VIDEO_SERVERS[0];
    default:
      return VIDEO_SERVERS[0];
  }
};

// Get next server for fallback
export const getNextServer = (currentServer: VideoServer, attemptedServers: string[]): VideoServer | null => {
  // First try other servers in the same category
  const sameCategoryServers = VIDEO_SERVERS.filter(
    s => s.category === currentServer.category && 
         s.id !== currentServer.id && 
         !attemptedServers.includes(s.id)
  );
  if (sameCategoryServers.length > 0) return sameCategoryServers[0];

  // Then try any server not yet attempted
  const anyServer = VIDEO_SERVERS.find(s => !attemptedServers.includes(s.id));
  return anyServer || null;
};

export const useServerPreference = () => {
  const [preferredServer, setPreferredServerState] = useState<VideoServer>(() => {
    if (typeof window === 'undefined') return VIDEO_SERVERS[0];
    const saved = localStorage.getItem(STORAGE_KEYS.SERVER);
    if (saved) {
      const found = VIDEO_SERVERS.find(s => s.id === saved);
      if (found) return found;
    }
    return VIDEO_SERVERS[0];
  });

  const [languagePreference, setLanguagePreferenceState] = useState<LanguagePreference>(() => {
    if (typeof window === 'undefined') return 'default';
    return (localStorage.getItem(STORAGE_KEYS.LANGUAGE) as LanguagePreference) || 'default';
  });

  const [autoFallback, setAutoFallbackState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_FALLBACK);
    return saved !== 'false'; // Default to true
  });

  const setPreferredServer = useCallback((server: VideoServer) => {
    setPreferredServerState(server);
    localStorage.setItem(STORAGE_KEYS.SERVER, server.id);
  }, []);

  const setLanguagePreference = useCallback((lang: LanguagePreference) => {
    setLanguagePreferenceState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    
    // Auto-update preferred server based on language
    const defaultServer = getDefaultServerForLanguage(lang);
    setPreferredServer(defaultServer);
  }, [setPreferredServer]);

  const setAutoFallback = useCallback((enabled: boolean) => {
    setAutoFallbackState(enabled);
    localStorage.setItem(STORAGE_KEYS.AUTO_FALLBACK, String(enabled));
  }, []);

  return {
    preferredServer,
    setPreferredServer,
    languagePreference,
    setLanguagePreference,
    autoFallback,
    setAutoFallback,
    servers: VIDEO_SERVERS,
  };
};
