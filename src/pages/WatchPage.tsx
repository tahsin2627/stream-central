import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import wellplayerLogo from '@/assets/wellplayer-logo.png';

const WatchPage = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSeason = Number(searchParams.get('s')) || 1;
  const initialEpisode = Number(searchParams.get('e')) || 1;

  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [isLoading, setIsLoading] = useState(true);

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

  // Generate episode list (assuming ~20 episodes per season as default)
  const episodes = Array.from({ length: 20 }, (_, i) => ({
    number: i + 1,
    name: `Episode ${i + 1}`,
  }));

  // Autoembed URL - uses their native player UI with server selector and settings
  const embedUrl = mediaType === 'tv' 
    ? `https://player.autoembed.cc/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`
    : `https://player.autoembed.cc/embed/movie/${tmdbId}`;

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [embedUrl]);

  useEffect(() => {
    if (mediaType === 'tv') {
      setSearchParams({ s: String(selectedSeason), e: String(selectedEpisode) });
    }
  }, [selectedSeason, selectedEpisode, mediaType, setSearchParams]);

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

        {/* Title in header for mobile */}
        <div className="flex-1 text-center px-2 sm:hidden">
          <p className="text-xs font-medium truncate">{title}</p>
          {mediaType === 'tv' && (
            <p className="text-[10px] text-muted-foreground">S{selectedSeason} E{selectedEpisode}</p>
          )}
        </div>

        <div className="w-8 sm:w-9" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Player Area - The embed has its own server selector and settings */}
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

            {/* Video Iframe - Autoembed has native server selector and quality settings */}
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
                  <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3">Episodes</h2>
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