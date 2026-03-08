import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Info, Star, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TMDBMovie, TMDBTVShow, tmdbApi } from '@/lib/api/tmdb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  items: (TMDBMovie | TMDBTVShow)[];
  isLoading?: boolean;
}

// Type guard to check if it's a movie
const isMovie = (item: TMDBMovie | TMDBTVShow): item is TMDBMovie => {
  return 'title' in item;
};

export const HeroSection = ({ items, isLoading }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const validItems = items.filter(item => item.backdrop_path);
  const featured = validItems[currentIndex];

  // Auto-advance every 10 seconds
  useEffect(() => {
    if (validItems.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % validItems.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [validItems.length]);

  const goTo = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % validItems.length);
  }, [validItems.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + validItems.length) % validItems.length);
  }, [validItems.length]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  if (isLoading || !featured) {
    return (
      <section className="relative h-[80vh] min-h-[600px] max-h-[900px] overflow-hidden">
        <Skeleton className="absolute inset-0" />
        <div className="relative h-full container mx-auto px-4 flex items-center">
          <div className="max-w-2xl">
            <Skeleton className="h-16 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-24 w-full mb-8" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const title = isMovie(featured) ? featured.title : featured.name;
  const releaseDate = isMovie(featured) ? featured.release_date : featured.first_air_date;
  const mediaType = isMovie(featured) ? 'movie' : 'tv';
  const backdropUrl = tmdbApi.getBackdropUrl(featured.backdrop_path);
  const genres = featured.genres?.slice(0, 3) || [];

  const handlePlay = () => {
    navigate(`/${mediaType}/${featured.id}`);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <section 
      className="relative h-[55vh] sm:h-[65vh] md:h-[75vh] lg:h-[80vh] min-h-[350px] max-h-[700px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image with animation */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={featured.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20 md:via-background/60 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent md:via-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {validItems.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-end pb-12 sm:pb-16 md:items-center md:pb-0 z-10">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={featured.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                  {genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-secondary/60 text-muted-foreground backdrop-blur-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-4 tracking-tight leading-tight">
                {title}
              </h1>

              {/* Meta info */}
              <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/90">
                  <Star className="h-3 w-3 md:h-4 md:w-4 text-black" fill="currentColor" />
                  <span className="text-black font-bold text-xs md:text-sm">{featured.vote_average.toFixed(1)}</span>
                  <span className="text-black/70 font-medium text-[10px] md:text-xs">IMDb</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                  {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
                </span>
                <span className="capitalize">{mediaType}</span>
              </div>

              {/* Overview */}
              <p className="hidden sm:block text-muted-foreground text-sm md:text-base lg:text-lg leading-relaxed mb-6 md:mb-8 line-clamp-2 md:line-clamp-3 lg:line-clamp-4">
                {featured.overview}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 md:gap-4">
                <Button size="default" className="gap-2 px-6 md:px-8 flex-1 sm:flex-none" onClick={handlePlay}>
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  Play
                </Button>
                <Button size="default" variant="secondary" className="gap-2 flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  My List
                </Button>
                <Button size="default" variant="ghost" className="gap-2 hidden sm:flex" onClick={handlePlay}>
                  <Info className="h-4 w-4 md:h-5 md:w-5" />
                  More Info
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Thumbnail strip */}
      {validItems.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-full max-w-[90%] md:max-w-2xl">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-2 py-1">
            {validItems.slice(0, 10).map((item, idx) => {
              const itemTitle = isMovie(item) ? item.title : item.name;
              const posterUrl = item.poster_path 
                ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
                : null;
              
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "relative flex-shrink-0 rounded-md overflow-hidden transition-all duration-300 group",
                    idx === currentIndex 
                      ? "ring-2 ring-primary scale-105" 
                      : "opacity-60 hover:opacity-100 hover:scale-102"
                  )}
                  aria-label={`Go to ${itemTitle}`}
                >
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={itemTitle}
                      className="h-14 w-10 md:h-16 md:w-11 object-cover"
                    />
                  ) : (
                    <div className="h-14 w-10 md:h-16 md:w-11 bg-secondary flex items-center justify-center">
                      <span className="text-[8px] text-muted-foreground text-center px-0.5 line-clamp-2">
                        {itemTitle}
                      </span>
                    </div>
                  )}
                  {/* Progress indicator for current */}
                  {idx === currentIndex && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 10, ease: 'linear' }}
                      key={`progress-${currentIndex}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
