import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '../types';
import { cloudGetItem, cloudSetItem, isTelegram } from '../lib/telegram';

export interface AppState {
  version: 2;
  tasks: Task[];
  baseColor: string;
}

const DEFAULT_STATE: AppState = {
  version: 2,
  tasks: [
    { id: 'tut-1', text: '👉 Свайпни вправо, чтобы выполнить', done: false },
    { id: 'tut-2', text: '👈 Свайпни влево, чтобы удалить', done: false },
    { id: 'tut-3', text: '👆 Нажми на текст, чтобы изменить', done: false },
    { id: 'tut-4', text: 'Это выполнено (свайп вправо)', done: true },
  ],
  baseColor: '#71717a',
};

const STORAGE_KEY = 'clear_app_state_v2';
const CLOUD_KEY = 'clear_app_state_v2';

function isValidState(state: any): state is AppState {
  try {
    if (!state || typeof state !== 'object') return false;
    if (state.version !== 2) return false;
    if (typeof state.baseColor !== 'string' || !state.baseColor.startsWith('#')) return false;
    if (!Array.isArray(state.tasks)) return false;
    return state.tasks.every(
      (t: any) => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean'
    );
  } catch {
    return false;
  }
}

function loadFromLocal(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const lastSyncedRef = useRef<string>('');

  // Загрузка: сначала localStorage (мгновенно), потом CloudStorage (если Telegram)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const local = loadFromLocal();
      if (local && !cancelled) {
        setState(local);
        lastSyncedRef.current = JSON.stringify(local);
      }

      if (isTelegram) {
        const cloudRaw = await cloudGetItem(CLOUD_KEY);
        if (!cancelled && cloudRaw) {
          try {
            const parsed = JSON.parse(cloudRaw);
            if (isValidState(parsed)) {
              const cloudStr = JSON.stringify(parsed);
              if (cloudStr !== lastSyncedRef.current) {
                console.log('[State] Loaded from CloudStorage (newer or differs from local)');
                setState(parsed);
                lastSyncedRef.current = cloudStr;
                // Обновляем localStorage тоже
                try { localStorage.setItem(STORAGE_KEY, cloudStr); } catch {}
              }
            }
          } catch (e) {
            console.warn('[State] Cloud parse error:', e);
          }
        }
      }

      if (!cancelled) setReady(true);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Сохранение: в localStorage + CloudStorage при каждом изменении
  useEffect(() => {
    if (!ready) return;
    const str = JSON.stringify(state);
    if (str === lastSyncedRef.current) return;
    lastSyncedRef.current = str;

    try { localStorage.setItem(STORAGE_KEY, str); } catch (e) { console.warn('[State] Local save error:', e); }
    if (isTelegram) {
      cloudSetItem(CLOUD_KEY, str).catch(() => {});
    }
  }, [state, ready]);

  const updateTasks = useCallback((updater: (tasks: Task[]) => Task[]) => {
    setState(prev => {
      try {
        const newTasks = updater(prev.tasks);
        if (!Array.isArray(newTasks)) return prev;
        return { ...prev, tasks: newTasks };
      } catch (e) {
        console.error('[State] Update error:', e);
        return prev;
      }
    });
  }, []);

  const setBaseColor = useCallback((color: string) => {
    setState(prev => {
      if (typeof color !== 'string' || !color.startsWith('#')) return prev;
      return { ...prev, baseColor: color };
    });
  }, []);

  return {
    tasks: state.tasks,
    baseColor: state.baseColor,
    updateTasks,
    setBaseColor,
  };
}
