import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Episode {
  number: number;
  name?: string;
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
        return (
          <motion.div
            key={episode.number}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: episode.number * 0.02 }}
          >
            <Button
              variant="ghost"
              onClick={() => onEpisodeSelect(episode.number)}
              className={cn(
                "w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all",
                isActive
                  ? "bg-primary/20 border border-primary/30 text-primary"
                  : "hover:bg-secondary/60 text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full flex-shrink-0",
                isActive ? "bg-primary text-primary-foreground" : "bg-secondary"
              )}>
                {isActive ? (
                  <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="currentColor" />
                ) : (
                  <span className="text-[10px] sm:text-xs font-medium">{episode.number}</span>
                )}
              </div>
              <div className="text-left">
                <p className="text-xs sm:text-sm font-medium">
                  Episode {episode.number}
                </p>
                {episode.name && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                    {episode.name}
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
