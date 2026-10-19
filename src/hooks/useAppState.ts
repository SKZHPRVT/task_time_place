import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';

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

function isValidState(state: any): state is AppState {
  try {
    if (!state || typeof state !== 'object') return false;
    if (state.version !== 2) return false;
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
  } catch (e) {
    return false;
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.log('[State] No saved state, using default');
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    if (isValidState(parsed)) {
      console.log('[State] Loaded from localStorage:', parsed);
      return parsed;
    }
    console.warn('[State] Invalid state, using default:', parsed);
    return DEFAULT_STATE;
  } catch (e) {
    console.warn('[State] Load error, using default:', e);
    return DEFAULT_STATE;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[State] Save error:', e);
    }
  }, [state]);

  const updateTasks = useCallback((updater: (tasks: Task[]) => Task[]) => {
    setState(prev => {
      try {
        const newTasks = updater(prev.tasks);
        if (!Array.isArray(newTasks)) {
          console.warn('[State] Invalid tasks update rejected');
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
