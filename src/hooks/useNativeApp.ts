/**
 * Detects whether the app is running inside a Capacitor native WebView (APK/IPA)
 * vs a regular browser. In native context, iframe sandbox should be disabled
 * since Android/iOS WebView handles security natively.
 */
export const isNativeApp = (): boolean => {
  const cap = (window as any).Capacitor;
  if (!cap) {
    // Fallback: detect Android WebView by user agent
    const ua = navigator.userAgent;
    return /; wv\)/.test(ua) || (ua.includes('Android') && !ua.includes('Chrome'));
  }
  return cap.isNativePlatform?.() === true || cap.platform === 'android' || cap.platform === 'ios';
};

export const useNativeApp = () => {
  return {
    isNative: isNativeApp(),
    platform: (window as any).Capacitor?.getPlatform?.() as string || 'web',
  };
};
