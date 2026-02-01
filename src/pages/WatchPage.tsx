import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Clock, Server, ChevronDown, Check, Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMovieDetails, useTVShowDetails, useSeasonDetails } from '@/hooks/useTMDB';
import { tmdbApi } from '@/lib/api/tmdb';
import { EpisodeList } from '@/components/player/EpisodeList';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

interface VideoServer {
  id: string;
  name: string;
  flag: string;
  getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => string;
}

const VIDEO_SERVERS: VideoServer[] = [
  {
    id: 'autoembed',
    name: 'Crown',
    flag: '🇺🇸',
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
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.pro/embed/${mediaType}/${tmdbId}`;
    },
  },
  {
    id: '2embed',
    name: 'Orion',
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
    name: 'Cine',
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
    name: 'Beta',
    flag: '🇮🇳',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.su/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'smashystream',
    name: 'Nexon',
    flag: '🇺🇸',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`;
      }
      return `https://player.smashy.stream/movie/${tmdbId}`;
    },
  },
  {
    id: 'moviesapi',
    name: 'Hindi',
    flag: '🇮🇳',
    getUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`;
      }
      return `https://moviesapi.club/movie/${tmdbId}`;
    },
  },
];

const WatchPage = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const initialSeason = Number(searchParams.get('s')) || 1;
  const initialEpisode = Number(searchParams.get('e')) || 1;

  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [selectedServer, setSelectedServer] = useState<VideoServer>(VIDEO_SERVERS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const tmdbId = Number(id);

  const { data: movie, isLoading: movieLoading } = useMovieDetails(
    mediaType === 'movie' ? tmdbId : 0
  );
  const { data: tvShow, isLoading: tvLoading } = useTVShowDetails(
    mediaType === 'tv' ? tmdbId : 0
  );
  
  // Fetch real episode data from TMDB
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

  // Use real episode data from TMDB or fallback to placeholder
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

  const embedUrl = selectedServer.getUrl(tmdbId, mediaType, selectedSeason, selectedEpisode);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [embedUrl]);

  useEffect(() => {
    if (mediaType === 'tv') {
      setSearchParams({ s: String(selectedSeason), e: String(selectedEpisode) });
    }
  }, [selectedSeason, selectedEpisode, mediaType, setSearchParams]);

  const handleServerChange = (server: VideoServer) => {
    if (server.id !== selectedServer.id) {
      setSelectedServer(server);
    }
  };

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

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      // Auto-hide after 3 seconds
      setTimeout(() => setShowControls(false), 3000);
    }
  };

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

        {/* Server Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
              <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">{selectedServer.flag} {selectedServer.name}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-popover">
            {VIDEO_SERVERS.map((server) => (
              <DropdownMenuItem
                key={server.id}
                onClick={() => handleServerChange(server)}
                className="flex items-center justify-between gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <span className="flex items-center gap-2">
                  <span>{server.flag}</span>
                  <span>{server.name}</span>
                </span>
                {selectedServer.id === server.id && (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                  <p className="text-white/60 text-xs sm:text-sm">
                    Loading {mediaType === 'tv' ? `S${selectedSeason} E${selectedEpisode}` : 'movie'}...
                  </p>
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
            />

            {/* Overlay Controls - for skipping ads */}
            <AnimatePresence>
              {showControls && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                >
                  <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
                    {/* Rewind 10s */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Note: Can't control iframe, but UI is there for when player supports postMessage
                      }}
                    >
                      <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14 sm:h-18 sm:w-18 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Play className="h-6 w-6 sm:h-7 sm:w-7 ml-0.5" fill="currentColor" />
                    </Button>

                    {/* Forward 10s */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>

                  {/* Tip text */}
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