import { Star } from 'lucide-react';

interface LetterboxdRatingProps {
  rating: number; // TMDB rating out of 10
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

// Convert TMDB 10-point to Letterboxd 5-star scale
const toFiveStarRating = (tmdbRating: number): number => {
  return Math.round((tmdbRating / 2) * 2) / 2; // Round to nearest 0.5
};

export const LetterboxdRating = ({ rating, showLabel = true, size = 'sm' }: LetterboxdRatingProps) => {
  const fiveStarRating = toFiveStarRating(rating);
  const fullStars = Math.floor(fiveStarRating);
  const hasHalf = fiveStarRating % 1 !== 0;

  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} className={`${starSize} text-[#00e054]`} fill="currentColor" />;
          }
          if (i === fullStars && hasHalf) {
            return (
              <div key={i} className="relative">
                <Star className={`${starSize} text-muted-foreground/30`} />
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className={`${starSize} text-[#00e054]`} fill="currentColor" />
                </div>
              </div>
            );
          }
          return <Star key={i} className={`${starSize} text-muted-foreground/30`} />;
        })}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">{fiveStarRating.toFixed(1)}</span>
      )}
    </div>
  );
};
