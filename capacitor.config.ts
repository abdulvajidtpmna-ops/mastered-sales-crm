import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.masteredskillacademy.crm',
  appName: 'Mastered CRM',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['script.google.com', 'script.googleusercontent.com', '*']
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
