import { useState, useEffect } from 'react';

export const useIOSDetection = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isBrave, setIsBrave] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // Detect Brave
    const detectBrave = async () => {
      try {
        setIsBrave(!!(navigator as any).brave && await (navigator as any).brave.isBrave());
      } catch {
        setIsBrave(false);
      }
    };
    detectBrave();
  }, []);

  const needsUserGesture = isIOS || isBrave;

  return { isIOS, isBrave, needsUserGesture };
};
