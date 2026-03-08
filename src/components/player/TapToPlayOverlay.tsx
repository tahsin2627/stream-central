import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

interface TapToPlayOverlayProps {
  title?: string;
  onPlay: () => void;
  serverName?: string;
  serverFlag?: string;
}

export const TapToPlayOverlay = ({ title, onPlay, serverName, serverFlag }: TapToPlayOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl" />
          <img src={wellplayerLogo} alt="Wellplayer" className="relative h-16 w-16 rounded-2xl shadow-2xl" />
        </div>

        {/* Title */}
        {title && (
          <h2 className="text-white text-lg font-semibold text-center max-w-xs px-4 line-clamp-2">{title}</h2>
        )}

        {/* Play button - THIS is the user gesture that enables playback */}
        <motion.button
          onClick={onPlay}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          className="relative h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/30"
        >
          <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.button>

        <p className="text-white/50 text-sm">Tap to play</p>

        {/* Server info */}
        {serverName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-white/60">{serverFlag} {serverName}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
