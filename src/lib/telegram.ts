// Обертка Telegram.WebApp с фокусом на fullscreen и синхронизацией viewport

export const tg = window.Telegram?.WebApp;
export const isTelegram = Boolean(tg);

function safeCall<T>(fn: () => T): T | undefined {
  try { return fn(); } catch (e) { console.warn('[TG] call failed:', e); return undefined; }
}

function applyViewportHeight(): void {
  const h = tg?.viewportStableHeight || tg?.viewportHeight || window.innerHeight;
  document.documentElement.style.setProperty('--tg-viewport-height', `${h}px`);
  document.documentElement.style.setProperty('--real-vh', `${h}px`);
}

export function initTelegram(): void {
  if (!tg) {
    document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
    window.addEventListener('resize', () => {
      document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
    });
    console.log('[TG] Running in browser mode');
    return;
  }

  document.body.classList.add('is-telegram');

  // 1. Сообщаем что приложение готово
  safeCall(() => tg.ready());

  // 2. Разворачиваем на весь WebView
  safeCall(() => tg.expand());

  // 3. Bot API 8.0+: полный экран без шапки Telegram
  if (typeof tg.requestFullscreen === 'function') {
    try {
      tg.requestFullscreen();
      console.log('[TG] requestFullscreen called');
    } catch (e) {
      console.log('[TG] requestFullscreen failed:', e);
    }
  }

  // 4. Отключаем закрытие TMA свайпом вниз
  safeCall(() => tg.disableVerticalSwipes?.());

  // 5. Цвета шапки Telegram — совпадаем с фоном приложения
  safeCall(() => tg.setHeaderColor('#000000'));
  safeCall(() => tg.setBackgroundColor('#000000'));

  // 6. Высота viewport
  applyViewportHeight();
  safeCall(() => tg.onEvent('viewportChanged', applyViewportHeight));

  window.addEventListener('resize', applyViewportHeight);
  window.addEventListener('orientationchange', () => setTimeout(applyViewportHeight, 300));
  setTimeout(applyViewportHeight, 200);
  setTimeout(applyViewportHeight, 1000);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', applyViewportHeight);
  }

  console.log('[TG] initialized', {
    version: tg.version,
    platform: tg.platform,
    viewportHeight: tg.viewportHeight,
    viewportStableHeight: tg.viewportStableHeight,
    isExpanded: tg.isExpanded,
    isFullscreen: tg.isFullscreen,
  });
}

export function haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!tg?.HapticFeedback) return;
  safeCall(() => tg.HapticFeedback!.impactOccurred(style));
}
