import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.embercamp.expedition',
  appName: '烬营远征',
  webDir: 'dist',
  // 游戏类应用：禁止 WebView 自身滚动/缩放，交给游戏内部处理
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
