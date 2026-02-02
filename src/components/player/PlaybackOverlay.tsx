import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlaybackOverlayProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Playback overlay with controls to help users navigate around ads
 * Note: These are visual aids - actual iframe playback cannot be controlled directly
 */
export const PlaybackOverlay = ({ isVisible, onToggle, className }: PlaybackOverlayProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Hide hint after 5 seconds
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

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

  const handleSeekBack = () => {
    // Visual feedback - actual seeking requires postMessage to iframe
    setShowHint(true);
  };

  const handleSeekForward = () => {
    // Visual feedback - actual seeking requires postMessage to iframe
    setShowHint(true);
  };

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
    setShowHint(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute inset-0 z-20 pointer-events-none",
            className
          )}
          onClick={onToggle}
        >
          {/* Gradient overlays for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

          {/* Center Controls */}
          <div className="absolute inset-0 flex items-center justify-center gap-8 pointer-events-auto">
            {/* Seek Back */}
            <Button
              variant="ghost"
              size="lg"
              onClick={(e) => { e.stopPropagation(); handleSeekBack(); }}
              className="h-14 w-14 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border border-white/10"
            >
              <RotateCcw className="h-6 w-6" />
              <span className="absolute -bottom-1 text-[10px] font-medium">10s</span>
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="lg"
              onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
              className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/20"
            >
              {isPaused ? (
                <Play className="h-10 w-10 ml-1" fill="currentColor" />
              ) : (
                <Pause className="h-10 w-10" fill="currentColor" />
              )}
            </Button>

            {/* Seek Forward */}
            <Button
              variant="ghost"
              size="lg"
              onClick={(e) => { e.stopPropagation(); handleSeekForward(); }}
              className="h-14 w-14 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border border-white/10"
            >
              <RotateCw className="h-6 w-6" />
              <span className="absolute -bottom-1 text-[10px] font-medium">10s</span>
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
            {/* Mute Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>

            {/* Hint Text */}
            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-white/60 text-xs text-center"
                >
                  💡 Use player's built-in controls for full playback control
                </motion.p>
              )}
            </AnimatePresence>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
