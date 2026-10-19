/// <reference types="vite/client" />

interface TelegramCloudStorage {
  setItem: (key: string, value: string, cb?: (err: Error | null, ok?: boolean) => void) => void;
  getItem: (key: string, cb: (err: Error | null, value?: string) => void) => void;
  removeItem: (key: string, cb?: (err: Error | null, ok?: boolean) => void) => void;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: { id: number; first_name?: string; username?: string };
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  isFullscreen?: boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableVerticalSwipes?: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  onEvent: (event: string, handler: () => void) => void;
  offEvent: (event: string, handler: () => void) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  CloudStorage?: TelegramCloudStorage;
}

interface Window {
  Telegram?: { WebApp: TelegramWebApp };
}
