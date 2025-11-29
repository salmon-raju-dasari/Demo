import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.supermarket',
  appName: 'supermarket',
  webDir: 'dist',
  server: {
    // Use http instead of https to avoid mixed content issues with HTTP API
    androidScheme: 'http',
    hostname: 'localhost',
    iosScheme: 'http'
  },
  // Uncomment the section below for live reload during development
  // "server": {
  //   "url": "http://192.168.1.2:5173/",
  //   "cleartext": true
  // },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    }
  }
};

export default config;
