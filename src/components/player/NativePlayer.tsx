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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { UnmuteBanner } from './UnmuteBanner';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

interface StreamSource {
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'dash' | 'embed';
}

interface NativePlayerProps {
  sources: StreamSource[];
  title?: string;
  poster?: string;
  onError?: () => void;
  onBack?: () => void;
  isTV?: boolean;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const NativePlayer = ({ sources, title, poster, onError, onBack }: NativePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentSource, setCurrentSource] = useState<StreamSource | null>(sources[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for iOS autoplay compliance
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
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize HLS or native video
  useEffect(() => {
    if (!currentSource || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);

    // Cleanup previous HLS instance
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
        });

        hls.loadSource(currentSource.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          const levels = hls.levels.map((level, i) => ({
            label: level.height ? `${level.height}p` : `Level ${i + 1}`,
            level: i,
          }));
          setAvailableQualities([{ label: 'Auto', level: -1 }, ...levels]);
          // Start muted for iOS autoplay compliance, unmute after play succeeds
          video.muted = true;
          video.play().then(() => {
            // Unmute after successful play if user has interacted
            if (hasUserInteracted) {
              video.muted = false;
            }
          }).catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data.type, data.details, data.fatal);
          if (data.fatal) {
            console.error('HLS fatal error:', data);
            // More specific error messages
            let errorMsg = 'Failed to load video stream';
            if (data.response?.code === 401 || data.response?.code === 403) {
              errorMsg = 'Stream requires authentication - trying another source...';
            } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              errorMsg = 'Network error - stream may be unavailable';
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              errorMsg = 'Media error - format not supported';
            }
            setError(errorMsg);
            setIsLoading(false);
            onError?.();
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support - start muted for iOS
        video.src = currentSource.url;
        video.muted = true;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          video.play().then(() => {
            if (hasUserInteracted) video.muted = false;
          }).catch(() => {});
        });
      } else {
        setError('HLS not supported in this browser');
        setIsLoading(false);
      }
    } else {
      // MP4 or other native format - start muted for iOS
      video.src = currentSource.url;
      video.muted = true;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().then(() => {
          if (hasUserInteracted) video.muted = false;
        }).catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSource, onError]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError('Playback error');
      setIsLoading(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimeout]);

  // Control handlers
  const togglePlay = () => {
    if (videoRef.current) {
      setHasUserInteracted(true);
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Unmute on first user-initiated play (iOS compliance)
        if (videoRef.current.muted && !isMuted) {
          videoRef.current.muted = false;
        }
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      videoRef.current.muted = value[0] === 0;
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setSelectedQuality(level);
    }
  };

  const handleSourceChange = (source: StreamSource) => {
    setCurrentSource(source);
  };

  const handleRetry = () => {
    if (currentSource) {
      setCurrentSource({ ...currentSource }); // Force re-initialization
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={resetControlsTimeout}
      onClick={(e) => {
        if (e.target === videoRef.current || (e.target as HTMLElement).closest('.video-overlay')) {
          togglePlay();
        }
        resetControlsTimeout();
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        muted
        crossOrigin="anonymous"
      />

      {/* Unmute Banner for iOS autoplay */}
      <UnmuteBanner
        isMuted={isMuted}
        onUnmute={() => {
          if (videoRef.current) {
            videoRef.current.muted = false;
            setHasUserInteracted(true);
          }
        }}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20"
          >
            <img src={wellplayerLogo} alt="Wellplayer" className="h-16 w-16 rounded-xl mb-4" />
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading stream...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20"
          >
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">{error}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              {sources.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Try Another Source
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {sources.map((source, i) => (
                      <DropdownMenuItem
                        key={i}
                        onClick={() => handleSourceChange(source)}
                        disabled={source === currentSource}
                      >
                        {source.quality} ({source.type.toUpperCase()})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 video-overlay"
          >
            {/* Top Gradient */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={wellplayerLogo} alt="" className="h-6 w-6 rounded" />
                {title && <span className="text-white font-medium text-sm line-clamp-1">{title}</span>}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Source Selector */}
                {sources.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        {currentSource?.quality}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {sources.map((source, i) => (
                        <DropdownMenuItem
                          key={i}
                          onClick={() => handleSourceChange(source)}
                          className={cn(source === currentSource && 'bg-accent')}
                        >
                          {source.quality} ({source.type.toUpperCase()})
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Quality Selector (HLS only) */}
                {availableQualities.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {availableQualities.map((q) => (
                        <DropdownMenuItem
                          key={q.level}
                          onClick={() => handleQualityChange(q.level)}
                          className={cn(q.level === selectedQuality && 'bg-accent')}
                        >
                          {q.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 pointer-events-auto"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" fill="currentColor" />
                ) : (
                  <Play className="h-8 w-8 ml-1" fill="currentColor" />
                )}
              </Button>
            </div>

            {/* Seek Buttons */}
            <div className="absolute inset-0 flex items-center justify-center gap-24 pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  seek(-10);
                }}
                className="h-14 w-14 rounded-full bg-black/30 text-white hover:bg-black/50 pointer-events-auto"
              >
                <RotateCcw className="h-5 w-5" />
                <span className="absolute text-[10px] font-bold">10</span>
              </Button>
              
              <div className="w-20" /> {/* Spacer for center button */}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  seek(10);
                }}
                className="h-14 w-14 rounded-full bg-black/30 text-white hover:bg-black/50 pointer-events-auto"
              >
                <RotateCw className="h-5 w-5" />
                <span className="absolute text-[10px] font-bold">10</span>
              </Button>
            </div>

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              {/* Progress Bar */}
              <div className="relative group/progress">
                <div className="absolute h-1 w-full bg-white/20 rounded" />
                <div
                  className="absolute h-1 bg-white/40 rounded"
                  style={{ width: `${(buffered / duration) * 100}%` }}
                />
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-primary [&>span:first-child_span]:bg-primary"
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    className="h-9 w-9 text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center gap-1 group/vol">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                      className="h-9 w-9 text-white hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        min={0}
                        max={1}
                        step={0.05}
                        onValueChange={handleVolumeChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20"
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-white text-xs ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="h-9 w-9 text-white hover:bg-white/20"
                  >
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
