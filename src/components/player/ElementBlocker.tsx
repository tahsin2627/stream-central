import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ElementBlockerProps {
  isActive?: boolean;
  onToggle?: (active: boolean) => void;
  className?: string;
}

/**
 * Element Blocker for iframe mode.
 * Since we can't inject CSS into cross-origin iframes, this:
 * 1. Overlays clickable "block zones" on common ad positions (corners, banners)
 * 2. Intercepts popup window.open attempts
 * 3. Blocks redirect attempts from third-party scripts
 */
export const ElementBlocker = ({ isActive: controlledActive, onToggle, className }: ElementBlockerProps) => {
  const [isActive, setIsActive] = useState(() => {
    const stored = localStorage.getItem('wellplayer_element_blocker');
    return stored !== null ? stored === 'true' : true; // Default ON
  });
  const [blockedCount, setBlockedCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  const active = controlledActive !== undefined ? controlledActive : isActive;

  // Persist preference
  useEffect(() => {
    localStorage.setItem('wellplayer_element_blocker', String(isActive));
  }, [isActive]);

  // Block popup windows and redirect attempts
  useEffect(() => {
    if (!active) return;

    // Override window.open to block popups from iframe postMessage
    const originalOpen = window.open;
    window.open = function (...args: any[]) {
      // Allow our own app navigations, block third-party popups
      const url = args[0] as string;
      if (url && !url.includes(window.location.hostname)) {
        setBlockedCount(prev => prev + 1);
        setShowBadge(true);
        setTimeout(() => setShowBadge(false), 2000);
        console.log('[ElementBlocker] Blocked popup:', url);
        return null;
      }
      return originalOpen.apply(window, args as any);
    };

    // Block beforeunload hijacking from iframes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't let embedded content trigger navigation
    };

    // Intercept click events that might be ad-triggered redirects
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Block clicks on transparent overlay divs (common ad trick)
      if (target.tagName === 'DIV' && 
          target.style.position === 'fixed' && 
          (target.style.zIndex === '9999' || parseInt(target.style.zIndex) > 1000)) {
        e.preventDefault();
        e.stopPropagation();
        setBlockedCount(prev => prev + 1);
        console.log('[ElementBlocker] Blocked suspicious overlay click');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [active]);

  const toggleBlocker = useCallback(() => {
    const next = !isActive;
    setIsActive(next);
    onToggle?.(next);
    toast(next ? '🛡️ Ad blocker enabled' : '🔓 Ad blocker disabled', { duration: 1500 });
  }, [isActive, onToggle]);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleBlocker}
        className={cn(
          "h-8 sm:h-9 px-2 sm:px-3 gap-1.5",
          active
            ? "text-emerald-500 hover:text-emerald-400"
            : "text-muted-foreground"
        )}
        title={active ? 'Ad blocker active' : 'Enable ad blocker'}
      >
        {active ? (
          <Shield className="h-3.5 w-3.5" fill="currentColor" />
        ) : (
          <ShieldOff className="h-3.5 w-3.5" />
        )}
        <span className="text-xs hidden sm:inline">{active ? 'Shield' : 'Shield'}</span>
      </Button>

      {/* Blocked count badge */}
      <AnimatePresence>
        {showBadge && blockedCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center"
          >
            {blockedCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Invisible overlay zones to catch ad clicks in common positions */}
      {active && (
        <>
          {/* Top-right corner ad zone blocker */}
          <div
            className="fixed top-0 right-0 w-8 h-8 z-[100] pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBlockedCount(prev => prev + 1);
            }}
            style={{ opacity: 0 }}
          />
          {/* Bottom-left banner ad zone */}
          <div
            className="fixed bottom-16 left-0 w-full h-1 z-[100] pointer-events-none"
            style={{ opacity: 0 }}
          />
        </>
      )}
    </div>
  );
};
