import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.51ed6916a37a425dbdd275f8bae4ebb7',
  appName: 'Wellplayer',
  webDir: 'dist',
  // Hot-reload from sandbox while developing
  server: {
    url: 'https://51ed6916-a37a-425d-bdd2-75f8bae4ebb7.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    // Allow mixed content and all HTTPS origins in the WebView
    // This bypasses the browser iframe sandbox restrictions that break embed servers
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,  // Remove before final release
  },
  plugins: {
    // Allow any origin to be loaded in the WebView
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
