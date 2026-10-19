export const tg = window.Telegram?.WebApp;
export const isTelegram = Boolean(tg);

function safeCall<T>(fn: () => T): T | undefined {
  try { return fn(); } catch (e) { console.warn('[TG] call failed:', e); return undefined; }
}

export function setHeaderColor(color: string): void {
  if (!tg) return;
  if (typeof tg.setHeaderColor === 'function') safeCall(() => tg.setHeaderColor(color));
  // Меняем только CSS-переменную для #header-bg
  document.documentElement.style.setProperty('--app-header-color', color);
}

export function initTelegram(): void {
  safeCall(() => {
    if (!tg) return;
    document.body.classList.add('is-telegram');
    safeCall(() => tg.ready());
    safeCall(() => tg.expand());
    if (typeof tg.requestFullscreen === 'function') safeCall(() => tg.requestFullscreen!());
    if (typeof tg.disableVerticalSwipes === 'function') safeCall(() => tg.disableVerticalSwipes!());
  });
}

export function haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!tg?.HapticFeedback) return;
  safeCall(() => tg.HapticFeedback!.impactOccurred(style));
}

export function cloudSetItem(key: string, value: string): Promise<void> {
  return new Promise(resolve => {
    const cs = tg?.CloudStorage;
    if (!cs) return resolve();
    try { cs.setItem(key, value, () => resolve()); } catch { resolve(); }
  });
}

export function cloudGetItem(key: string): Promise<string | null> {
  return new Promise(resolve => {
    const cs = tg?.CloudStorage;
    if (!cs) return resolve(null);
    try {
      cs.getItem(key, (_err: Error | null, value?: string) => resolve(value ?? null));
    } catch { resolve(null); }
  });
}
