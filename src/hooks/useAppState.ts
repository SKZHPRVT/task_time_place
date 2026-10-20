import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, Task } from '../types';
import { cloudGetItem, cloudSetItem, isTelegram } from '../lib/telegram';

export interface AppState {
  version: 4;
  folders: Folder[];
  activeFolderId: string;
}

const DEFAULT_FOLDER: Folder = {
  id: 'default',
  name: 'Задачи',
  baseColor: '#71717a',
  bgColor: '#000000',
  tasks: [
    { id: 'tut-1', text: '👉 Свайпни вправо, чтобы выполнить', done: false },
    { id: 'tut-2', text: '👈 Свайпни влево, чтобы удалить', done: false },
    { id: 'tut-3', text: '👆 Нажми на текст, чтобы изменить', done: false },
    { id: 'tut-4', text: '📁 Тап по названию в шапке — создать папку', done: false },
    { id: 'tut-5', text: 'Это выполнено (свайп вправо)', done: true },
  ],
};

const DEFAULT_STATE: AppState = {
  version: 4,
  folders: [DEFAULT_FOLDER],
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
    return isValidState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const lastSyncedRef = useRef<string>('');

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
                setState(parsed);
                lastSyncedRef.current = cloudStr;
                try { localStorage.setItem(STORAGE_KEY, cloudStr); } catch {}
              }
            }
          } catch {}
        }
      }
      if (!cancelled) setReady(true);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const str = JSON.stringify(state);
    if (str === lastSyncedRef.current) return;
    lastSyncedRef.current = str;
    try { localStorage.setItem(STORAGE_KEY, str); } catch {}
    if (isTelegram) cloudSetItem(CLOUD_KEY, str).catch(() => {});
  }, [state, ready]);

  const activeFolder = state.folders.find(f => f.id === state.activeFolderId) || state.folders[0];

  const updateFolderTasks = useCallback((folderId: string, updater: (tasks: Task[]) => Task[]) => {
    setState(prev => ({
      ...prev,
      folders: prev.folders.map(f =>
        f.id === folderId ? { ...f, tasks: updater(f.tasks) } : f
      ),
    }));
  }, []);

  const setFolderColor = useCallback((folderId: string, key: 'baseColor' | 'bgColor', color: string) => {
    setState(prev => ({
      ...prev,
      folders: prev.folders.map(f =>
        f.id === folderId ? { ...f, [key]: color } : f
      ),
    }));
  }, []);

  const switchFolder = useCallback((folderId: string) => {
    setState(prev => ({ ...prev, activeFolderId: folderId }));
  }, []);

  const createFolder = useCallback((name: string) => {
    const id = Date.now().toString();
    const newFolder: Folder = {
      id,
      name,
      baseColor: '#71717a',
      bgColor: '#000000',
      tasks: [],
    };
    setState(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder],
      activeFolderId: id,
    }));
    return id;
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setState(prev => {
      const newFolders = prev.folders.filter(f => f.id !== folderId);
      if (newFolders.length === 0) {
        return { ...prev, folders: [DEFAULT_FOLDER], activeFolderId: 'default' };
      }
      return {
        ...prev,
        folders: newFolders,
        activeFolderId: prev.activeFolderId === folderId ? newFolders[0].id : prev.activeFolderId,
      };
    });
  }, []);

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
