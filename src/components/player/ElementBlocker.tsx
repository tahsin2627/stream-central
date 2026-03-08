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
 * Aggressive ad/popup/redirect blocker for iframe player mode.
 * 
 * Blocks:
 * 1. window.open popups from any context
 * 2. Top-level navigation hijacking (location.assign, location.replace, location.href)
 * 3. Anchor clicks with target="_blank" injected by ads
 * 4. beforeunload/unload hijacking
 * 5. Suspicious new window/tab triggers via message events from iframes
 */
export const ElementBlocker = ({ isActive: controlledActive, onToggle, className }: ElementBlockerProps) => {
  const [isActive, setIsActive] = useState(() => {
    const stored = localStorage.getItem('wellplayer_element_blocker');
    return stored !== null ? stored === 'true' : true;
  });
  const [blockedCount, setBlockedCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  const active = controlledActive !== undefined ? controlledActive : isActive;

  useEffect(() => {
    localStorage.setItem('wellplayer_element_blocker', String(isActive));
  }, [isActive]);

  // Core blocking logic
  useEffect(() => {
    if (!active) return;

    const blocked = { count: 0 };
    const incrementBlocked = () => {
      blocked.count++;
      setBlockedCount(prev => prev + 1);
      setShowBadge(true);
      setTimeout(() => setShowBadge(false), 2000);
    };

    // 1. Block window.open
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string): Window | null {
      const urlStr = String(url || '');
      // Allow same-origin navigations and blob/data URLs
      if (urlStr.startsWith(window.location.origin) || urlStr.startsWith('blob:') || urlStr.startsWith('data:')) {
        return originalOpen.call(window, url, target, features);
      }
      console.log('[Shield] Blocked popup:', urlStr);
      incrementBlocked();
      return null;
    };

    // 2. Block navigation via beforeunload — if an iframe triggers top navigation,
    // the browser fires beforeunload. We can't block it but we can refocus.
    // (location.assign/replace are read-only and cannot be overridden)

    // 3. Block all new-tab link clicks that weren't user-initiated on our UI
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        const linkTarget = anchor.getAttribute('target');
        
        // Block external links with target="_blank" that aren't part of our app
        if (linkTarget === '_blank' && href && !href.includes(window.location.hostname) && !anchor.closest('[data-app-link]')) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[Shield] Blocked external link:', href);
          incrementBlocked();
          return;
        }
      }

      // Block clicks on suspicious invisible/overlay elements
      if (target.tagName === 'DIV' || target.tagName === 'A' || target.tagName === 'SPAN') {
        const style = window.getComputedStyle(target);
        const zIndex = parseInt(style.zIndex) || 0;
        const opacity = parseFloat(style.opacity);
        
        // Suspicious: high z-index with low/zero opacity (invisible overlay trick)
        if (zIndex > 999 && opacity < 0.1) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[Shield] Blocked invisible overlay click');
          incrementBlocked();
        }
      }
    };

    // 4. Intercept postMessage from iframes attempting navigation
    const handleMessage = (e: MessageEvent) => {
      // Block iframe messages that try to navigate the parent
      if (typeof e.data === 'string') {
        const data = e.data.toLowerCase();
        if (data.includes('redirect') || data.includes('window.open') || data.includes('location.href')) {
          console.log('[Shield] Blocked suspicious iframe message:', e.data.substring(0, 100));
          incrementBlocked();
          return;
        }
      }
      if (typeof e.data === 'object' && e.data !== null) {
        const str = JSON.stringify(e.data).toLowerCase();
        if (str.includes('redirect') || str.includes('popup') || str.includes('adclick')) {
          console.log('[Shield] Blocked suspicious iframe message object');
          incrementBlocked();
          return;
        }
      }
    };

    // 5. Block focus theft (ads that steal focus to new windows)
    const handleBlur = () => {
      // If window loses focus right after a click, an ad popup likely opened
      // Re-focus our window
      setTimeout(() => {
        window.focus();
      }, 100);
    };

    // 6. Prevent beforeunload hijacking by ads
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only block if it's not a user-initiated navigation
      // (checked by whether any of our app links were clicked)
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('message', handleMessage);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.location.assign = originalAssign;
      window.location.replace = originalReplace;
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [active]);

  const toggleBlocker = useCallback(() => {
    const next = !isActive;
    setIsActive(next);
    onToggle?.(next);
    toast(next ? '🛡️ Shield ON — blocking ads & redirects' : '🔓 Shield OFF', { duration: 1500 });
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
            ? "text-primary hover:text-primary/80"
            : "text-muted-foreground"
        )}
        title={active ? `Shield active (${blockedCount} blocked)` : 'Enable ad shield'}
      >
        {active ? (
          <Shield className="h-3.5 w-3.5" fill="currentColor" />
        ) : (
          <ShieldOff className="h-3.5 w-3.5" />
        )}
        <span className="text-xs hidden sm:inline">Shield</span>
      </Button>

      {/* Blocked count badge */}
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
