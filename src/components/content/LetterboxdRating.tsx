interface LetterboxdRatingProps {
  rating: number; // TMDB rating out of 10
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

// Convert TMDB 10-point to Letterboxd 5-star scale
const toFiveStarRating = (tmdbRating: number): number => {
  return Math.round((tmdbRating / 2) * 2) / 2; // Round to nearest 0.5
};

const StarIcon = ({ filled, half, size }: { filled: boolean; half?: boolean; size: string }) => {
  const sizeMap = { sm: 14, md: 18, lg: 22 };
  const s = sizeMap[size as keyof typeof sizeMap] || 14;
  
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className="flex-shrink-0">
      <defs>
        <linearGradient id={`half-${s}`}>
          <stop offset="50%" stopColor="#00e054" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? '#00e054' : half ? `url(#half-${s})` : 'none'}
        stroke={filled || half ? '#00e054' : 'hsl(var(--muted-foreground) / 0.25)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const LetterboxdRating = ({ rating, showLabel = true, size = 'sm', interactive, onRate }: LetterboxdRatingProps) => {
  const fiveStarRating = toFiveStarRating(rating);
  const fullStars = Math.floor(fiveStarRating);
  const hasHalf = fiveStarRating % 1 !== 0;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            onClick={() => interactive && onRate?.(i + 1)}
            disabled={!interactive}
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <StarIcon
              filled={i < fullStars}
              half={i === fullStars && hasHalf}
              size={size}
            />
          </button>
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-semibold tracking-wide">
          {fiveStarRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
