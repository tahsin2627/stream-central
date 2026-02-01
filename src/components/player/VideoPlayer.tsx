import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, Maximize, Film, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

interface VideoPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title?: string;
}

export const VideoPlayer = ({ tmdbId, mediaType, season, episode, title }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Build the embed URL using autoembed v2 player (no countdown ads)
  let embedUrl = `https://watch-v2.autoembed.cc/${mediaType}/${tmdbId}`;
  
  // Add season/episode for TV shows
  if (mediaType === 'tv' && season && episode) {
    embedUrl += `/${season}/${episode}`;
  }

  useEffect(() => {
    // Hide loading overlay after a delay
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowOverlay(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [embedUrl]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setShowOverlay(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setTimeout(() => setShowOverlay(false), 500);
  };

  const handleIframeError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      {/* Video iframe */}
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full z-10"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="origin"
        title="Video Player"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />

      {/* Loading/Branding Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
            </div>

            {/* Loading Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative flex flex-col items-center gap-6"
            >
              {/* Logo with Glow */}
              <div className="relative">
                <div className="absolute -inset-4 bg-white/10 rounded-full blur-2xl" />
                <motion.img
                  src={wellplayerLogo}
                  alt="Wellplayer"
                  className="relative h-20 w-20 rounded-2xl shadow-2xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Title */}
              {title && (
                <div className="text-center max-w-md px-4">
                  <p className="text-white/50 text-sm mb-1 flex items-center justify-center gap-2">
                    {mediaType === 'movie' ? (
                      <Film className="h-4 w-4" />
                    ) : (
                      <Tv className="h-4 w-4" />
                    )}
                    {mediaType === 'movie' ? 'Movie' : `S${season} E${episode}`}
                  </p>
                  <h2 className="text-white text-xl font-semibold line-clamp-2">{title}</h2>
                </div>
              )}

              {/* Loading Spinner */}
              {isLoading && !hasError && (
                <div className="flex items-center gap-3 text-white/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Finding best source...</span>
                </div>
              )}

              {/* Error State */}
              {hasError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm">Failed to load video</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRetry}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </motion.div>
              )}

              {/* Branding */}
              <p className="text-white/30 text-xs italic mt-4">
                Powered by Wellplayer
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner Watermark (visible when playing) */}
      {!showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-4 right-4 z-30 pointer-events-none"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <img src={wellplayerLogo} alt="" className="h-4 w-4 rounded" />
            <span className="text-white/60 text-xs font-medium">Wellplayer</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
