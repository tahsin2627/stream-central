import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
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

  return (
    <section className="relative py-6">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl font-semibold mb-4"
        >
          {title}
        </motion.h2>
      </div>

      <div className="relative group">
        {/* Scroll Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 z-10',
            'bg-background/80 backdrop-blur-sm shadow-lg',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'h-12 w-12 rounded-full'
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 z-10',
            'bg-background/80 backdrop-blur-sm shadow-lg',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'h-12 w-12 rounded-full'
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Carousel Content */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar px-4 md:px-8"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {/* Left padding for container alignment */}
          <div className="flex-shrink-0 w-[calc((100vw-1400px)/2)] hidden 2xl:block" />
          
          {items.map((item, index) => (
            <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
              <MovieCard item={item} index={index} size={size} />
            </div>
          ))}
          
          {/* Right padding */}
          <div className="flex-shrink-0 w-4" />
        </div>
      </div>
    </section>
  );
};
