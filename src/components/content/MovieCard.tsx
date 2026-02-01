import { Link } from 'react-router-dom';
import { Play, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { tmdbApi, TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';
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
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={cn(
        'group relative flex-shrink-0 cursor-pointer',
        size === 'large' ? 'w-[280px] md:w-[320px]' : 'w-[160px] md:w-[200px]'
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
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No Image
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="flex gap-2 mb-3">
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              </button>
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors">
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
              <span className="font-medium">{item.vote_average.toFixed(1)}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-sm font-medium line-clamp-1 group-hover:text-foreground transition-colors">
          {title}
        </h3>
      </Link>
    </motion.div>
  );
};
