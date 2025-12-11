import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.supermarket',
  appName: 'supermarket',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    hostname: 'localhost',
    iosScheme: 'http'
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
