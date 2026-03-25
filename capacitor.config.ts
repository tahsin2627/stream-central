import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wellplayer.app',
  appName: 'Wellplayer',
  webDir: 'dist',
  // NOTE: Remove the server.url block for production APK builds.
  // Uncomment below ONLY for live development/hot-reload:
  // server: {
  //   url: 'https://51ed6916-a37a-425d-bdd2-75f8bae4ebb7.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  android: {
    // Allow mixed content and all HTTPS origins in the WebView
    // This bypasses the browser iframe sandbox restrictions that break embed servers
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
