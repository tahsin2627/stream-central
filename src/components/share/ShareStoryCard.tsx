import { forwardRef } from 'react';
import { Star } from 'lucide-react';

interface ShareStoryCardProps {
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  year: string | number;
  mediaType: 'movie' | 'tv';
  opinion: string;
  genres?: { id: number; name: string }[];
}

export const ShareStoryCard = forwardRef<HTMLDivElement, ShareStoryCardProps>(
  ({ title, posterUrl, backdropUrl, rating, year, mediaType, opinion, genres }, ref) => {
    return (
      <div
        ref={ref}
        className="relative w-[360px] h-[640px] rounded-3xl overflow-hidden bg-black"
        style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        {/* Background Image with Blur */}
        <div className="absolute inset-0">
          {(backdropUrl || posterUrl) && (
            <img
              src={backdropUrl || posterUrl || ''}
              alt=""
              className="w-full h-full object-cover scale-110 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/95" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col p-6">
          {/* Top - Media Type Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-white/10 text-white/80 backdrop-blur-sm">
              {mediaType === 'movie' ? 'Movie' : 'TV Series'}
            </span>
          </div>

          {/* Poster Card */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-white/10 rounded-3xl blur-2xl" />
              
              {/* Poster */}
              <div className="relative w-[200px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/10 flex items-center justify-center text-white/40 text-sm">
                    No Image
                  </div>
                )}
                
                {/* Poster Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="space-y-4">
            {/* Title & Meta */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2 tracking-tight">
                {title}
              </h2>
              
              <div className="flex items-center justify-center gap-3 text-white/60 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" />
                  <span className="text-white/80 font-medium">{rating.toFixed(1)}</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{year}</span>
              </div>

              {/* Genres */}
              {genres && genres.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-white/70"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Opinion Quote */}
            {opinion && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white/90 text-sm italic text-center leading-relaxed">
                  "{opinion}"
                </p>
              </div>
            )}

            {/* Wellplayer Branding */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Wellplayer
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-white/40 text-[10px] italic">it's a really wellplayer</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareStoryCard.displayName = 'ShareStoryCard';
