import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoOverlayProps {
  showInitially?: boolean;
  className?: string;
}

/**
 * Minimal video overlay - fullscreen button + landscape orientation lock
 * DOES NOT block iframe interaction
 */
export const VideoOverlay = ({ showInitially = true, className }: VideoOverlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showButton, setShowButton] = useState(showInitially);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showButton) {
      hideTimeoutRef.current = setTimeout(() => setShowButton(false), 5000);
    }
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [showButton]);

  // Track fullscreen state + orientation lock
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);

      // Lock to landscape on mobile when entering fullscreen
      try {
        const screenOrientation = (screen as any).orientation;
        if (isFs && screenOrientation?.lock) {
          await screenOrientation.lock('landscape').catch(() => {});
        } else if (!isFs && screenOrientation?.unlock) {
          screenOrientation.unlock();
        }
      } catch {
        // Orientation API not supported
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const playerContainer = document.querySelector('.player-container');
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      await playerContainer.requestFullscreen().catch(console.error);
    } else {
      await document.exitFullscreen().catch(console.error);
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowButton(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setShowButton(false), 5000);
  }, []);

  return (
    <>
      {/* Invisible mouse/touch tracker - doesn't block clicks */}
      <div
        className={cn("absolute inset-0 z-10 pointer-events-none", className)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseMove}
      />

      {/* Fullscreen button */}
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 right-4 z-30 pointer-events-auto"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-10 w-10 rounded-full bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white shadow-lg"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
