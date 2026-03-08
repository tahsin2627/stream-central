import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Clock, Server, ChevronDown, Check, Play, RotateCcw, RotateCw, AlertTriangle, Loader2, Flag, Zap, RefreshCw } from 'lucide-react';
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
import { useServerHealth, getServerTestUrls } from '@/hooks/useServerHealth';
import { EpisodeList } from '@/components/player/EpisodeList';
import { ServerSettingsDialog } from '@/components/player/ServerSettingsDialog';
import { ExternalSourcesDialog } from '@/components/player/ExternalSourcesDialog';
import { LoadingOverlay } from '@/components/player/LoadingOverlay';
import { LanguageSelector } from '@/components/player/LanguageSelector';
import { PlayerControlBar } from '@/components/player/PlayerControlBar';
import { VideoOverlay } from '@/components/player/VideoOverlay';
import { NativePlayer } from '@/components/player/NativePlayer';
import { ServerHealthBadge } from '@/components/player/ServerHealthBadge';
import { useToast } from '@/hooks/use-toast';
import wellplayerLogo from '@/assets/wellplayer-logo.png';
import { AddCustomStreamDialog } from '@/components/player/AddCustomStreamDialog';
import { useCustomStreams } from '@/hooks/useCustomStreams';
import { useStreamExtraction, StreamSource } from '@/hooks/useStreamExtraction';
import { useIOSDetection } from '@/hooks/useIOSDetection';
import { TapToPlayOverlay } from '@/components/player/TapToPlayOverlay';
import { UnmuteBanner } from '@/components/player/UnmuteBanner';
import { ElementBlocker } from '@/components/player/ElementBlocker';
const FALLBACK_TIMEOUT_MS = 10000; // 10 seconds

