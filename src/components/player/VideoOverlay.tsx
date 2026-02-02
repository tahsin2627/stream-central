import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoOverlayProps {
  onTap?: () => void;
  showInitially?: boolean;
  className?: string;
}

/**
 * Video overlay with visual controls
 * Note: These are visual aids - actual iframe playback cannot be controlled directly
 * but they provide a polished UI and quick access to fullscreen
 */
export const VideoOverlay = ({ onTap, showInitially = true, className }: VideoOverlayProps) => {
  const [isVisible, setIsVisible] = useState(showInitially);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide after 4 seconds
  useEffect(() => {
    if (isVisible) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    }
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isVisible]);

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

  const handleOverlayClick = () => {
    setIsVisible(!isVisible);
    onTap?.();
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    // Reset auto-hide timer
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 4000);
  };

  return (
    <div 
      className={cn("absolute inset-0 z-20", className)}
      onClick={handleOverlayClick}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none" />

            {/* Top bar with hint */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-center pointer-events-none">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/60 text-xs bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm"
              >
                💡 Use video's built-in controls for playback
              </motion.p>
            </div>

            {/* Center Controls - Visual feedback */}
            <div className="absolute inset-0 flex items-center justify-center gap-6 sm:gap-8">
              {/* Seek Back (visual) */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="pointer-events-auto"
              >
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={(e) => handleButtonClick(e, () => setIsPaused(false))}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border border-white/10"
                >
                  <SkipBack className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </motion.div>

              {/* Play/Pause (visual) */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="pointer-events-auto"
              >
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={(e) => handleButtonClick(e, () => setIsPaused(!isPaused))}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/20 shadow-2xl"
                >
                  {isPaused ? (
                    <Play className="h-8 w-8 sm:h-10 sm:w-10 ml-1" fill="currentColor" />
                  ) : (
                    <Pause className="h-8 w-8 sm:h-10 sm:w-10" fill="currentColor" />
                  )}
                </Button>
              </motion.div>

              {/* Seek Forward (visual) */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="pointer-events-auto"
              >
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={(e) => handleButtonClick(e, () => setIsPaused(false))}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border border-white/10"
                >
                  <SkipForward className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </motion.div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
              {/* Mute Toggle */}
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleButtonClick(e, () => setIsMuted(!isMuted))}
                  className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </motion.div>

              {/* Fullscreen Toggle - This actually works */}
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleButtonClick(e, toggleFullscreen)}
                  className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap indicator when hidden */}
      {!isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <span className="text-white/30 text-xs bg-black/20 px-3 py-1 rounded-full">
            Tap for controls
          </span>
        </motion.div>
      )}
    </div>
  );
};
