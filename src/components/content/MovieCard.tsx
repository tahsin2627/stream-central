import { Link } from 'react-router-dom';
import { Play, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContentItem } from '@/types/content';
import { GENRES } from '@/data/mockContent';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  item: ContentItem;
  index?: number;
  size?: 'default' | 'large';
}

export const MovieCard = ({ item, index = 0, size = 'default' }: MovieCardProps) => {
  const genres = item.genreIds
    .slice(0, 2)
    .map((id) => GENRES[id])
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        'group relative flex-shrink-0 cursor-pointer',
        size === 'large' ? 'w-[280px] md:w-[320px]' : 'w-[160px] md:w-[200px]'
      )}
    >
      <Link to={`/movie/${item.id}`}>
        {/* Poster */}
        <div
          className={cn(
            'relative overflow-hidden rounded-lg bg-secondary',
            size === 'large' ? 'aspect-[2/3]' : 'aspect-[2/3]'
          )}
        >
          {item.posterPath ? (
            <img
              src={item.posterPath}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
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
              <span className="font-medium">{item.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {new Date(item.releaseDate).getFullYear()}
              </span>
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-sm font-medium line-clamp-1 group-hover:text-foreground transition-colors">
          {item.title}
        </h3>
      </Link>
    </motion.div>
  );
};
