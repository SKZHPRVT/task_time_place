import { useState, useCallback } from 'react';
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
  // ВРЕМЕННО: только in-memory state, без localStorage
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  const updateTasks = useCallback((updater: (tasks: Task[]) => Task[]) => {
    setState(prev => {
      const newTasks = updater(prev.tasks);
      return { ...prev, tasks: newTasks };
    });
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
