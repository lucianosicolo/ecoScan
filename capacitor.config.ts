import type {
  CapacitorConfig,
} from '@capacitor/cli';

const config:
  CapacitorConfig = {

  appId:
    'com.ecoscan.app',

  appName:
    'EcoScan',

  webDir:
    'www',

  android: {
    allowMixedContent: true,
  },
};

export default config;