import { motion } from 'framer-motion';
import { Loader2, Wifi, Zap } from 'lucide-react';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

interface LoadingOverlayProps {
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  serverName: string;
  serverFlag: string;
  autoFallback: boolean;
  isFallbackTriggered: boolean;
  title?: string;
}

export const LoadingOverlay = ({
  mediaType,
  season,
  episode,
  serverName,
  serverFlag,
  autoFallback,
  isFallbackTriggered,
  title,
}: LoadingOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(240 10% 8%) 50%, hsl(var(--background)) 100%)',
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -15, 0],
            y: [0, 15, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with glow effect */}
        <div className="relative mb-6">
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.img
            src={wellplayerLogo}
            alt="Wellplayer"
            className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl shadow-2xl"
            animate={{ 
              scale: [1, 1.03, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Brand name */}
        <motion.h2 
          className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-wide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Wellplayer
        </motion.h2>

        {/* Content being loaded */}
        {title && (
          <motion.p
            className="text-muted-foreground text-sm mb-4 max-w-xs text-center truncate px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {title}
            {mediaType === 'tv' && season && episode && (
              <span className="text-primary ml-1">
                • S{season} E{episode}
              </span>
            )}
          </motion.p>
        )}

        {/* Loading indicator */}
        <motion.div
          className="flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Connecting to {serverFlag} {serverName}
          </span>
        </motion.div>

        {/* Auto-fallback indicator */}
        {autoFallback && !isFallbackTriggered && (
          <motion.div
            className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Zap className="h-3 w-3 text-amber-500" />
            <span>Auto-switching enabled</span>
          </motion.div>
        )}

        {/* Fallback triggered notice */}
        {isFallbackTriggered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
          >
            <Wifi className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-amber-500">Trying alternate server...</span>
          </motion.div>
        )}
      </div>

      {/* Bottom decorative line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </motion.div>
  );
};
