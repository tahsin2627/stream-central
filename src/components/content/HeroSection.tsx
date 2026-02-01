import { Play, Plus, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContentItem } from '@/types/content';
import { GENRES } from '@/data/mockContent';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  featured: ContentItem;
}

export const HeroSection = ({ featured }: HeroSectionProps) => {
  const genres = featured.genreIds
    .slice(0, 3)
    .map((id) => GENRES[id])
    .filter(Boolean);

  return (
    <section className="relative h-[80vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {featured.backdropPath ? (
          <img
            src={featured.backdropPath}
            alt={featured.title}
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
                    key={genre}
                    className="text-xs px-3 py-1 rounded-full bg-secondary/60 text-muted-foreground backdrop-blur-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
              {featured.title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-foreground font-medium">{featured.rating.toFixed(1)}</span>
              </span>
              <span>{new Date(featured.releaseDate).getFullYear()}</span>
              <span className="capitalize">{featured.mediaType}</span>
            </div>

            {/* Overview */}
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 line-clamp-3 md:line-clamp-4">
              {featured.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2 px-8">
                <Play className="h-5 w-5" fill="currentColor" />
                Play
              </Button>
              <Button size="lg" variant="secondary" className="gap-2">
                <Plus className="h-5 w-5" />
                My List
              </Button>
              <Button size="lg" variant="ghost" className="gap-2">
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
