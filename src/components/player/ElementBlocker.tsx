import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ElementBlockerProps {
  isActive?: boolean;
  onToggle?: (active: boolean) => void;
  className?: string;
}

/**
 * Ad/popup/redirect blocker for iframe player mode.
 * 
 * Primary defense: iframe `sandbox` attribute (controlled by parent WatchPage)
 * - Blocks: popups, top-level script navigation, ad redirects
 * - Allows: scripts, same-origin, forms, presentation, user-activated navigation
 * 
 * Secondary defense (this component):
 * - Blocks window.open from parent context
 * - Intercepts suspicious postMessage from iframes
 * - Catches ad overlay clicks
 * - Re-focuses window on blur (popup steal)
 */
export const ElementBlocker = ({ isActive, onToggle, className }: ElementBlockerProps) => {
  const [internalActive, setInternalActive] = useState(() => {
    const stored = localStorage.getItem('wellplayer_element_blocker');
    return stored !== null ? stored === 'true' : true;
  });
  const [blockedCount, setBlockedCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  const active = isActive !== undefined ? isActive : internalActive;

  // Persist preference
  useEffect(() => {
    localStorage.setItem('wellplayer_element_blocker', String(active));
  }, [active]);

  // Secondary blocking logic (parent-frame level)
  useEffect(() => {
    if (!active) return;

    const incrementBlocked = () => {
      setBlockedCount(prev => prev + 1);
      setShowBadge(true);
      setTimeout(() => setShowBadge(false), 2000);
    };

    // Block window.open popups
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string): Window | null {
      const urlStr = String(url || '');
      if (urlStr.startsWith(window.location.origin) || urlStr.startsWith('blob:') || urlStr.startsWith('data:') || urlStr === '') {
        return originalOpen.call(window, url, target, features);
      }
      console.log('[Shield] Blocked popup:', urlStr);
      incrementBlocked();
      return null;
    };

    // Block suspicious external link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        const linkTarget = anchor.getAttribute('target');
        if (linkTarget === '_blank' && href && !href.includes(window.location.hostname) && !anchor.closest('[data-app-link]')) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[Shield] Blocked external link:', href);
          incrementBlocked();
          return;
        }
      }
    };

    // Intercept suspicious iframe messages
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === 'string') {
        const data = e.data.toLowerCase();
        if (data.includes('redirect') || data.includes('window.open') || data.includes('location.href')) {
          console.log('[Shield] Blocked suspicious iframe message');
          incrementBlocked();
        }
      }
    };

    // Re-focus if popup steals focus
    const handleBlur = () => {
      setTimeout(() => window.focus(), 100);
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('message', handleMessage);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.open = originalOpen;
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('blur', handleBlur);
    };
  }, [active]);

  const toggleBlocker = useCallback(() => {
    const next = !active;
    setInternalActive(next);
    onToggle?.(next);
    toast(next ? '🛡️ Shield ON — ads & popups blocked' : '🔓 Shield OFF — if player breaks, turn it back on', { duration: 2500 });
  }, [active, onToggle]);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleBlocker}
        className={cn(
          "h-8 sm:h-9 px-2 sm:px-3 gap-1.5",
          active
            ? "text-primary hover:text-primary/80"
            : "text-muted-foreground"
        )}
        title={active ? `Shield ON (${blockedCount} blocked)` : 'Enable ad shield'}
      >
        {active ? (
          <Shield className="h-3.5 w-3.5" fill="currentColor" />
        ) : (
          <ShieldOff className="h-3.5 w-3.5" />
        )}
        <span className="text-xs hidden sm:inline">Shield</span>
      </Button>

      <AnimatePresence>
        {showBadge && blockedCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center"
          >
            {blockedCount}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
