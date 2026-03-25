/**
 * Detects whether the app is running inside a Capacitor native WebView (APK/IPA)
 * vs a regular browser. In native context, iframe sandbox should be disabled
 * since Android/iOS WebView handles security natively.
 */
export const isNativeApp = (): boolean => {
  // Capacitor sets window.Capacitor when running as a native app
  return !!(window as any).Capacitor?.isNativePlatform?.() 
    || !!(window as any).Capacitor?.platform === 'android'
    || !!(window as any).Capacitor?.platform === 'ios'
    // Fallback: check user agent for WebView
    || /wv\)/.test(navigator.userAgent)
    || /Android.*Version\/[\d.]+.*Chrome\/[\d.]+ Mobile/.test(navigator.userAgent) === false && /Android/.test(navigator.userAgent) && /; wv\)/.test(navigator.userAgent);
};

export const useNativeApp = () => {
  return {
    isNative: isNativeApp(),
    platform: (window as any).Capacitor?.getPlatform?.() || 'web',
  };
};
