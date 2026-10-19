export const tg = window.Telegram?.WebApp;
export const isTelegram = Boolean(tg);

function safeCall<T>(fn: () => T): T | undefined {
  try { return fn(); } catch (e) { console.warn('[TG] call failed:', e); return undefined; }
}

function applyViewportHeight(): void {
  const h = tg?.viewportStableHeight || tg?.viewportHeight || window.innerHeight;
  document.documentElement.style.setProperty('--tg-viewport-height', `${h}px`);
}

export function setHeaderColor(color: string): void {
  if (!tg) return;
  if (typeof tg.setHeaderColor === 'function') {
    safeCall(() => tg.setHeaderColor(color));
  }
  if (typeof tg.setBackgroundColor === 'function') {
    safeCall(() => tg.setBackgroundColor(color));
  }
  // Красим body и html в тот же цвет
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
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
  safeCall(() => tg.expand()); // <-- Только expand, без requestFullscreen

  if (typeof tg.disableVerticalSwipes === 'function') {
    safeCall(() => tg.disableVerticalSwipes!());
  }

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
