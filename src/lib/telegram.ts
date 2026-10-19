export const tg = window.Telegram?.WebApp;
export const isTelegram = Boolean(tg);

function safeCall<T>(fn: () => T): T | undefined {
  try { return fn(); } catch (e) { console.warn('[TG] call failed:', e); return undefined; }
}

function applyViewportHeight(): void {
  const h = tg?.viewportStableHeight || tg?.viewportHeight || window.innerHeight;
  document.documentElement.style.setProperty('--tg-viewport-height', `${h}px`);
}

export function initTelegram(): void {
  if (!tg) {
    document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
    window.addEventListener('resize', () => {
      document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
    });
    return;
  }

  document.body.classList.add('is-telegram');

  safeCall(() => tg.ready());
  safeCall(() => tg.expand());

  // requestFullscreen — опциональный метод, проверяем наличие перед вызовом
  if (typeof tg.requestFullscreen === 'function') {
    safeCall(() => tg.requestFullscreen!());
  }

  // disableVerticalSwipes — опциональный метод
  if (typeof tg.disableVerticalSwipes === 'function') {
    safeCall(() => tg.disableVerticalSwipes!());
  }

  safeCall(() => tg.setHeaderColor('#000000'));
  safeCall(() => tg.setBackgroundColor('#000000'));

  applyViewportHeight();

  safeCall(() => tg.onEvent('viewportChanged', applyViewportHeight));
  safeCall(() => tg.onEvent('safeAreaChanged', applyViewportHeight));
  safeCall(() => tg.onEvent('contentSafeAreaChanged', applyViewportHeight));

  window.addEventListener('resize', applyViewportHeight);
  window.addEventListener('orientationchange', () => setTimeout(applyViewportHeight, 300));
  setTimeout(applyViewportHeight, 200);
  setTimeout(applyViewportHeight, 1000);
}

export function haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!tg?.HapticFeedback) return;
  safeCall(() => tg.HapticFeedback!.impactOccurred(style));
}