const WatchPage = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const paramSeason = Number(searchParams.get('s')) || 1;
  const paramEpisode = Number(searchParams.get('e')) || 1;

  const [selectedSeason, setSelectedSeason] = useState(paramSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(paramEpisode);

  // Sync URL params → state when URL changes externally (e.g. browser navigation)
  useEffect(() => {
    if (paramSeason !== selectedSeason) setSelectedSeason(paramSeason);
    if (paramEpisode !== selectedEpisode) setSelectedEpisode(paramEpisode);
  }, [paramSeason, paramEpisode]);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedServers, setAttemptedServers] = useState<string[]>([]);
  const [isFallbackTriggered, setIsFallbackTriggered] = useState(false);
  const [useNativePlayer, setUseNativePlayer] = useState(false);
  const [nativeSources, setNativeSources] = useState<StreamSource[]>([]);
  const [externalEmbedUrl, setExternalEmbedUrl] = useState<string | null>(null);
  const [userGestureGiven, setUserGestureGiven] = useState(false);
  const [iframeStallCount, setIframeStallCount] = useState(0);
  
  // iOS detection
  const { needsUserGesture } = useIOSDetection();
  const showTapToPlay = needsUserGesture && !userGestureGiven;
  
  // Stream extraction hook
  const { extractStreams, isExtracting, sources: extractedSources } = useStreamExtraction();

  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const tmdbId = Number(id);

  // Get title for AI engine (needs to be declared before using in hook)
  const { data: movieData } = useMovieDetails(type === 'movie' ? Number(id) : 0);
  const { data: tvData } = useTVShowDetails(type === 'tv' ? Number(id) : 0);
  const contentTitle = type === 'movie' ? movieData?.title : tvData?.name;
  const contentYear = type === 'movie' 
    ? movieData?.release_date?.split('-')[0] 
    : tvData?.first_air_date?.split('-')[0];

  // Removed non-functional AI Stream Engine

  const { 
    preferredServer, 
    setPreferredServer, 
    autoFallback,
    reportServer,
    isServerReported,
    languagePreference,
  } = useServerPreference();

  // Custom streams integration
  const { getCustomStream, customStreams } = useCustomStreams();
  const customStream = getCustomStream(tmdbId, mediaType as 'movie' | 'tv', 
    mediaType === 'tv' ? selectedSeason : undefined, 
    mediaType === 'tv' ? selectedEpisode : undefined
  );

  // Create a "My Server" option if custom stream exists
  const myServerOption: VideoServer | null = customStream ? {
    id: 'my-server',
    name: customStream.stream_name || 'My Server',
    flag: '⭐',
    category: 'primary',
    getUrl: () => customStream.stream_url,
  } : null;

  const [selectedServer, setSelectedServer] = useState<VideoServer>(preferredServer);
  const isReported = isServerReported(selectedServer.id, tmdbId, mediaType as 'movie' | 'tv');

  // Auto-select My Server if available and not already selected
  useEffect(() => {
    if (myServerOption && selectedServer.id !== 'my-server') {
      // Only auto-switch if user hasn't manually selected a different server
      const hasManualSelection = localStorage.getItem('wellplayer_manual_server_selection');
      if (!hasManualSelection) {
        setSelectedServer(myServerOption);
      }
    }
  }, [customStream?.id]);

  // Sync selected server when language preference OR preferredServer changes
  useEffect(() => {
    // Always sync to preferredServer when it changes (except if using custom "my-server")
    if (selectedServer.id !== 'my-server') {
      if (preferredServer.id !== selectedServer.id) {
        console.log('Language/server preference changed, syncing to:', preferredServer.name);
        setSelectedServer(preferredServer);
        toast({
          title: "Server switched",
          description: `Now using ${preferredServer.flag} ${preferredServer.name}`,
          duration: 2000,
        });
      }
    }
  }, [preferredServer.id]);

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

  // Embed URL from selected server or external source
  const embedUrl = externalEmbedUrl || selectedServer.getUrl(tmdbId, mediaType, selectedSeason, selectedEpisode);
  const currentSourceName = externalEmbedUrl ? '🔗 External' : `${selectedServer.flag} ${selectedServer.name}`;

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

  // Reset attempted servers and manual selection when content changes
  useEffect(() => {
    setAttemptedServers([]);
    localStorage.removeItem('wellplayer_manual_server_selection');
  }, [tmdbId, selectedSeason, selectedEpisode]);

  useEffect(() => {
    if (mediaType === 'tv') {
      setSearchParams({ s: String(selectedSeason), e: String(selectedEpisode) });
    }
  }, [selectedSeason, selectedEpisode, mediaType, setSearchParams]);

  const handleServerChange = useCallback((server: VideoServer) => {
    if (server.id !== selectedServer.id) {
      setSelectedServer(server);
      setExternalEmbedUrl(null); // Clear external embed when manually changing server
      if (server.id !== 'my-server') {
        setPreferredServer(server); // Remember preference (not for custom server)
      }
      setAttemptedServers([]); // Reset attempts when manually changing
      setIsFallbackTriggered(false);
      // Mark that user has made a manual selection
      localStorage.setItem('wellplayer_manual_server_selection', 'true');
      // Use replaceState to prevent server changes from creating history entries
      window.history.replaceState(window.history.state, '', window.location.href);
    }
  }, [selectedServer, setPreferredServer]);

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
    // Check if there's history to go back to, otherwise go home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
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
      <header className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-background/80 backdrop-blur-sm border-b border-border/50 z-20">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 sm:h-9 sm:w-9">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <img src={wellplayerLogo} alt="Wellplayer" className="h-5 w-5 sm:h-6 sm:w-6 rounded" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden md:inline">Wellplayer</span>
          </div>
        </div>

        {/* Scrollable controls container for small screens */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto hide-scrollbar max-w-[calc(100%-80px)] sm:max-w-none">
          {/* Native Player Toggle Button */}
          <Button
            variant={useNativePlayer ? "default" : "ghost"}
            size="sm"
            onClick={async () => {
              if (!useNativePlayer) {
                // Extract streams and switch to native player
                toast({
                  title: "Extracting stream...",
                  description: "Finding direct video source",
                });
                const result = await extractStreams({
                  tmdbId,
                  mediaType: mediaType as 'movie' | 'tv',
                  season: mediaType === 'tv' ? selectedSeason : undefined,
                  episode: mediaType === 'tv' ? selectedEpisode : undefined,
                });
                if (result.success && result.sources && result.sources.length > 0) {
                  setNativeSources(result.sources);
                  setUseNativePlayer(true);
                  toast({
                    title: "Native player ready!",
                    description: `Found ${result.sources.length} stream(s) from ${result.provider}`,
                  });
                } else {
                  toast({
                    title: "No streams found",
                    description: result.error || "This content requires iframe playback",
                    variant: "destructive",
                  });
                }
              } else {
                setUseNativePlayer(false);
                setNativeSources([]);
              }
            }}
            disabled={isExtracting}
            className={`h-8 sm:h-9 px-2 sm:px-3 gap-1.5 ${useNativePlayer ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            title={useNativePlayer ? 'Using native player (no ads!)' : 'Try native player'}
          >
            {isExtracting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            <span className="text-xs hidden sm:inline">{useNativePlayer ? 'Native' : 'Try Native'}</span>
          </Button>

          {/* Quick Shuffle Server Button - simpler than removed AI Engine */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Get next server
              const nextServer = getNextServer(selectedServer, [selectedServer.id], tmdbId, mediaType as 'movie' | 'tv');
              if (nextServer) {
                handleServerChange(nextServer);
                toast({
                  title: "Server shuffled",
                  description: `Trying ${nextServer.flag} ${nextServer.name}`,
                });
              }
            }}
            className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 text-muted-foreground"
            title="Try another server"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="text-xs hidden sm:inline">Shuffle</span>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleReportServer}
            disabled={isReported || useNativePlayer}
            className={`h-8 w-8 sm:h-9 sm:w-9 ${isReported ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
            title={isReported ? 'Server already reported' : 'Report broken server'}
          >
            <Flag className={`h-4 w-4 ${isReported ? 'fill-current' : ''}`} />
          </Button>

          {/* Add Custom Stream Button */}
          <AddCustomStreamDialog
            tmdbId={tmdbId}
            mediaType={mediaType as 'movie' | 'tv'}
            season={mediaType === 'tv' ? selectedSeason : undefined}
            episode={mediaType === 'tv' ? selectedEpisode : undefined}
            title={title}
          />

          {/* External Sources Button */}
          <ExternalSourcesDialog
            title={title || 'Unknown'}
            mediaType={mediaType as 'movie' | 'tv'}
            year={String(releaseYear)}
            tmdbId={tmdbId}
            season={mediaType === 'tv' ? selectedSeason : undefined}
            episode={mediaType === 'tv' ? selectedEpisode : undefined}
            onPlayInApp={(url, sourceName) => {
              setExternalEmbedUrl(url);
              setUseNativePlayer(false);
              setIsLoading(true);
              toast({
                title: "Playing in WellPlayer",
                description: `Now using ${sourceName}`,
              });
            }}
          />

          {/* Language Selector - Prominent in header */}
          <LanguageSelector compact />

          {/* Settings Dialog */}
          <ServerSettingsDialog />

          {/* Server Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-1.5 sm:px-3 shrink-0">
                <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-sm whitespace-nowrap">
                  {selectedServer.flag} <span className="hidden xs:inline">{selectedServer.name}</span>
                </span>
                {isReported && <span className="text-[10px] bg-destructive/20 text-destructive px-0.5 rounded">⚠️</span>}
                {autoFallback && !isReported && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-0.5 rounded hidden sm:inline">AUTO</span>}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover max-h-80 overflow-y-auto">
              {/* My Server - Custom Stream (if available) */}
              {myServerOption && (
                <>
                  <div className="px-2 py-1 text-[10px] sm:text-xs font-semibold text-primary uppercase">⭐ My Server</div>
                  <DropdownMenuItem
                    onClick={() => handleServerChange(myServerOption)}
                    className="flex items-center justify-between gap-2 cursor-pointer text-xs sm:text-sm bg-primary/10"
                  >
                    <span className="flex items-center gap-2">
                      <span>⭐</span>
                      <span className="font-medium">{customStream?.stream_name || 'My Server'}</span>
                    </span>
                    {selectedServer.id === 'my-server' && (
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Dubbed / Hindi servers - TOP PRIORITY */}
              <div className="px-2 py-1 text-[10px] sm:text-xs font-semibold text-amber-500 uppercase">🔊 Hindi / Dubbed</div>
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
                      <ServerHealthBadge serverId={server.id} compact />
                    </span>
                    {selectedServer.id === server.id && (
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
              
              {/* Primary servers (English/International) */}
              <div className="px-2 py-1 mt-1 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase border-t border-border/50">Primary (English)</div>
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
                      <ServerHealthBadge serverId={server.id} compact />
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
                      <ServerHealthBadge serverId={server.id} compact />
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
        <div className="flex-shrink-0 w-full lg:flex-1 bg-black relative flex flex-col player-container" style={{ overflow: 'hidden' }}>
          <div className="relative w-full aspect-video lg:flex-1" style={{ overflow: 'hidden' }}>
            {/* Native Player Mode */}
            {useNativePlayer && nativeSources.length > 0 ? (
              <NativePlayer
                sources={nativeSources}
                title={title}
                poster={content?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${content.backdrop_path}` : undefined}
                isTV={mediaType === 'tv'}
                onPrevEpisode={() => {
                  if (selectedEpisode > 1) setSelectedEpisode(selectedEpisode - 1);
                }}
                onNextEpisode={() => setSelectedEpisode(selectedEpisode + 1)}
                hasPrev={selectedEpisode > 1}
                hasNext={mediaType === 'tv'}
                onError={() => {
                  toast({
                    title: "Playback failed",
                    description: "Switching back to iframe mode",
                    variant: "destructive",
                  });
                  setUseNativePlayer(false);
                  setNativeSources([]);
                }}
              />
            ) : (
              <>
                {/* iOS/Brave Tap-to-Play Overlay */}
                {showTapToPlay && (
                  <TapToPlayOverlay
                    title={title}
                    serverName={selectedServer.name}
                    serverFlag={selectedServer.flag}
                    onPlay={() => setUserGestureGiven(true)}
                  />
                )}

                {/* Loading Overlay */}
                <AnimatePresence>
                  {isLoading && !useNativePlayer && !showTapToPlay && (
                    <LoadingOverlay
                      mediaType={mediaType as 'movie' | 'tv'}
                      season={selectedSeason}
                      episode={selectedEpisode}
                      serverName={selectedServer.name}
                      serverFlag={selectedServer.flag}
                      autoFallback={autoFallback}
                      isFallbackTriggered={isFallbackTriggered}
                      title={title}
                    />
                  )}
                </AnimatePresence>

                {/* Video Iframe - Only load after user gesture on iOS */}
                {!showTapToPlay && (
                  <iframe
                    ref={iframeRef}
                    key={embedUrl}
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    referrerPolicy="no-referrer"
                    title="Video Player"
                    onLoad={handleIframeLoad}
                    onError={() => {
                      // Track stall count for smarter fallback
                      setIframeStallCount(prev => prev + 1);
                      if (iframeStallCount >= 1) {
                        // After 2 fails on same server, auto-switch
                        handleAutoFallback();
                        setIframeStallCount(0);
                      } else {
                        handleAutoFallback();
                      }
                    }}
                  />
                )}

                {/* Unmute hint for iOS - iframe audio may be muted by browser */}
                {needsUserGesture && userGestureGiven && !isLoading && (
                  <UnmuteBanner
                    isMuted={true}
                    onUnmute={() => {
                      // Can't directly unmute iframe, but dismiss the banner
                      // The tap gesture itself helps iOS allow audio
                    }}
                    autoDismissMs={6000}
                  />
                )}

                {/* Video Controls Overlay - Tap to show/hide */}
                {!isLoading && !showTapToPlay && (
                  <VideoOverlay showInitially={false} />
                )}
              </>
            )}
          </div>

          {/* Persistent Control Bar - Below video */}
          <PlayerControlBar
            mediaType={mediaType as 'movie' | 'tv'}
            currentServer={`${selectedServer.flag} ${selectedServer.name}`}
            onRefresh={() => {
              // Force re-render of iframe
              const currentUrl = embedUrl;
              if (iframeRef.current) {
                iframeRef.current.src = '';
                setTimeout(() => {
                  if (iframeRef.current) {
                    iframeRef.current.src = currentUrl;
                  }
                }, 100);
              }
              setIsLoading(true);
            }}
            onSwitchServer={() => {
              // Switch to next available server
              handleAutoFallback();
            }}
            onPrevEpisode={() => {
              if (selectedEpisode > 1) {
                setSelectedEpisode(selectedEpisode - 1);
              }
            }}
            onNextEpisode={() => {
              setSelectedEpisode(selectedEpisode + 1);
            }}
            hasPrev={selectedEpisode > 1}
            hasNext={mediaType === 'tv'}
          />
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
