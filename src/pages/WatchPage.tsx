import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Clock, Server, ChevronDown, Check, Play, RotateCcw, RotateCw, AlertTriangle, Loader2, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMovieDetails, useTVShowDetails, useSeasonDetails } from '@/hooks/useTMDB';
import { useServerPreference, getServersByCategory, getNextServer, VideoServer } from '@/hooks/useServerPreference';
import { EpisodeList } from '@/components/player/EpisodeList';
import { ServerSettingsDialog } from '@/components/player/ServerSettingsDialog';
import { ExternalSourcesDialog } from '@/components/player/ExternalSourcesDialog';
import { useToast } from '@/hooks/use-toast';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

const FALLBACK_TIMEOUT_MS = 10000; // 10 seconds

const WatchPage = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const initialSeason = Number(searchParams.get('s')) || 1;
  const initialEpisode = Number(searchParams.get('e')) || 1;

  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [attemptedServers, setAttemptedServers] = useState<string[]>([]);
  const [isFallbackTriggered, setIsFallbackTriggered] = useState(false);
  const [externalEmbedUrl, setExternalEmbedUrl] = useState<string | null>(null);
  const [externalSourceName, setExternalSourceName] = useState<string | null>(null);

  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const tmdbId = Number(id);

  const { 
    preferredServer, 
    setPreferredServer, 
    autoFallback,
    reportServer,
    isServerReported,
  } = useServerPreference();

  const [selectedServer, setSelectedServer] = useState<VideoServer>(preferredServer);
  const isReported = isServerReported(selectedServer.id, tmdbId, mediaType as 'movie' | 'tv');

  const { data: movie, isLoading: movieLoading } = useMovieDetails(
    mediaType === 'movie' ? tmdbId : 0
  );
  const { data: tvShow, isLoading: tvLoading } = useTVShowDetails(
    mediaType === 'tv' ? tmdbId : 0
  );
  
  const { data: seasonData, isLoading: seasonLoading } = useSeasonDetails(
    mediaType === 'tv' ? tmdbId : 0,
    selectedSeason
  );

  const content = mediaType === 'movie' ? movie : tvShow;
  const isContentLoading = mediaType === 'movie' ? movieLoading : tvLoading;
  const title = content ? (mediaType === 'movie' ? (content as any).title : (content as any).name) : '';
  const overview = content?.overview || '';
  const rating = content?.vote_average?.toFixed(1) || 'N/A';
  const releaseYear = content ? new Date(
    mediaType === 'movie' ? (content as any).release_date : (content as any).first_air_date
  ).getFullYear() : 'N/A';
  const runtime = mediaType === 'movie' && movie?.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;
  const seasons = mediaType === 'tv' && tvShow ? tvShow.number_of_seasons || 1 : 0;

  const episodes = seasonData?.episodes?.map(ep => ({
    number: ep.episode_number,
    name: ep.name,
    overview: ep.overview,
    stillPath: ep.still_path,
    runtime: ep.runtime,
  })) || Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    name: `Episode ${i + 1}`,
  }));

  // Use external embed URL if set, otherwise use selected server
  const embedUrl = externalEmbedUrl || selectedServer.getUrl(tmdbId, mediaType, selectedSeason, selectedEpisode);
  const currentSourceName = externalSourceName || `${selectedServer.flag} ${selectedServer.name}`;

  // Clear fallback timer
  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // Handle auto-fallback to next server
  const handleAutoFallback = useCallback(() => {
    if (!autoFallback) return;

    const nextServer = getNextServer(selectedServer, attemptedServers, tmdbId, mediaType as 'movie' | 'tv');
    if (nextServer) {
      setIsFallbackTriggered(true);
      setAttemptedServers(prev => [...prev, selectedServer.id]);
      setSelectedServer(nextServer);
      
      toast({
        title: "Switching server...",
        description: `Trying ${nextServer.flag} ${nextServer.name}`,
        duration: 3000,
      });
    } else {
      toast({
        title: "All servers tried",
        description: "Content may not be available. Try external servers or try again later.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [autoFallback, selectedServer, attemptedServers, tmdbId, mediaType, toast]);

  // Handle reporting a broken server
  const handleReportServer = useCallback(() => {
    reportServer(selectedServer.id, tmdbId, mediaType as 'movie' | 'tv');
    toast({
      title: "Server reported",
      description: `${selectedServer.name} marked as broken for this content. It will be deprioritized.`,
      duration: 3000,
    });
  }, [selectedServer, tmdbId, mediaType, reportServer, toast]);

  // Track if iframe has loaded
  const iframeLoadedRef = useRef(false);

  // Start fallback timer when embed URL changes
  useEffect(() => {
    iframeLoadedRef.current = false;
    setIsLoading(true);
    setIsFallbackTriggered(false);
    clearFallbackTimer();

    // Start fallback timer if auto-fallback is enabled
    if (autoFallback) {
      fallbackTimerRef.current = setTimeout(() => {
        // Only trigger fallback if iframe hasn't loaded
        if (!iframeLoadedRef.current) {
          handleAutoFallback();
        }
      }, FALLBACK_TIMEOUT_MS);
    }

    // Set a max loading UI time of 2.5s
    const loadTimer = setTimeout(() => setIsLoading(false), 2500);

    return () => {
      clearTimeout(loadTimer);
      clearFallbackTimer();
    };
  }, [embedUrl, autoFallback, clearFallbackTimer, handleAutoFallback]);

  // Reset attempted servers when content changes
  useEffect(() => {
    setAttemptedServers([]);
  }, [tmdbId, selectedSeason, selectedEpisode]);

  useEffect(() => {
    if (mediaType === 'tv') {
      setSearchParams({ s: String(selectedSeason), e: String(selectedEpisode) });
    }
  }, [selectedSeason, selectedEpisode, mediaType, setSearchParams]);

  const handleServerChange = useCallback((server: VideoServer) => {
    if (server.id !== selectedServer.id) {
      setSelectedServer(server);
      setPreferredServer(server); // Remember preference
      setAttemptedServers([]); // Reset attempts when manually changing
      setIsFallbackTriggered(false);
      setExternalEmbedUrl(null); // Clear external source when switching servers
      setExternalSourceName(null);
    }
  }, [selectedServer, setPreferredServer]);

  // Handle external source selection from dialog
  const handleExternalSourceSelect = useCallback((embedUrl: string, sourceName: string) => {
    setExternalEmbedUrl(embedUrl);
    setExternalSourceName(sourceName);
    setIsLoading(true);
    setAttemptedServers([]);
    setIsFallbackTriggered(false);
    toast({
      title: "Playing external source",
      description: `Streaming from ${sourceName}`,
      duration: 3000,
    });
  }, [toast]);

  const handleIframeLoad = useCallback(() => {
    iframeLoadedRef.current = true;
    setIsLoading(false);
    clearFallbackTimer();
  }, [clearFallbackTimer]);

  const handleEpisodeSelect = (episode: number) => {
    setSelectedEpisode(episode);
  };

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(Number(season));
    setSelectedEpisode(1);
  };

  const handleClose = () => {
    navigate(-1);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  const primaryServers = getServersByCategory('primary');
  const dubbedServers = getServersByCategory('dubbed');
  const backupServers = getServersByCategory('backup');

  if (isContentLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-background/80 backdrop-blur-sm border-b border-border/50 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 sm:h-9 sm:w-9">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={wellplayerLogo} alt="Wellplayer" className="h-5 w-5 sm:h-6 sm:w-6 rounded" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden sm:inline">Wellplayer</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Report Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleReportServer}
            disabled={isReported}
            className={`h-8 w-8 sm:h-9 sm:w-9 ${isReported ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
            title={isReported ? 'Server already reported' : 'Report broken server'}
          >
            <Flag className={`h-4 w-4 ${isReported ? 'fill-current' : ''}`} />
          </Button>

          {/* External Sources Button */}
          <ExternalSourcesDialog
            title={title || 'Unknown'}
            mediaType={mediaType as 'movie' | 'tv'}
            year={String(releaseYear)}
            tmdbId={tmdbId}
            season={mediaType === 'tv' ? selectedSeason : undefined}
            episode={mediaType === 'tv' ? selectedEpisode : undefined}
            onSelectSource={handleExternalSourceSelect}
          />

          {/* Settings Dialog */}
          <ServerSettingsDialog />

          {/* Server Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
                <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">
                  {externalSourceName ? `🌐 ${externalSourceName}` : `${selectedServer.flag} ${selectedServer.name}`}
                </span>
                {!externalSourceName && isReported && <span className="text-[10px] bg-destructive/20 text-destructive px-1 rounded">⚠️</span>}
                {!externalSourceName && autoFallback && !isReported && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1 rounded hidden sm:inline">AUTO</span>}
                {externalSourceName && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">EXT</span>}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover max-h-80 overflow-y-auto">
              {/* Primary servers */}
              <div className="px-2 py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase">Primary</div>
              {primaryServers.map((server) => {
                const serverReported = isServerReported(server.id, tmdbId, mediaType as 'movie' | 'tv');
                return (
                  <DropdownMenuItem
                    key={server.id}
                    onClick={() => handleServerChange(server)}
                    className="flex items-center justify-between gap-2 cursor-pointer text-xs sm:text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span>{server.flag}</span>
                      <span className={serverReported ? 'line-through opacity-50' : ''}>{server.name}</span>
                      {serverReported && <span className="text-[10px] text-destructive">⚠️</span>}
                    </span>
                    {selectedServer.id === server.id && (
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
              
              {/* Dubbed / Multi-language servers */}
              <div className="px-2 py-1 mt-1 text-[10px] sm:text-xs font-semibold text-amber-500 uppercase border-t border-border/50">🔊 Dubbed / Regional</div>
              {dubbedServers.map((server) => {
                const serverReported = isServerReported(server.id, tmdbId, mediaType as 'movie' | 'tv');
                return (
                  <DropdownMenuItem
                    key={server.id}
                    onClick={() => handleServerChange(server)}
                    className="flex items-center justify-between gap-2 cursor-pointer text-xs sm:text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span>{server.flag}</span>
                      <span className={serverReported ? 'line-through opacity-50' : ''}>{server.name}</span>
                      {serverReported && <span className="text-[10px] text-destructive">⚠️</span>}
                    </span>
                    {selectedServer.id === server.id && (
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
              
              {/* Backup servers */}
              <div className="px-2 py-1 mt-1 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase border-t border-border/50">Backup</div>
              {backupServers.map((server) => {
                const serverReported = isServerReported(server.id, tmdbId, mediaType as 'movie' | 'tv');
                return (
                  <DropdownMenuItem
                    key={server.id}
                    onClick={() => handleServerChange(server)}
                    className="flex items-center justify-between gap-2 cursor-pointer text-xs sm:text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span>{server.flag}</span>
                      <span className={serverReported ? 'line-through opacity-50' : ''}>{server.name}</span>
                      {serverReported && <span className="text-[10px] text-destructive">⚠️</span>}
                    </span>
                    {selectedServer.id === server.id && (
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Player Area */}
        <div className="flex-shrink-0 w-full lg:flex-1 bg-black relative">
          <div className="relative w-full aspect-video lg:h-full" onClick={toggleControls}>
            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black"
                >
                  <motion.img
                    src={wellplayerLogo}
                    alt="Loading"
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl mb-3 sm:mb-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <p className="text-white/60 text-xs sm:text-sm mb-2">
                    Loading {mediaType === 'tv' ? `S${selectedSeason} E${selectedEpisode}` : 'movie'}...
                  </p>
                  
                  {/* Server info */}
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <span>{selectedServer.flag} {selectedServer.name}</span>
                    {autoFallback && (
                      <span className="flex items-center gap-1 text-amber-500/60">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Auto-switching in 10s
                      </span>
                    )}
                  </div>

                  {/* Fallback notice */}
                  {isFallbackTriggered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 text-amber-500 text-xs"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Previous server timed out
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Iframe */}
            <iframe
              ref={iframeRef}
              key={embedUrl}
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="origin"
              title="Video Player"
              onLoad={handleIframeLoad}
            />

            {/* Overlay Controls */}
            <AnimatePresence>
              {showControls && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                >
                  <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14 sm:h-18 sm:w-18 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Play className="h-6 w-6 sm:h-7 sm:w-7 ml-0.5" fill="currentColor" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                    <p className="text-white/60 text-[10px] sm:text-xs">
                      Use player's built-in controls for playback
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info Panel */}
        <ScrollArea className="flex-1 lg:w-80 xl:w-96 lg:flex-none lg:border-l border-border/50">
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Title & Meta */}
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">{title}</h1>
              {mediaType === 'tv' && (
                <p className="text-primary font-medium text-sm sm:text-base mb-2">
                  Season {selectedSeason}, Episode {selectedEpisode}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" fill="currentColor" />
                  {rating}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  {releaseYear}
                </span>
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    {runtime}
                  </span>
                )}
              </div>
            </div>

            {/* Overview */}
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2">Overview</h2>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-4 sm:line-clamp-none">
                {overview || 'No overview available.'}
              </p>
            </div>

            {/* TV Show: Season & Episode Selector */}
            {mediaType === 'tv' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Season Selector */}
                <div>
                  <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2">Season</h2>
                  <Select value={String(selectedSeason)} onValueChange={handleSeasonChange}>
                    <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {Array.from({ length: seasons }, (_, i) => i + 1).map((s) => (
                        <SelectItem key={s} value={String(s)} className="text-xs sm:text-sm">
                          Season {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Episode List */}
                <div>
                  <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3">
                    Episodes {seasonLoading && <span className="text-muted-foreground/60">(loading...)</span>}
                  </h2>
                  <EpisodeList
                    episodes={episodes}
                    currentEpisode={selectedEpisode}
                    onEpisodeSelect={handleEpisodeSelect}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default WatchPage;
