import { useState, useRef, useEffect } from 'react';
import { X, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, Maximize2, Minimize2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface InAppBrowserProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InAppBrowser = ({ url, title, isOpen, onClose }: InAppBrowserProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when URL changes
  useEffect(() => {
    setCurrentUrl(url);
    setIsLoading(true);
    setLoadError(false);
  }, [url]);

  // Track if iframe loaded successfully
  useEffect(() => {
    if (!isOpen) return;
    
    // Set a timeout - if iframe doesn't load, show error state
    const timeout = setTimeout(() => {
      if (isLoading) {
        setLoadError(true);
        setIsLoading(false);
      }
    }, 15000); // 15 seconds timeout

    return () => clearTimeout(timeout);
  }, [isOpen, isLoading, currentUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    setLoadError(true);
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setLoadError(false);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.log('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        ref={containerRef}
        className={cn(
          "p-0 gap-0 overflow-hidden bg-black border-border",
          isFullscreen ? "fixed inset-0 w-screen h-screen max-w-none rounded-none" : "sm:max-w-[95vw] sm:max-h-[90vh] w-[95vw] h-[85vh]"
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        
        {/* Browser Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm border-b border-border">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* URL Bar */}
          <div className="flex-1 px-3 py-1.5 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground truncate font-mono">
            {currentUrl}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleOpenExternal}
              title="Open in New Tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 bg-black" style={{ height: 'calc(100% - 48px)' }}>
          {/* Loading Overlay */}
          {isLoading && !loadError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading external site...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">This may take a moment</p>
            </div>
          )}

          {/* Error State - Site blocks embedding */}
          {loadError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/95 p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Site Blocked Embedding
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                This website has security settings that prevent it from being displayed within our app. 
                Click below to open it in a new browser tab.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleOpenExternal} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-4">
                Tip: Use the built-in servers for seamless in-app playback
              </p>
            </div>
          )}

          {/* Iframe - Try to load the site */}
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className={cn(
              "w-full h-full border-0",
              (isLoading || loadError) && "opacity-0"
            )}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            allow="fullscreen; autoplay; encrypted-media"
            referrerPolicy="no-referrer"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
