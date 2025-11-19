import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.supermarket',
  appName: 'supermarket',
  webDir: 'dist',
  "server": {
    "url": "http://localhost:5173/",
    "cleartext": true
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    }
  }
};

export default config;
