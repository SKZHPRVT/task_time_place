export const tg = window.Telegram?.WebApp;
export const isTelegram = Boolean(tg);

function safeCall<T>(fn: () => T): T | undefined {
  try { return fn(); } catch (e) { console.warn('[TG] call failed:', e); return undefined; }
}

function applyViewportHeight(): void {
  safeCall(() => {
    const h = tg?.viewportStableHeight || tg?.viewportHeight || window.innerHeight;
    document.documentElement.style.setProperty('--tg-viewport-height', `${h}px`);
  });
}

export function setHeaderColor(color: string): void {
  if (!tg) return;
  safeCall(() => {
    if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor(color);
  });
  safeCall(() => {
    if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor(color);
  });
  safeCall(() => {
    document.documentElement.style.setProperty('--app-bg', color);
    document.body.style.backgroundColor = color;
  });
}

export function initTelegram(): void {
  // Все вызовы через safeCall, чтобы никакая ошибка не уронила приложение
  safeCall(() => {
    if (!tg) return;

    document.body.classList.add('is-telegram');

    safeCall(() => tg.ready());
    safeCall(() => tg.expand());

    if (typeof tg.requestFullscreen === 'function') {
      safeCall(() => tg.requestFullscreen!());
    }
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
  });

  // Если Telegram вообще нет — просто ставим высоту окна
  if (!tg) {
    safeCall(() => {
      document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
      window.addEventListener('resize', () => {
        document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
      });
    });
  }
}

export function haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!tg?.HapticFeedback) return;
  safeCall(() => tg.HapticFeedback!.impactOccurred(style));
}
