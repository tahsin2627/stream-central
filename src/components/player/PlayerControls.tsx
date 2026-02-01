import { Play, Pause, RotateCcw, RotateCw, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
}

export const PlayerControls = ({
  isPlaying,
  isMuted,
  isFullscreen,
  showControls,
  onPlayPause,
  onSeek,
  onMuteToggle,
  onFullscreenToggle,
}: PlayerControlsProps) => {
  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        >
          {/* Center Controls */}
          <div className="flex items-center gap-4 sm:gap-8 pointer-events-auto">
            {/* Rewind 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSeek(-10)}
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 hover:scale-110 transition-transform"
            >
              <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute text-[10px] sm:text-xs font-bold">10</span>
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 hover:scale-110 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" />
              ) : (
                <Play className="h-7 w-7 sm:h-8 sm:w-8 ml-1" fill="currentColor" />
              )}
            </Button>

            {/* Forward 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSeek(10)}
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 hover:scale-110 transition-transform"
            >
              <RotateCw className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute text-[10px] sm:text-xs font-bold">10</span>
            </Button>
          </div>

          {/* Bottom Right Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMuteToggle}
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFullscreenToggle}
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
