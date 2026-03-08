import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface UnmuteBannerProps {
  /** Whether the player is currently muted due to autoplay policy */
  isMuted: boolean;
  /** Called when user taps the banner to unmute */
  onUnmute: () => void;
  /** Auto-dismiss after this many ms (default 8000). Set 0 to disable. */
  autoDismissMs?: number;
}

export const UnmuteBanner = ({ isMuted, onUnmute, autoDismissMs = 8000 }: UnmuteBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isMuted) {
      setDismissed(true);
      return;
    }
    setDismissed(false);
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => setDismissed(true), autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [isMuted, autoDismissMs]);

  const show = isMuted && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={(e) => {
            e.stopPropagation();
            onUnmute();
            setDismissed(true);
          }}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-foreground/90 backdrop-blur-md text-background shadow-lg hover:bg-foreground transition-colors cursor-pointer"
        >
          <VolumeX className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">Tap to unmute</span>
          <Volume2 className="h-4 w-4 shrink-0 opacity-60" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
