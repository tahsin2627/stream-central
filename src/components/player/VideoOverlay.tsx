import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize, Smartphone, ZoomIn, ZoomOut, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoOverlayProps {
  showInitially?: boolean;
  className?: string;
}

type ZoomMode = 'normal' | 'fill' | 'custom';

/**
 * Video overlay with:
 * - Fullscreen + landscape lock
 * - Dedicated landscape toggle button
 * - YouTube-style pinch-to-zoom / double-tap zoom
 * - Fit-to-screen / zoom-to-fill mode
 * - Rotation instructions fallback
 * - Single taps pass through to iframe
 */
export const VideoOverlay = ({ showInitially = true, className }: VideoOverlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showButton, setShowButton] = useState(showInitially);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('normal');
  const [showRotateHint, setShowRotateHint] = useState(false);
  const [isLandscapeLocked, setIsLandscapeLocked] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rotateHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const pinchStartRef = useRef<number | null>(null);
  const zoomStartRef = useRef<number>(1);
  const doubleTapPending = useRef<NodeJS.Timeout | null>(null);

  const ZOOM_LEVELS = [1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    if (showButton) {
      hideTimeoutRef.current = setTimeout(() => setShowButton(false), 5000);
    }
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [showButton]);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        setZoomLevel(1);
        setZoomMode('normal');
        setIsLandscapeLocked(false);
        applyZoom(1, 'normal');
        unlockOrientation();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Apply zoom to player container
  const applyZoom = useCallback((level: number, mode: ZoomMode = 'custom') => {
    const playerContainer = document.querySelector('.player-container');
    const iframe = playerContainer?.querySelector('iframe');
    const nativePlayer = playerContainer?.querySelector('video');
    const target = iframe || nativePlayer;
    if (target) {
      if (mode === 'fill') {
        // Zoom-to-fill: scale up to cover the container (crops black bars)
        // Typically 4:3 content in 16:9 container needs ~1.33x scale
        const fillScale = 1.33;
        (target as HTMLElement).style.transform = `scale(${fillScale})`;
        (target as HTMLElement).style.transformOrigin = 'center center';
        (target as HTMLElement).style.objectFit = 'cover';
      } else if (level === 1 && mode === 'normal') {
        (target as HTMLElement).style.transform = '';
        (target as HTMLElement).style.objectFit = '';
      } else {
        (target as HTMLElement).style.transform = `scale(${level})`;
        (target as HTMLElement).style.transformOrigin = 'center center';
        (target as HTMLElement).style.objectFit = '';
      }
    }
  }, []);

  const cycleZoom = useCallback(() => {
    setZoomMode('custom');
    setZoomLevel(prev => {
      const currentIdx = ZOOM_LEVELS.indexOf(prev);
      const nextIdx = (currentIdx + 1) % ZOOM_LEVELS.length;
      const newLevel = ZOOM_LEVELS[nextIdx];
      applyZoom(newLevel, 'custom');
      if (newLevel !== 1) {
        toast(`Zoom: ${Math.round(newLevel * 100)}%`, { duration: 1000 });
      }
      return newLevel;
    });
  }, [applyZoom]);

  const toggleFillMode = useCallback(() => {
    if (zoomMode === 'fill') {
      setZoomMode('normal');
      setZoomLevel(1);
      applyZoom(1, 'normal');
      toast('Fit to screen', { duration: 1000 });
    } else {
      setZoomMode('fill');
      applyZoom(1, 'fill');
      toast('Fill screen (cropped)', { duration: 1000 });
    }
  }, [zoomMode, applyZoom]);

  // Pinch-to-zoom handlers - only capture multi-touch, let single taps through
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture - capture it
      e.preventDefault();
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartRef.current = dist;
      zoomStartRef.current = zoomLevel;
    }
    setShowButton(true);
  }, [zoomLevel]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Handle double-tap detection
    if (e.changedTouches.length === 1 && pinchStartRef.current === null) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap detected - cycle zoom
        if (doubleTapPending.current) {
          clearTimeout(doubleTapPending.current);
          doubleTapPending.current = null;
        }
        cycleZoom();
        e.preventDefault();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        // Set a timeout - if no second tap, let the next single tap through
        doubleTapPending.current = setTimeout(() => {
          doubleTapPending.current = null;
        }, 300);
      }
    }

    // Snap pinch zoom to nearest level
    if (pinchStartRef.current !== null) {
      pinchStartRef.current = null;
      const snapped = ZOOM_LEVELS.reduce((prev, curr) =>
        Math.abs(curr - zoomLevel) < Math.abs(prev - zoomLevel) ? curr : prev
      );
      setZoomLevel(snapped);
      setZoomMode('custom');
      applyZoom(snapped, 'custom');
    }
  }, [zoomLevel, applyZoom, cycleZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current !== null) {
      e.preventDefault();
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / pinchStartRef.current;
      const newZoom = Math.min(2, Math.max(1, zoomStartRef.current * scale));
      setZoomLevel(newZoom);
      setZoomMode('custom');
      applyZoom(newZoom, 'custom');
    }
  }, [applyZoom]);

  const lockOrientation = useCallback(async () => {
    try {
      const screenOrientation = (screen as any).orientation;
      if (screenOrientation?.lock) {
        await screenOrientation.lock('landscape');
        setIsLandscapeLocked(true);
        toast.success('🔄 Landscape locked');
        return true;
      }
    } catch {
      // Orientation lock not supported
    }
    return false;
  }, []);

  const unlockOrientation = useCallback(() => {
    try {
      const screenOrientation = (screen as any).orientation;
      if (screenOrientation?.unlock) {
        screenOrientation.unlock();
        setIsLandscapeLocked(false);
      }
    } catch {}
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const playerContainer = document.querySelector('.player-container');
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      await playerContainer.requestFullscreen().catch(console.error);
      await lockOrientation();
    } else {
      await document.exitFullscreen().catch(console.error);
    }
  }, [lockOrientation]);

  const toggleLandscape = useCallback(async () => {
    if (isLandscapeLocked) {
      unlockOrientation();
      toast('🔓 Orientation unlocked', { duration: 1500 });
      return;
    }

    const success = await lockOrientation();
    if (!success) {
      setShowRotateHint(true);
      if (rotateHintTimeoutRef.current) clearTimeout(rotateHintTimeoutRef.current);
      rotateHintTimeoutRef.current = setTimeout(() => setShowRotateHint(false), 5000);
    }
  }, [isLandscapeLocked, lockOrientation, unlockOrientation]);

  const handleMouseMove = useCallback(() => {
    setShowButton(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setShowButton(false), 5000);
  }, []);

  return (
    <>
      {/* Gesture detection layer - uses pointer-events: none to let single taps through */}
      {/* Only captures pinch (2-finger) gestures via onTouchStart/Move/End */}
      <div
        className={cn("absolute inset-0 z-10", className)}
        style={{ 
          pointerEvents: 'none',
          touchAction: 'manipulation'
        }}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          // Only intercept multi-touch (pinch)
          if (e.touches.length >= 2) {
            handleTouchStart(e);
          } else {
            // Single touch - just show controls, don't block
            setShowButton(true);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length >= 2) {
            handleTouchMove(e);
          }
        }}
        onTouchEnd={handleTouchEnd}
      />

      {/* Control buttons */}
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 right-4 z-30 pointer-events-auto flex items-center gap-2"
          >
            {/* Zoom indicator */}
            {(zoomLevel !== 1 || zoomMode === 'fill') && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="h-10 px-3 rounded-full bg-black/70 backdrop-blur-sm text-white flex items-center gap-1.5 text-xs font-medium"
              >
                {zoomMode === 'fill' ? (
                  <>
                    <Scan className="h-3.5 w-3.5" />
                    Fill
                  </>
                ) : (
                  <>
                    <ZoomIn className="h-3.5 w-3.5" />
                    {Math.round(zoomLevel * 100)}%
                  </>
                )}
              </motion.div>
            )}

            {/* Fill/Fit toggle - crops black bars like YouTube */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFillMode}
              className={cn(
                "h-10 w-10 rounded-full backdrop-blur-sm shadow-lg",
                zoomMode === 'fill'
                  ? "bg-primary/90 hover:bg-primary text-primary-foreground"
                  : "bg-black/70 hover:bg-black/90 text-white"
              )}
              title={zoomMode === 'fill' ? 'Fit to screen' : 'Fill screen (crop black bars)'}
            >
              <Scan className="h-5 w-5" />
            </Button>

            {/* Zoom button - cycles through levels */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleZoom}
              className="h-10 w-10 rounded-full bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white shadow-lg"
              title={zoomLevel > 1 ? `Zoom: ${Math.round(zoomLevel * 100)}%` : 'Zoom in'}
            >
              {zoomLevel > 1 ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </Button>

            {/* Landscape toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLandscape}
              className={cn(
                "h-10 w-10 rounded-full backdrop-blur-sm shadow-lg",
                isLandscapeLocked
                  ? "bg-primary/90 hover:bg-primary text-primary-foreground"
                  : "bg-black/70 hover:bg-black/90 text-white"
              )}
              title={isLandscapeLocked ? 'Unlock rotation' : 'Lock landscape'}
            >
              <Smartphone className={cn("h-5 w-5 transition-transform", isLandscapeLocked && "rotate-90")} />
            </Button>

            {/* Fullscreen */}
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

      {/* Rotation instructions toast */}
      <AnimatePresence>
        {showRotateHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
          >
            <div className="bg-black/85 backdrop-blur-md text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl border border-white/10 max-w-xs">
              <motion.div
                animate={{ rotate: [0, 90, 90, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Smartphone className="h-8 w-8 text-primary" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold">Rotate your device</p>
                <p className="text-xs text-white/70 mt-0.5">
                  Turn your phone sideways for landscape view. Or enable auto-rotate in your device settings.
                </p>
              </div>
              <button
                onClick={() => setShowRotateHint(false)}
                className="text-white/50 hover:text-white text-lg ml-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};