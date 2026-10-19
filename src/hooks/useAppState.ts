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

export function useAppState() {
  // ВСЕГДА дефолт — не читаем из localStorage
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  // Но всё равно сохраняем (чтобы потом проверить, что в localStorage)
  useEffect(() => {
    try {
      localStorage.setItem('clear_app_state_v1', JSON.stringify(state));
    } catch (e) {
      console.warn('[State] Save error:', e);
    }
  }, [state]);

  const updateTasks = useCallback((updater: (tasks: Task[]) => Task[]) => {
    setState(prev => ({ ...prev, tasks: updater(prev.tasks) }));
  }, []);

  const setBaseColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, baseColor: color }));
  }, []);

  return {
    tasks: state.tasks,
    baseColor: state.baseColor,
    updateTasks,
    setBaseColor,
  };
}
