import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee, Heart } from 'lucide-react';

export const DonationBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show once per session, after a short delay
    const dismissed = sessionStorage.getItem('wellplayer_donation_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('wellplayer_donation_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50"
        >
          <div className="relative rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-4 overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Coffee className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Enjoying ad-free streaming?
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Wellplayer is free & community-powered. A small tip keeps it running!
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <a
                href="https://www.supportkori.com/tahsin57b34"
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Heart className="h-3.5 w-3.5" />
                Buy me a coffee
              </a>
              <button
                onClick={dismiss}
                className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
