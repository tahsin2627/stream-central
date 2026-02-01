import { Link } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWatchHistory, WatchHistoryItem } from '@/hooks/useWatchHistory';
import { tmdbApi } from '@/lib/api/tmdb';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ContinueWatchingCardProps {
  item: WatchHistoryItem;
  onRemove: (id: string) => void;
}

const ContinueWatchingCard = ({ item, onRemove }: ContinueWatchingCardProps) => {
  const posterUrl = tmdbApi.getPosterUrl(item.poster_path);
  const backdropUrl = tmdbApi.getBackdropUrl(item.backdrop_path, 'w780');
  const progress = item.duration_seconds 
    ? Math.min((item.progress_seconds / item.duration_seconds) * 100, 100)
    : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  const timeLeft = item.duration_seconds 
    ? formatTime(item.duration_seconds - item.progress_seconds)
    : null;

  const linkPath = item.media_type === 'movie' 
    ? `/movie/${item.tmdb_id}`
    : `/tv/${item.tmdb_id}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative flex-shrink-0 w-[280px] md:w-[340px]"
    >
      <Link to={linkPath}>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
          {(backdropUrl || posterUrl) ? (
            <img
              src={backdropUrl || posterUrl || ''}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-lg">
              <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-sm text-white line-clamp-1 mb-1">
              {item.title}
              {item.media_type === 'tv' && item.season && item.episode && (
                <span className="text-white/70 font-normal ml-2">
                  S{item.season} E{item.episode}
                </span>
              )}
            </h3>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress value={progress} className="h-1 bg-white/20" />
              {timeLeft && (
                <p className="text-[11px] text-white/60">{timeLeft}</p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const ContinueWatchingCarousel = () => {
  const { continueWatching, isLoading, removeFromHistory } = useWatchHistory();

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-6">Continue Watching</h2>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[280px] md:w-[340px] aspect-video rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!continueWatching || continueWatching.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6">Continue Watching</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {continueWatching.map((item) => (
            <ContinueWatchingCard
              key={item.id}
              item={item}
              onRemove={removeFromHistory}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
