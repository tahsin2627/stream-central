import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Clock, Server, ChevronDown, Check, X } from 'lucide-react';
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
import { useMovieDetails, useTVShowDetails } from '@/hooks/useTMDB';
import { tmdbApi } from '@/lib/api/tmdb';
import { EpisodeList } from '@/components/player/EpisodeList';
import { useIsMobile } from '@/hooks/use-mobile';
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

const WatchPage = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  const initialSeason = Number(searchParams.get('s')) || 1;
  const initialEpisode = Number(searchParams.get('e')) || 1;

  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [selectedServer, setSelectedServer] = useState<VideoServer>(VIDEO_SERVERS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const tmdbId = Number(id);

  const { data: movie, isLoading: movieLoading } = useMovieDetails(
    mediaType === 'movie' ? tmdbId : 0
  );
  const { data: tvShow, isLoading: tvLoading } = useTVShowDetails(
    mediaType === 'tv' ? tmdbId : 0
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
  const posterUrl = content ? tmdbApi.getPosterUrl(content.poster_path) : null;

  // Generate episode list (assuming ~20 episodes per season as default)
  const episodes = Array.from({ length: 20 }, (_, i) => ({
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

  if (isContentLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={wellplayerLogo} alt="Wellplayer" className="h-6 w-6 rounded" />
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Wellplayer</span>
          </div>
        </div>

        {/* Server Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">{selectedServer.flag} {selectedServer.name}</span>
              <span className="sm:hidden">{selectedServer.flag}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {VIDEO_SERVERS.map((server) => (
              <DropdownMenuItem
                key={server.id}
                onClick={() => handleServerChange(server)}
                className="flex items-center justify-between gap-2 cursor-pointer"
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
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Player Area */}
        <div className="flex-shrink-0 w-full lg:flex-1 bg-black">
          <div className="relative w-full aspect-video lg:h-full">
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
                    className="h-16 w-16 rounded-xl mb-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <p className="text-white/60 text-sm">Loading {mediaType === 'tv' ? `S${selectedSeason} E${selectedEpisode}` : 'movie'}...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Iframe */}
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="origin"
              title="Video Player"
            />
          </div>
        </div>

        {/* Info Panel */}
        <ScrollArea className="flex-1 lg:w-96 lg:flex-none lg:border-l border-border/50">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Title & Meta */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">{title}</h1>
              {mediaType === 'tv' && (
                <p className="text-primary font-medium mb-2">
                  Season {selectedSeason}, Episode {selectedEpisode}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                  {rating}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {releaseYear}
                </span>
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {runtime}
                  </span>
                )}
              </div>
            </div>

            {/* Overview */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Overview</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {overview || 'No overview available.'}
              </p>
            </div>

            {/* TV Show: Season & Episode Selector */}
            {mediaType === 'tv' && (
              <div className="space-y-4">
                {/* Season Selector */}
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-2">Season</h2>
                  <Select value={String(selectedSeason)} onValueChange={handleSeasonChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: seasons }, (_, i) => i + 1).map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          Season {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Episode List */}
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3">Episodes</h2>
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
