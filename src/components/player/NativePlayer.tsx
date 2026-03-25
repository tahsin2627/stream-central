import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Loader2,
  AlertCircle,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Subtitles,
  Gauge,
  PictureInPicture2,
  SkipForward,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

interface StreamSource {
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'dash' | 'embed';
}

interface NativePlayerProps {
  sources: StreamSource[];
  title?: string;
  episodeInfo?: string;
  poster?: string;
  onError?: () => void;
  onBack?: () => void;
  isTV?: boolean;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const NativePlayer = ({
  sources,
  title,
  episodeInfo,
  poster,
  onError,
  onBack,
  isTV,
  onPrevEpisode,
  onNextEpisode,
  hasPrev,
  hasNext,
}: NativePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapCountRef = useRef(0);

  const [currentSource, setCurrentSource] = useState<StreamSource | null>(sources[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableQualities, setAvailableQualities] = useState<{ label: string; level: number }[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<{ side: 'left' | 'right'; seconds: number } | null>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);

  // Initialize HLS or native video
  useEffect(() => {
    if (!currentSource || !videoRef.current) return;
    const video = videoRef.current;
    setIsLoading(true);
    setError(null);
    setShowNextEpisode(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (currentSource.type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 60,
        });
        hls.loadSource(currentSource.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          const levels = hls.levels.map((level, i) => ({
            label: level.height ? `${level.height}p` : `Source ${i + 1}`,
            level: i,
          }));
          if (levels.length > 0) {
            setAvailableQualities([{ label: 'Auto', level: -1 }, ...levels]);
          }
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError('Stream failed — tap retry or try another source');
            setIsLoading(false);
            onError?.();
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentSource.url;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          video.play().catch(() => {});
        }, { once: true });
      } else {
        setError('HLS not supported on this device');
        setIsLoading(false);
      }
    } else {
      video.src = currentSource.url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => {});
      }, { once: true });
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [currentSource, onError]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1));
      // Show next episode button when 90% through
      if (video.duration > 0 && video.currentTime / video.duration > 0.9 && hasNext) {
        setShowNextEpisode(true);
      }
    };
    const onDuration = () => setDuration(video.duration);
    const onVolumeChange = () => { setVolume(video.volume); setIsMuted(video.muted); };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = () => { setError('Playback error'); setIsLoading(false); };
    const onEnded = () => { setIsPlaying(false); if (hasNext) setShowNextEpisode(true); };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
    };
  }, [hasNext]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  }, [isPlaying, isLocked]);

  useEffect(() => {
    showControlsTemporarily();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying]);

  // Control handlers
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    setSeekIndicator({ side: seconds > 0 ? 'right' : 'left', seconds: Math.abs(seconds) });
    setTimeout(() => setSeekIndicator(null), 800);
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      toast(`Speed: ${speed}x`, { duration: 1000 });
    }
  };

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setSelectedQuality(level);
      const label = availableQualities.find(q => q.level === level)?.label || 'Auto';
      toast(`Quality: ${label}`, { duration: 1000 });
    }
  };

  const handlePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (videoRef.current) await videoRef.current.requestPictureInPicture();
    } catch { toast.error('PiP not supported'); }
  };

  // Progress bar interaction
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = ratio * duration;
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = ratio * duration;
  };

  // Double-tap to seek zones
  const handleVideoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) { showControlsTemporarily(); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width * 0.35;
    const isRight = x > rect.width * 0.65;

    doubleTapCountRef.current += 1;

    if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    doubleTapTimerRef.current = setTimeout(() => {
      if (doubleTapCountRef.current === 1) {
        // Single tap — toggle controls
        setShowControls(prev => !prev);
      } else if (doubleTapCountRef.current >= 2) {
        // Double tap — seek
        if (isLeft) seek(-10);
        else if (isRight) seek(10);
        else togglePlay();
      }
      doubleTapCountRef.current = 0;
    }, 250);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none"
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        crossOrigin="anonymous"
      />

      {/* Loading Spinner */}
      <AnimatePresence>
        {isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30"
          >
            <img src={wellplayerLogo} alt="WellPlayer" className="h-14 w-14 rounded-2xl mb-4 shadow-2xl" />
            <Loader2 className="h-9 w-9 animate-spin text-primary mb-2" />
            <p className="text-white/70 text-sm font-medium">Loading stream…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 px-6"
          >
            <AlertCircle className="h-14 w-14 text-red-500 mb-4" />
            <p className="text-white text-lg font-bold mb-1 text-center">Stream Failed</p>
            <p className="text-white/60 text-sm mb-6 text-center">{error}</p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                onClick={() => { setError(null); setCurrentSource({ ...currentSource! }); }}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
              {sources.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-full px-6 border-white/30 text-white">
                      Other Sources <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {sources.map((s, i) => (
                      <DropdownMenuItem key={i} onClick={() => { setError(null); setCurrentSource(s); }}>
                        {s.quality} ({s.type.toUpperCase()})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {onBack && (
                <Button variant="ghost" onClick={onBack} className="text-white/60 rounded-full px-6">
                  Go Back
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seek Indicator */}
      <AnimatePresence>
        {seekIndicator && (
          <motion.div
            key={`seek-${seekIndicator.side}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1',
              seekIndicator.side === 'left' ? 'left-8' : 'right-8'
            )}
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              {seekIndicator.side === 'left'
                ? <RotateCcw className="h-8 w-8 text-white" />
                : <RotateCw className="h-8 w-8 text-white" />
              }
            </div>
            <span className="text-white text-sm font-bold">{seekIndicator.seconds}s</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Episode Banner */}
      <AnimatePresence>
        {showNextEpisode && hasNext && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-4 z-40"
          >
            <Button
              onClick={() => { setShowNextEpisode(false); onNextEpisode?.(); }}
              className="gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 text-base font-semibold shadow-2xl"
            >
              <SkipForward className="h-5 w-5" />
              Next Episode
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap Zone Overlay */}
      <div
        className="absolute inset-0 z-10"
        onClick={handleVideoTap}
        style={{ pointerEvents: error || isLoading ? 'none' : 'auto' }}
      />

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {/* Top gradient */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
            {/* Bottom gradient */}
            <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* === TOP BAR === */}
            <div className="absolute top-0 inset-x-0 px-4 pt-4 pb-2 flex items-center gap-3 pointer-events-auto">
              {onBack && (
                <button
                  onClick={(e) => { e.stopPropagation(); onBack(); }}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base leading-tight truncate drop-shadow">{title}</p>
                {episodeInfo && <p className="text-white/70 text-xs mt-0.5">{episodeInfo}</p>}
              </div>
              {/* Lock button */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsLocked(l => !l); toast(isLocked ? 'Unlocked' : 'Controls locked', { duration: 1200 }); }}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20"
              >
                {isLocked ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4" />}
              </button>
            </div>

            {/* === CENTER CONTROLS === */}
            {!isLocked && (
              <div className="absolute inset-0 flex items-center justify-center gap-6 pointer-events-auto">
                {/* Prev Episode */}
                {isTV && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPrevEpisode?.(); }}
                    disabled={!hasPrev}
                    className="h-14 w-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white disabled:opacity-30 active:bg-white/20"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                )}

                {/* Seek Back 10s */}
                <button
                  onClick={(e) => { e.stopPropagation(); seek(-10); }}
                  className="h-14 w-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20"
                >
                  <RotateCcw className="h-6 w-6" />
                </button>

                {/* Play / Pause — BIG */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="h-20 w-20 flex items-center justify-center rounded-full bg-primary shadow-2xl text-primary-foreground active:scale-95 transition-transform"
                >
                  {isLoading
                    ? <Loader2 className="h-9 w-9 animate-spin" />
                    : isPlaying
                    ? <Pause className="h-9 w-9" fill="currentColor" />
                    : <Play className="h-9 w-9 ml-1" fill="currentColor" />
                  }
                </button>

                {/* Seek Forward 10s */}
                <button
                  onClick={(e) => { e.stopPropagation(); seek(10); }}
                  className="h-14 w-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20"
                >
                  <RotateCw className="h-6 w-6" />
                </button>

                {/* Next Episode */}
                {isTV && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
                    disabled={!hasNext}
                    className="h-14 w-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white disabled:opacity-30 active:bg-white/20"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </button>
                )}
              </div>
            )}

            {/* === BOTTOM BAR === */}
            {!isLocked && (
              <div className="absolute bottom-0 inset-x-0 px-4 pb-6 space-y-3 pointer-events-auto">
                {/* Time labels */}
                <div className="flex items-center justify-between text-xs text-white/80 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Progress Bar */}
                <div
                  ref={progressRef}
                  className="relative h-4 flex items-center cursor-pointer group/progress"
                  onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
                  onTouchMove={(e) => { e.stopPropagation(); handleProgressTouch(e); }}
                  onMouseDown={() => setIsDraggingProgress(true)}
                  onMouseUp={() => setIsDraggingProgress(false)}
                >
                  {/* Track */}
                  <div className="absolute inset-x-0 h-1.5 bg-white/20 rounded-full" />
                  {/* Buffered */}
                  <div
                    className="absolute left-0 h-1.5 bg-white/35 rounded-full transition-all"
                    style={{ width: `${bufferedPct}%` }}
                  />
                  {/* Progress */}
                  <div
                    className="absolute left-0 h-1.5 bg-primary rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                  {/* Thumb */}
                  <div
                    className="absolute h-4 w-4 bg-white rounded-full shadow-lg -translate-x-1/2 group-hover/progress:scale-125 transition-transform"
                    style={{ left: `${progressPct}%` }}
                  />
                </div>

                {/* Bottom controls row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Volume */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.muted = !isMuted; }}
                      className="h-10 w-10 flex items-center justify-center rounded-full text-white active:bg-white/20"
                    >
                      {isMuted || volume === 0
                        ? <VolumeX className="h-5 w-5" />
                        : <Volume2 className="h-5 w-5" />
                      }
                    </button>
                  </div>

                  {/* Center: Settings row */}
                  <div className="flex items-center gap-1">
                    {/* Speed */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "h-9 px-3 flex items-center gap-1.5 rounded-full text-white text-xs font-medium active:bg-white/20",
                            playbackRate !== 1 && "bg-primary/80 text-primary-foreground"
                          )}
                        >
                          <Gauge className="h-4 w-4" />
                          {playbackRate !== 1 ? `${playbackRate}x` : 'Speed'}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="min-w-[100px]">
                        <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Playback Speed</div>
                        <DropdownMenuSeparator />
                        {SPEED_OPTIONS.map(s => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => handleSpeedChange(s)}
                            className={cn('cursor-pointer', s === playbackRate && 'bg-accent font-bold')}
                          >
                            {s}x {s === 1 && '(Normal)'}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Quality */}
                    {availableQualities.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 px-3 flex items-center gap-1.5 rounded-full text-white text-xs font-medium active:bg-white/20"
                          >
                            <Settings className="h-4 w-4" />
                            {availableQualities.find(q => q.level === selectedQuality)?.label || 'Auto'}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Quality</div>
                          <DropdownMenuSeparator />
                          {availableQualities.map(q => (
                            <DropdownMenuItem
                              key={q.level}
                              onClick={() => handleQualityChange(q.level)}
                              className={cn('cursor-pointer', q.level === selectedQuality && 'bg-accent font-bold')}
                            >
                              {q.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Source (if multiple) */}
                    {sources.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 px-3 flex items-center gap-1.5 rounded-full text-white text-xs font-medium active:bg-white/20"
                          >
                            <ChevronDown className="h-4 w-4" />
                            {currentSource?.quality || 'Source'}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Stream Source</div>
                          <DropdownMenuSeparator />
                          {sources.map((s, i) => (
                            <DropdownMenuItem
                              key={i}
                              onClick={() => setCurrentSource(s)}
                              className={cn('cursor-pointer', s === currentSource && 'bg-accent font-bold')}
                            >
                              {s.quality} ({s.type.toUpperCase()})
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* PiP */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePiP(); }}
                      className="h-9 w-9 flex items-center justify-center rounded-full text-white active:bg-white/20"
                      title="Picture in Picture"
                    >
                      <PictureInPicture2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Right: Fullscreen */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="h-10 w-10 flex items-center justify-center rounded-full text-white active:bg-white/20"
                  >
                    {isFullscreen
                      ? <Minimize className="h-5 w-5" />
                      : <Maximize className="h-5 w-5" />
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Locked overlay hint */}
            {isLocked && (
              <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsLocked(false); }}
                  className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-sm px-5 py-3 rounded-full border border-white/20"
                >
                  <Lock className="h-4 w-4 text-primary" />
                  Tap to Unlock
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
