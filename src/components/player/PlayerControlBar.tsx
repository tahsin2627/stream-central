import { useCallback, useState, useEffect } from 'react';
import { Maximize, Minimize, RefreshCw, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlayerControlBarProps {
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  onRefresh: () => void;
  onSwitchServer?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  mediaType: 'movie' | 'tv';
  currentServer?: string;
  className?: string;
}

export const PlayerControlBar = ({
  onPrevEpisode,
  onNextEpisode,
  onRefresh,
  onSwitchServer,
  hasPrev = false,
  hasNext = false,
  mediaType,
  currentServer,
  className,
}: PlayerControlBarProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const playerContainer = document.querySelector('.player-container');
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  return (
    <div className={cn(
      "flex items-center justify-between px-2 sm:px-3 py-2 bg-secondary/80 backdrop-blur-sm border-t border-border/50",
      className
    )}>
      {/* Left: Episode navigation OR Switch server (for movies) */}
      <div className="flex items-center gap-1">
        {mediaType === 'tv' ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevEpisode}
              disabled={!hasPrev}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextEpisode}
              disabled={!hasNext}
              className="h-8 gap-1 text-xs"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSwitchServer}
            className="h-8 gap-1.5 text-xs"
          >
            <Shuffle className="h-4 w-4" />
            <span className="hidden sm:inline">Try Another Server</span>
          </Button>
        )}
      </div>

      {/* Center: Current server info + Refresh */}
      <div className="flex items-center gap-2">
        {currentServer && (
          <span className="text-xs text-muted-foreground hidden sm:inline">{currentServer}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Reload</span>
        </Button>
      </div>

      {/* Right: Fullscreen */}
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleFullscreen}
          className="h-8 gap-1.5 text-xs"
        >
          {isFullscreen ? (
            <>
              <Minimize className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </>
          ) : (
            <>
              <Maximize className="h-4 w-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
