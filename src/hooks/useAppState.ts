import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';

export interface AppState {
  tasks: Task[];
  baseColor: string;
}

const DEFAULT_STATE: AppState = {
  tasks: [
    { id: 'tut-1', text: '👉 Свайпни вправо, чтобы выполнить', done: false },
    { id: 'tut-2', text: '👈 Свайпни влево, чтобы удалить', done: false },
    { id: 'tut-3', text: '👆 Нажми на текст, чтобы изменить', done: false },
    { id: 'tut-4', text: 'Это выполнено (свайп вправо)', done: true },
  ],
  baseColor: '#71717a',
};

const STORAGE_KEY = 'clear_app_state_v1';
const BACKUP_KEY = 'clear_app_state_v1_backup';

// Валидация структуры
function isValidState(state: any): state is AppState {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.baseColor !== 'string' || !state.baseColor.startsWith('#')) return false;
  if (!Array.isArray(state.tasks)) return false;
  return state.tasks.every(
    (t: any) =>
      t &&
      typeof t === 'object' &&
      typeof t.id === 'string' &&
      typeof t.text === 'string' &&
      typeof t.done === 'boolean'
  );
}

function loadState(): AppState {
  // Пробуем основной ключ
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidState(parsed)) return parsed;
      console.warn('[State] Main state invalid, trying backup');
    }
  } catch (e) {
    console.warn('[State] Main state parse error:', e);
  }

  // Пробуем бэкап
  try {
    const rawBackup = localStorage.getItem(BACKUP_KEY);
    if (rawBackup) {
      const parsed = JSON.parse(rawBackup);
      if (isValidState(parsed)) {
        console.log('[State] Restored from backup');
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[State] Backup parse error:', e);
  }

  // Всё битое — сбрасываем
  console.warn('[State] All state invalid, resetting to default');
  return DEFAULT_STATE;
}

function saveState(state: AppState): void {
  try {
    // Сначала пишем бэкап
    localStorage.setItem(BACKUP_KEY, JSON.stringify(state));
    // Потом основной
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[State] Save error:', e);
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  // Сохраняем при каждом изменении state
  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateTasks = useCallback((updater: (tasks: Task[]) => Task[]) => {
    setState(prev => {
      try {
        const newTasks = updater(prev.tasks);
        // Дополнительная валидация
        if (!Array.isArray(newTasks)) return prev;
        const isValid = newTasks.every(
          t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean'
        );
        if (!isValid) {
          console.warn('[State] Invalid task update rejected');
          return prev;
        }
        return { ...prev, tasks: newTasks };
      } catch (e) {
        console.error('[State] Update error:', e);
        return prev;
      }
    });
  }, []);

  const setBaseColor = useCallback((color: string) => {
    setState(prev => {
      // Валидация цвета
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
