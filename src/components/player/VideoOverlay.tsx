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
 * Minimal video overlay - only provides fullscreen button
 * DOES NOT block iframe interaction
 */
export const VideoOverlay = ({ showInitially = true, className }: VideoOverlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showButton, setShowButton] = useState(showInitially);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide after 5 seconds of inactivity
  useEffect(() => {
    if (showButton) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowButton(false);
      }, 5000);
    }
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [showButton]);

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

  // Show button on mouse move
  const handleMouseMove = useCallback(() => {
    setShowButton(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setShowButton(false);
    }, 5000);
  }, []);

  return (
    <>
      {/* Invisible mouse tracker - doesn't block clicks */}
      <div 
        className={cn("absolute inset-0 z-10 pointer-events-none", className)}
        onMouseMove={handleMouseMove}
      />
      
      {/* Fullscreen button - positioned in corner, only this is clickable */}
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
