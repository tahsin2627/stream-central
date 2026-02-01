import { useNavigate } from 'react-router-dom';
import { Play, Plus, Info, Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { TMDBMovie, TMDBTVShow, tmdbApi } from '@/lib/api/tmdb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroSectionProps {
  featured: TMDBMovie | TMDBTVShow | null;
  isLoading?: boolean;
}

// Type guard to check if it's a movie
const isMovie = (item: TMDBMovie | TMDBTVShow): item is TMDBMovie => {
  return 'title' in item;
};

export const HeroSection = ({ featured, isLoading }: HeroSectionProps) => {
  const navigate = useNavigate();

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

  return (
    <section className="relative h-[80vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
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
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="text-xs px-3 py-1 rounded-full bg-secondary/60 text-muted-foreground backdrop-blur-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
              {title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                <span className="text-foreground font-medium">{featured.vote_average.toFixed(1)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
              </span>
              <span className="capitalize">{mediaType}</span>
            </div>

            {/* Overview */}
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 line-clamp-3 md:line-clamp-4">
              {featured.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2 px-8" onClick={handlePlay}>
                <Play className="h-5 w-5" fill="currentColor" />
                Play
              </Button>
              <Button size="lg" variant="secondary" className="gap-2">
                <Plus className="h-5 w-5" />
                My List
              </Button>
              <Button size="lg" variant="ghost" className="gap-2" onClick={handlePlay}>
                <Info className="h-5 w-5" />
                More Info
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
