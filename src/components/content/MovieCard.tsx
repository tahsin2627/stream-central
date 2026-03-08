import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { tmdbApi, TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';
import { WatchlistButton } from './WatchlistButton';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  item: TMDBMovie | TMDBTVShow;
  index?: number;
  size?: 'default' | 'large';
}

// Type guard to check if it's a movie
const isMovie = (item: TMDBMovie | TMDBTVShow): item is TMDBMovie => {
  return 'title' in item;
};

export const MovieCard = ({ item, index = 0, size = 'default' }: MovieCardProps) => {
  const title = isMovie(item) ? item.title : item.name;
  const releaseDate = isMovie(item) ? item.release_date : item.first_air_date;
  const mediaType = isMovie(item) ? 'movie' : 'tv';
  const posterUrl = tmdbApi.getPosterUrl(item.poster_path);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className={cn(
        'group relative flex-shrink-0 cursor-pointer',
        size === 'large' 
          ? 'w-[140px] sm:w-[200px] md:w-[280px] lg:w-[320px]' 
          : 'w-[120px] sm:w-[140px] md:w-[160px] lg:w-[200px]'
      )}
    >
      <Link to={`/${mediaType}/${item.id}`}>
        {/* Poster */}
        <div
          className={cn(
            'relative overflow-hidden rounded-lg bg-secondary',
            'aspect-[2/3]'
          )}
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs md:text-sm">
              No Image
            </div>
          )}

          {/* Mobile: Show IMDb-style rating badge always */}
          <div className="absolute top-2 right-2 md:hidden flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/90 backdrop-blur-sm">
            <Star className="h-2.5 w-2.5 text-black" fill="currentColor" />
            <span className="text-[10px] text-black font-bold">{item.vote_average?.toFixed(1) ?? 'N/A'}</span>
          </div>

          {/* Desktop: Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-end p-3 md:p-4 hidden md:flex">
            <div className="flex gap-2 mb-3" onClick={(e) => e.preventDefault()}>
              <Link
                to={`/${mediaType}/${item.id}`}
                className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Play className="h-4 w-4 md:h-5 md:w-5 ml-0.5" fill="currentColor" />
              </Link>
              <WatchlistButton
                tmdbId={item.id}
                mediaType={mediaType}
                title={title}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                releaseDate={releaseDate}
                size="icon"
              />
            </div>

            <div className="flex items-center gap-2 text-xs md:text-sm">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/90">
                <Star className="h-3 w-3 text-black" fill="currentColor" />
                <span className="font-bold text-black">{item.vote_average?.toFixed(1) ?? 'N/A'}</span>
              </div>
              <span className="text-muted-foreground">
                {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 md:mt-3 text-xs md:text-sm font-medium line-clamp-1 group-hover:text-foreground transition-colors">
          {title}
        </h3>
      </Link>
    </motion.div>
  );
};
