import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, Film, Tv, Server, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

interface VideoPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title?: string;
}

interface VideoServer {
  id: string;
  name: string;
  flag: string;
  getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => string;
}

const VIDEO_SERVERS: VideoServer[] = [
  {
    id: 'autoembed',
    name: 'Autoembed',
    flag: '🇺🇸',
    getUrl: (tmdbId, mediaType, season, episode) => {
      let url = `https://player.autoembed.cc/embed/${mediaType}/${tmdbId}`;
      if (mediaType === 'tv' && season && episode) url += `/${season}/${episode}`;
      return url;
    },
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    flag: '🇬🇧',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.cc/v2/embed/${mediaType}/${tmdbId}`;
    },
  },
  {
    id: 'vidsrcpro',
    name: 'VidSrc Pro',
    flag: '🇬🇧',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.pro/embed/${mediaType}/${tmdbId}`;
    },
  },
  {
    id: '2embed',
    name: '2Embed',
    flag: '🇦🇺',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      }
      return `https://www.2embed.cc/embed/${tmdbId}`;
    },
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    flag: '🇺🇸',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    },
  },
  {
    id: 'embedsu',
    name: 'EmbedSu',
    flag: '🇮🇳',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.su/embed/movie/${tmdbId}`;
    },
  },
];

export const VideoPlayer = ({ tmdbId, mediaType, season, episode, title }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedServer, setSelectedServer] = useState<VideoServer>(VIDEO_SERVERS[0]);

  // Build the embed URL using the selected server
  const embedUrl = selectedServer.getUrl(tmdbId, mediaType, season, episode);

  useEffect(() => {
    // Reset loading state when server changes
    setIsLoading(true);
    setHasError(false);
    setShowOverlay(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowOverlay(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [embedUrl]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setShowOverlay(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setTimeout(() => setShowOverlay(false), 500);
  };

  const handleIframeError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleServerChange = (server: VideoServer) => {
    if (server.id !== selectedServer.id) {
      setSelectedServer(server);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      {/* Video iframe */}
      <iframe
        key={embedUrl}
        src={embedUrl}
        className="absolute inset-0 w-full h-full z-10"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="origin"
        title="Video Player"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />

      {/* Server Selector - Always visible */}
      <div className="absolute top-4 left-4 z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-black/60 backdrop-blur-sm border border-white/10 hover:bg-black/80 text-white"
            >
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">{selectedServer.flag} {selectedServer.name}</span>
              <span className="sm:hidden">{selectedServer.flag}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-48 bg-black/95 backdrop-blur-md border-white/10"
          >
            {VIDEO_SERVERS.map((server) => (
              <DropdownMenuItem
                key={server.id}
                onClick={() => handleServerChange(server)}
                className="flex items-center justify-between gap-2 text-white hover:bg-white/10 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>{server.flag}</span>
                  <span>{server.name}</span>
                </span>
                {selectedServer.id === server.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Loading/Branding Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
            </div>

            {/* Loading Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative flex flex-col items-center gap-6"
            >
              {/* Logo with Glow */}
              <div className="relative">
                <div className="absolute -inset-4 bg-white/10 rounded-full blur-2xl" />
                <motion.img
                  src={wellplayerLogo}
                  alt="Wellplayer"
                  className="relative h-20 w-20 rounded-2xl shadow-2xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Title */}
              {title && (
                <div className="text-center max-w-md px-4">
                  <p className="text-white/50 text-sm mb-1 flex items-center justify-center gap-2">
                    {mediaType === 'movie' ? (
                      <Film className="h-4 w-4" />
                    ) : (
                      <Tv className="h-4 w-4" />
                    )}
                    {mediaType === 'movie' ? 'Movie' : `S${season} E${episode}`}
                  </p>
                  <h2 className="text-white text-xl font-semibold line-clamp-2">{title}</h2>
                </div>
              )}

              {/* Server Info */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Server className="h-3 w-3 text-white/60" />
                <span className="text-white/60 text-xs">
                  {selectedServer.flag} {selectedServer.name}
                </span>
              </div>

              {/* Loading Spinner */}
              {isLoading && !hasError && (
                <div className="flex items-center gap-3 text-white/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Finding best source...</span>
                </div>
              )}

              {/* Error State */}
              {hasError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm">Failed to load video</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRetry}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Server className="h-4 w-4" />
                          Try Another Server
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-black/95 backdrop-blur-md border-white/10">
                        {VIDEO_SERVERS.filter(s => s.id !== selectedServer.id).map((server) => (
                          <DropdownMenuItem
                            key={server.id}
                            onClick={() => handleServerChange(server)}
                            className="text-white hover:bg-white/10 cursor-pointer"
                          >
                            <span>{server.flag}</span>
                            <span className="ml-2">{server.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              )}

              {/* Branding */}
              <p className="text-white/30 text-xs italic mt-4">
                Powered by Wellplayer
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner Watermark (visible when playing) */}
      {!showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-4 right-4 z-30 pointer-events-none"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <img src={wellplayerLogo} alt="" className="h-4 w-4 rounded" />
            <span className="text-white/60 text-xs font-medium">Wellplayer</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
