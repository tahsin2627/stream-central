import { forwardRef } from 'react';
import { Star, Play } from 'lucide-react';

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
        className="relative w-[360px] h-[640px] rounded-3xl overflow-hidden"
        style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        {/* Background Image with Heavy Blur */}
        <div className="absolute inset-0">
          {(backdropUrl || posterUrl) && (
            <img
              src={backdropUrl || posterUrl || ''}
              alt=""
              className="w-full h-full object-cover scale-125"
              style={{ filter: 'blur(60px) saturate(1.5)' }}
            />
          )}
          {/* Dark overlay with gradient */}
          <div 
            className="absolute inset-0" 
            style={{ 
              background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 100%)'
            }} 
          />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col p-6">
          {/* Top - Glassmorphism Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span 
              className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest rounded-full text-white/90"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
              }}
            >
              {mediaType === 'movie' ? '🎬 Movie' : '📺 TV Series'}
            </span>
          </div>

          {/* Poster Card with Glassmorphism */}
          <div className="flex-1 flex items-center justify-center py-4">
            <div className="relative">
              {/* Ambient Glow */}
              <div 
                className="absolute -inset-8 rounded-3xl opacity-60"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  filter: 'blur(20px)'
                }}
              />
              
              {/* Poster with Glass Frame */}
              <div 
                className="relative w-[180px] rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.1)',
                }}
              >
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
                
                {/* Shimmer overlay */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Info with Glassmorphism */}
          <div className="space-y-3">
            {/* Title & Meta */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2 tracking-tight drop-shadow-lg">
                {title}
              </h2>
              
              <div className="flex items-center justify-center gap-3 text-white/70 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" />
                  <span className="text-white font-semibold">{rating?.toFixed(1) ?? 'N/A'}</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="font-medium">{year}</span>
              </div>

              {/* Genres Pills */}
              {genres && genres.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 text-[10px] font-medium rounded-full text-white/80"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Opinion Quote - Glassmorphism Card */}
            {opinion && (
              <div 
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <p className="text-white/95 text-sm italic text-center leading-relaxed font-light">
                  "{opinion}"
                </p>
              </div>
            )}

            {/* Wellplayer Branding - Glass Footer */}
            <div 
              className="flex items-center justify-center gap-3 pt-3 pb-1 mt-2 rounded-xl"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 100%)'
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}
                >
                  <Play className="w-3 h-3 text-white fill-current" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Wellplayer
                </span>
              </div>
              <span className="text-white/30 text-xs">|</span>
              <span className="text-white/50 text-[10px] italic tracking-wide">it's a really wellplayer</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareStoryCard.displayName = 'ShareStoryCard';
