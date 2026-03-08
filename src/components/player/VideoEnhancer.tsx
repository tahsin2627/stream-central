import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, PictureInPicture2, SkipForward, SkipBack, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
const SKIP_INTRO_SECONDS = 85; // Typical intro length
const SKIP_OUTRO_SECONDS = 90; // Skip to near-end

interface VideoEnhancerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  duration: number;
  currentTime: number;
  isTV?: boolean;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  className?: string;
}

export const VideoEnhancer = ({
  videoRef,
  duration,
  currentTime,
  isTV = false,
  onPrevEpisode,
  onNextEpisode,
  hasPrev = false,
  hasNext = false,
  className,
}: VideoEnhancerProps) => {
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSkipIntro, setShowSkipIntro] = useState(true);

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      toast(`Speed: ${speed}x`, { duration: 1000 });
    }
  };

  const handlePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        toast.success('Picture-in-Picture enabled');
      }
    } catch {
      toast.error('PiP not supported in this browser');
    }
  };

  const handleSkipIntro = () => {
    if (videoRef.current) {
      const newTime = Math.min(currentTime + SKIP_INTRO_SECONDS, duration);
      videoRef.current.currentTime = newTime;
      setShowSkipIntro(false);
      toast('Skipped intro', { duration: 1000 });
    }
  };

  const handleSkipOutro = () => {
    if (videoRef.current && duration > 0) {
      // Skip to last few seconds or trigger next episode
      if (hasNext && onNextEpisode) {
        onNextEpisode();
        toast('Next episode', { duration: 1000 });
      } else {
        videoRef.current.currentTime = Math.max(0, duration - 5);
        toast('Skipped to end', { duration: 1000 });
      }
    }
  };

  // Show skip intro button in first 5 minutes
  const isEarlyInVideo = currentTime < 300;
  // Show skip outro in last 10% of video
  const isNearEnd = duration > 0 && currentTime > duration * 0.9;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Skip Intro - shown early in video */}
      <AnimatePresence>
        {isEarlyInVideo && showSkipIntro && currentTime > 5 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleSkipIntro(); }}
              className="h-8 gap-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm text-xs"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip Intro
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Outro / Next Episode */}
      <AnimatePresence>
        {isNearEnd && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleSkipOutro(); }}
              className="h-8 gap-1.5 bg-primary/80 hover:bg-primary text-primary-foreground backdrop-blur-sm text-xs"
            >
              <SkipForward className="h-3.5 w-3.5" />
              {hasNext ? 'Next Episode' : 'Skip Outro'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Navigation (TV only) */}
      {isTV && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onPrevEpisode?.(); }}
            disabled={!hasPrev}
            className="h-9 w-9 text-white hover:bg-white/20 disabled:opacity-30"
            title="Previous episode"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
            disabled={!hasNext}
            className="h-9 w-9 text-white hover:bg-white/20 disabled:opacity-30"
            title="Next episode"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Speed Control */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "h-9 gap-1 text-white hover:bg-white/20 text-xs px-2",
              playbackRate !== 1 && "bg-white/20"
            )}
            title="Playback speed"
          >
            <Gauge className="h-4 w-4" />
            {playbackRate !== 1 && <span>{playbackRate}x</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px]">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Speed</div>
          <DropdownMenuSeparator />
          {SPEED_OPTIONS.map((speed) => (
            <DropdownMenuItem
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={cn(
                "text-sm cursor-pointer",
                speed === playbackRate && "bg-accent font-medium"
              )}
            >
              {speed}x {speed === 1 && '(Normal)'}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Picture-in-Picture */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); handlePiP(); }}
        className="h-9 w-9 text-white hover:bg-white/20"
        title="Picture-in-Picture"
      >
        <PictureInPicture2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
