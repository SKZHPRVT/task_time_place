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

function isValidState(state: any): state is AppState {
  try {
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
  } catch (e) {
    return false;
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (isValidState(parsed)) return parsed;
    console.warn('[State] Invalid state, resetting');
    return DEFAULT_STATE;
  } catch (e) {
    console.warn('[State] Load error:', e);
    return DEFAULT_STATE;
  }
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[State] Save error:', e);
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

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
