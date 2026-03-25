import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wellplayer.app',
  appName: 'Wellplayer',
  webDir: 'dist',
  // Live URL — APK loads directly from the hosted app for always-up-to-date content
  server: {
    url: 'https://51ed6916-a37a-425d-bdd2-75f8bae4ebb7.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    allowNavigation: [
      '*.vidsrc.xyz',
      '*.vidsrc.to',
      '*.vidsrc.me',
      '*.vidsrc.cc',
      '*.vidsrc.wtf',
      '*.embed.su',
      '*.superembed.stream',
      '*.multiembed.mov',
      '*.2embed.cc',
      '*.autoembed.cc',
      '*.vidlink.pro',
      '*.moviesapi.club',
      '*.smashystream.com',
      '*.netmirr.xyz',
      '*.netmirr.net',
      '*.hin2.xyz',
      '*.hindi2.xyz',
      '*.filmaxy.com',
      '*.videasy.net',
      '*.letsembed.cc',
      '*.vidembed.site',
      '*.moviesapi.to',
      '*.cineby.app',
      '*.tmovies.tv',
      '*.embedder.net',
    ],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
  },
};

export default config;
