import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';
import { MovieCard } from './MovieCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentCarouselProps {
  title: string;
  items: (TMDBMovie | TMDBTVShow)[];
  size?: 'default' | 'large';
  isLoading?: boolean;
}

export const ContentCarousel = ({ title, items, size = 'default', isLoading }: ContentCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -400 : 400;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section className="relative py-6">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-4" />
        </div>
        <div className="flex gap-4 px-4 md:px-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'flex-shrink-0 rounded-lg',
                size === 'large'
                  ? 'w-[280px] md:w-[320px] aspect-[2/3]'
                  : 'w-[160px] md:w-[200px] aspect-[2/3]'
              )}
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  // Show first 20 in carousel, rest in expanded grid
  const carouselItems = isExpanded ? [] : items;
  const gridItems = isExpanded ? items : [];

  return (
    <section className="relative py-4 md:py-6">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-lg md:text-xl lg:text-2xl font-semibold"
        >
          {title}
        </motion.h2>

        {items.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>Collapse <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>See All <ChevronDown className="h-4 w-4" /></>
            )}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="carousel"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative group mt-3 md:mt-4"
          >
            {/* Scroll Buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll('left')}
              className={cn(
                'absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-10',
                'bg-background/80 backdrop-blur-sm shadow-lg',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'h-8 w-8 md:h-12 md:w-12 rounded-full',
                'hidden md:flex'
              )}
            >
              <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll('right')}
              className={cn(
                'absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-10',
                'bg-background/80 backdrop-blur-sm shadow-lg',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'h-8 w-8 md:h-12 md:w-12 rounded-full',
                'hidden md:flex'
              )}
            >
              <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
            </Button>

            <div
              ref={scrollRef}
              className="flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar px-4 md:px-8 scroll-smooth snap-x snap-mandatory"
            >
              <div className="flex-shrink-0 w-[calc((100vw-1400px)/2)] hidden 2xl:block" />
              {carouselItems.map((item, index) => (
                <div key={item.id} className="snap-start">
                  <MovieCard item={item} index={index} size={size} />
                </div>
              ))}
              <div className="flex-shrink-0 w-4" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 md:px-8 mt-3 md:mt-4"
          >
            <div className={cn(
              'grid gap-3 md:gap-4',
              size === 'large'
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
            )}>
              {gridItems.map((item, index) => (
                <MovieCard key={item.id} item={item} index={index} size={size} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
