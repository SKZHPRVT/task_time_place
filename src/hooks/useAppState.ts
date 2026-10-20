import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, Task } from '../types';
import { cloudGetItem, cloudSetItem, isTelegram } from '../lib/telegram';

export interface AppState {
  version: 4;
  folders: Folder[];
  activeFolderId: string;
}

const makeDefaultFolder = (): Folder => ({
  id: 'default',
  name: 'Задачи',
  baseColor: '#71717a',
  bgColor: '#000000',
  tasks: [
    { id: 'tut-1', text: '👉 Свайп вправо — выполнить', done: false },
    { id: 'tut-2', text: '👈 Свайп влево — удалить', done: false },
    { id: 'tut-3', text: '👆 Тап по тексту — изменить', done: false },
    { id: 'tut-4', text: '📁 Тап по шапке — создать папку', done: false },
  ],
});

const DEFAULT_STATE: AppState = {
  version: 4,
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

// Синхронная загрузка — мгновенно
function loadFromLocal(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return isValidState(parsed) ? parsed : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function useAppState() {
  // 🆕 Инициализация сразу из localStorage (синхронно). Никаких миганий.
  const [state, setState] = useState<AppState>(() => loadFromLocal());
  const lastSyncedRef = useRef<string>(JSON.stringify(state));

  // Фоновая синхронизация с CloudStorage (не блокирует рендер)
  useEffect(() => {
    let cancelled = false;
    async function syncCloud() {
      if (!isTelegram) return;
      const cloudRaw = await cloudGetItem(CLOUD_KEY);
      if (cancelled || !cloudRaw) return;

      try {
        const parsed = JSON.parse(cloudRaw);
        if (isValidState(parsed)) {
          const cloudStr = JSON.stringify(parsed);
          // Обновляем только если в облаке данные реально другие (например, новее)
          if (cloudStr !== lastSyncedRef.current) {
            setState(parsed);
            lastSyncedRef.current = cloudStr;
            try { localStorage.setItem(STORAGE_KEY, cloudStr); } catch {}
          }
        }
      } catch {}
    }
    syncCloud();
    return () => { cancelled = true; };
  }, []);

  // Сохранение при каждом изменении
  useEffect(() => {
    const str = JSON.stringify(state);
    if (str === lastSyncedRef.current) return;
    lastSyncedRef.current = str;
    try { localStorage.setItem(STORAGE_KEY, str); } catch {}
    if (isTelegram) cloudSetItem(CLOUD_KEY, str).catch(() => {});
  }, [state]);

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
