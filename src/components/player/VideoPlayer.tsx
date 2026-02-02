import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, Film, Tv, Server, ChevronDown, Check, AlertTriangle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import wellplayerLogo from '@/assets/wellplayer-logo.png';
import { 
  VideoServer, 
  VIDEO_SERVERS, 
  useServerPreference, 
  getNextServer,
  createCustomServer,
} from '@/hooks/useServerPreference';
import { useCustomStreams } from '@/hooks/useCustomStreams';
import { AddCustomStreamDialog } from './AddCustomStreamDialog';

interface VideoPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title?: string;
}

const FALLBACK_TIMEOUT = 10000; // 10 seconds

export const VideoPlayer = ({ tmdbId, mediaType, season, episode, title }: VideoPlayerProps) => {
  const { 
    preferredServer, 
    setPreferredServer, 
    autoFallback, 
    reportServer,
  } = useServerPreference();
  
  const { getCustomStream, hasCustomStream, isAdmin } = useCustomStreams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedServer, setSelectedServer] = useState<VideoServer>(() => {
    // Check for custom stream first
    const customStream = getCustomStream(tmdbId, mediaType, season, episode);
    if (customStream) {
      return createCustomServer(customStream.stream_url, customStream.stream_name);
    }
    return preferredServer;
  });
  const [attemptedServers, setAttemptedServers] = useState<string[]>([]);
  const [fallbackAttempts, setFallbackAttempts] = useState(0);

  // Get custom stream for this content
  const customStream = getCustomStream(tmdbId, mediaType, season, episode);
  const hasCustom = hasCustomStream(tmdbId, mediaType, season, episode);

  // Build the embed URL using the selected server
  const embedUrl = selectedServer.customUrl || selectedServer.getUrl(tmdbId, mediaType, season, episode);

  // Reset when content changes
  useEffect(() => {
    const custom = getCustomStream(tmdbId, mediaType, season, episode);
    if (custom) {
      setSelectedServer(createCustomServer(custom.stream_url, custom.stream_name));
    } else {
      setSelectedServer(preferredServer);
    }
    setAttemptedServers([]);
    setFallbackAttempts(0);
    setHasError(false);
  }, [tmdbId, mediaType, season, episode]);

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

  // Auto-fallback logic
  useEffect(() => {
    if (!autoFallback || hasError || !isLoading || selectedServer.category === 'custom') return;

    const fallbackTimer = setTimeout(() => {
      if (isLoading && fallbackAttempts < 3) {
        const nextServer = getNextServer(selectedServer, attemptedServers, tmdbId, mediaType);
        if (nextServer) {
          setAttemptedServers(prev => [...prev, selectedServer.id]);
          setSelectedServer(nextServer);
          setFallbackAttempts(prev => prev + 1);
        }
      }
    }, FALLBACK_TIMEOUT);

    return () => clearTimeout(fallbackTimer);
  }, [isLoading, autoFallback, selectedServer, attemptedServers, fallbackAttempts, tmdbId, mediaType, hasError]);

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
      setPreferredServer(server);
      setAttemptedServers([]);
      setFallbackAttempts(0);
    }
  };

  const handleReportServer = () => {
    if (selectedServer.category !== 'custom') {
      reportServer(selectedServer.id, tmdbId, mediaType);
    }
    // Auto-switch to next server after reporting
    const nextServer = getNextServer(selectedServer, [selectedServer.id], tmdbId, mediaType);
    if (nextServer) {
      handleServerChange(nextServer);
    }
  };

  const handleUseCustomStream = () => {
    if (customStream) {
      setSelectedServer(createCustomServer(customStream.stream_url, customStream.stream_name));
    }
  };

  // Group servers by category
  const primaryServers = VIDEO_SERVERS.filter(s => s.category === 'primary');
  const dubbedServers = VIDEO_SERVERS.filter(s => s.category === 'dubbed');
  const backupServers = VIDEO_SERVERS.filter(s => s.category === 'backup');

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
      <div className="absolute top-4 left-4 z-30 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={`gap-2 backdrop-blur-sm border hover:bg-black/80 text-white ${
                selectedServer.category === 'custom' 
                  ? 'bg-primary/30 border-primary/50' 
                  : 'bg-black/60 border-white/10'
              }`}
            >
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">{selectedServer.flag} {selectedServer.name}</span>
              <span className="sm:hidden">{selectedServer.flag}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-56 max-h-80 overflow-y-auto bg-black/95 backdrop-blur-md border-white/10"
          >
            {/* Custom Stream Option */}
            {hasCustom && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <Database className="h-3 w-3" /> My Streams
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleUseCustomStream}
                  className="flex items-center justify-between gap-2 text-white hover:bg-white/10 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>⭐</span>
                    <span>{customStream?.stream_name || 'My Server'}</span>
                  </span>
                  {selectedServer.category === 'custom' && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
              </>
            )}

            {/* Primary Servers */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">Primary</DropdownMenuLabel>
            {primaryServers.map((server) => (
              <DropdownMenuItem
                key={server.id}
                onClick={() => handleServerChange(server)}
                className="flex items-center justify-between gap-2 text-white hover:bg-white/10 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>{server.flag}</span>
                  <span>{server.name}</span>
                </span>
                {selectedServer.id === server.id && selectedServer.category !== 'custom' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-white/10" />
            
            {/* Dubbed/Regional Servers */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">Regional / Dubbed</DropdownMenuLabel>
            {dubbedServers.map((server) => (
              <DropdownMenuItem
                key={server.id}
                onClick={() => handleServerChange(server)}
                className="flex items-center justify-between gap-2 text-white hover:bg-white/10 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>{server.flag}</span>
                  <span>{server.name}</span>
                </span>
                {selectedServer.id === server.id && selectedServer.category !== 'custom' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-white/10" />
            
            {/* Backup Servers */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">Backup</DropdownMenuLabel>
            {backupServers.map((server) => (
              <DropdownMenuItem
                key={server.id}
                onClick={() => handleServerChange(server)}
                className="flex items-center justify-between gap-2 text-white hover:bg-white/10 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>{server.flag}</span>
                  <span>{server.name}</span>
                </span>
                {selectedServer.id === server.id && selectedServer.category !== 'custom' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add Custom Stream Button - Only for admin */}
        {isAdmin && (
          <AddCustomStreamDialog
            tmdbId={tmdbId}
            mediaType={mediaType}
            season={season}
            episode={episode}
            title={title}
          />
        )}
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
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                selectedServer.category === 'custom' 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-white/5 border-white/10'
              }`}>
                {selectedServer.category === 'custom' ? (
                  <Database className="h-3 w-3 text-primary" />
                ) : (
                  <Server className="h-3 w-3 text-white/60" />
                )}
                <span className={`text-xs ${selectedServer.category === 'custom' ? 'text-primary' : 'text-white/60'}`}>
                  {selectedServer.flag} {selectedServer.name}
                </span>
              </div>

              {/* Fallback indicator */}
              {fallbackAttempts > 0 && (
                <p className="text-amber-400/80 text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Auto-switched servers ({fallbackAttempts}x)
                </p>
              )}

              {/* Loading Spinner */}
              {isLoading && !hasError && (
                <div className="flex items-center gap-3 text-white/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">
                    {selectedServer.category === 'custom' ? 'Loading your stream...' : 'Finding best source...'}
                  </span>
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
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRetry}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </Button>
                    {selectedServer.category !== 'custom' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReportServer}
                        className="gap-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Report & Switch
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Server className="h-4 w-4" />
                          Try Another Server
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-black/95 backdrop-blur-md border-white/10 max-h-60 overflow-y-auto">
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
