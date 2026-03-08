import { Play, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tmdbApi } from '@/lib/api/tmdb';

interface Episode {
  number: number;
  name?: string;
  overview?: string;
  stillPath?: string | null;
  runtime?: number | null;
}

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisode: number;
  onEpisodeSelect: (episode: number) => void;
}

export const EpisodeList = ({ episodes, currentEpisode, onEpisodeSelect }: EpisodeListProps) => {
  return (
    <div className="space-y-2">
      {episodes.map((episode) => {
        const isActive = episode.number === currentEpisode;
        const thumbnailUrl = episode.stillPath ? tmdbApi.getPosterUrl(episode.stillPath, 'w185') : null;
        
        return (
          <motion.div
            key={episode.number}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(episode.number * 0.02, 0.4) }}
          >
            <Button
              variant="ghost"
              onClick={() => onEpisodeSelect(episode.number)}
              className={cn(
                "w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 px-2 sm:px-3 rounded-lg transition-all",
                isActive
                  ? "bg-primary/20 border border-primary/30 text-primary"
                  : "hover:bg-secondary/60 text-foreground"
              )}
            >
              {/* Thumbnail or Episode Number */}
              <div className={cn(
                "relative flex-shrink-0 rounded overflow-hidden",
                thumbnailUrl ? "w-16 sm:w-20 aspect-video" : "h-6 w-6 sm:h-8 sm:w-8"
              )}>
                {thumbnailUrl ? (
                  <>
                    <img 
                      src={thumbnailUrl} 
                      alt={`Episode ${episode.number}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Play className="h-3 w-3 sm:h-4 sm:w-4 text-white" fill="currentColor" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className={cn(
                    "flex items-center justify-center h-full w-full rounded-full",
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}>
                    {isActive ? (
                      <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="currentColor" />
                    ) : (
                      <span className="text-[10px] sm:text-xs font-medium">{episode.number}</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Episode Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <p className="text-xs sm:text-sm font-medium">
                    Episode {episode.number}
                    {episode.name && episode.name !== `Episode ${episode.number}` && (
                      <span className="text-muted-foreground font-normal"> — {episode.name}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {episode.runtime && (
                    <span className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {episode.runtime}m
                    </span>
                  )}
                </div>
                {episode.overview && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground/70 line-clamp-2 mt-1">
                    {episode.overview}
                  </p>
                )}
              </div>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};