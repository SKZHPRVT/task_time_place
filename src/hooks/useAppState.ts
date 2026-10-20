import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, Task } from '../types';
import { cloudGetItem, cloudSetItem, isTelegram } from '../lib/telegram';

export interface AppState {
  version: 4;
  updatedAt: number;
  folders: Folder[];
  activeFolderId: string;
}

const makeDefaultFolder = (): Folder => ({
  id: 'default',
  name: 'Задачи',
  baseColor: '#71717a',
  bgColor: '#000000',
  tasks: [
    { id: 'tut-1', text: '👉 Свайп вправо — выполнить задачу', done: false },
    { id: 'tut-2', text: '👉 Свайп вправо (по готовой) — вернуть', done: false },
    { id: 'tut-3', text: '👈 Свайп влево — удалить задачу', done: false },
    { id: 'tut-4', text: '👆 Тап по полю внизу — создать задачу', done: false },
    { id: 'tut-5', text: '📁 Тап по шапке — создать / удалить папку', done: false },
    { id: 'tut-6', text: '🎨 — цвет задач и фона', done: false },
    { id: 'tut-7', text: '📲 В меню «...» — добавить на рабочий стол', done: false },
  ],
});

const DEFAULT_STATE: AppState = {
  version: 4,
  updatedAt: Date.now(),
  folders: [makeDefaultFolder()],
  activeFolderId: 'default',
};

const STORAGE_KEY = 'clear_app_state_v4';
const CLOUD_KEY = 'clear_app_state_v4';

function isValidState(state: any): state is AppState {
  try {
    if (!state || typeof state !== 'object') return false;
    if (state.version !== 4) return false;
    if (!Array.isArray(state.folders)) return false;
    if (typeof state.activeFolderId !== 'string') return false;
    return state.folders.every(
      (f: any) =>
        f &&
        typeof f.id === 'string' &&
        typeof f.name === 'string' &&
        typeof f.baseColor === 'string' &&
        typeof f.bgColor === 'string' &&
        Array.isArray(f.tasks) &&
        f.tasks.every(
          (t: any) => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean'
        )
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
    if (isValidState(parsed)) {
      if (typeof parsed.updatedAt !== 'number') parsed.updatedAt = 0;
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadFromLocal() ?? DEFAULT_STATE);
  const initializedRef = useRef(false);

  // Синхронная запись в localStorage + CloudStorage
  const persist = useCallback((newState: AppState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('[State] Local save failed:', e);
    }
    if (isTelegram) {
      cloudSetItem(CLOUD_KEY, JSON.stringify(newState)).catch(() => {});
    }
  }, []);

  // Обёртка: сразу обновляет updatedAt и сохраняет
  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      const withTimestamp = { ...next, updatedAt: Date.now() };
      persist(withTimestamp);
      return withTimestamp;
    });
  }, [persist]);

  // Синхронизация при старте (один раз)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    async function syncCloud() {
      if (!isTelegram) return;

      const local = loadFromLocal();
      const cloudRaw = await cloudGetItem(CLOUD_KEY);
      if (cancelled) return;

      let cloud: AppState | null = null;
      if (cloudRaw) {
        try {
          const parsed = JSON.parse(cloudRaw);
          if (isValidState(parsed)) {
            if (typeof parsed.updatedAt !== 'number') parsed.updatedAt = 0;
            cloud = parsed;
          }
        } catch {}
      }

      if (local && !cloud) {
        persist(local);
        return;
      }

      if (!local && cloud) {
        setState(cloud);
        persist(cloud);
        return;
      }

      if (local && cloud) {
        if (cloud.updatedAt > local.updatedAt) {
          setState(cloud);
          persist(cloud);
        } else if (local.updatedAt > cloud.updatedAt) {
          persist(local);
        }
      }
    }

    syncCloud();
    return () => { cancelled = true; };
  }, [persist]);

  const activeFolder = state.folders.find(f => f.id === state.activeFolderId) || state.folders[0];

  const updateFolderTasks = useCallback((folderId: string, updater: (tasks: Task[]) => Task[]) => {
    updateState(prev => ({
      ...prev,
      folders: prev.folders.map(f =>
        f.id === folderId ? { ...f, tasks: updater(f.tasks) } : f
      ),
    }));
  }, [updateState]);

  const setFolderColor = useCallback((folderId: string, key: 'baseColor' | 'bgColor', color: string) => {
    updateState(prev => ({
      ...prev,
      folders: prev.folders.map(f =>
        f.id === folderId ? { ...f, [key]: color } : f
      ),
    }));
  }, [updateState]);

  const switchFolder = useCallback((folderId: string) => {
    updateState(prev => ({ ...prev, activeFolderId: folderId }));
  }, [updateState]);

  const createFolder = useCallback((name: string) => {
    const id = Date.now().toString();
    const newFolder: Folder = {
      id,
      name,
      baseColor: '#71717a',
      bgColor: '#000000',
      tasks: [],
    };
    updateState(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder],
      activeFolderId: id,
    }));
    return id;
  }, [updateState]);

  const deleteFolder = useCallback((folderId: string) => {
    updateState(prev => {
      const newFolders = prev.folders.filter(f => f.id !== folderId);
      if (newFolders.length === 0) {
        const defaultFolder = makeDefaultFolder();
        return {
          ...prev,
          folders: [defaultFolder],
          activeFolderId: defaultFolder.id,
        };
      }
      return {
        ...prev,
        folders: newFolders,
        activeFolderId: prev.activeFolderId === folderId ? newFolders[0].id : prev.activeFolderId,
      };
    });
  }, [updateState]);

  return {
    folders: state.folders,
    activeFolder,
    updateFolderTasks,
    setFolderColor,
    switchFolder,
    createFolder,
    deleteFolder,
  };
}
