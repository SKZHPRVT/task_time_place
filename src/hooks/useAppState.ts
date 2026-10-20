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
    { id: 'tut-1', text: '👉 Свайп вправо — выполнить', done: false },
    { id: 'tut-2', text: '👈 Свайп влево — удалить', done: false },
    { id: 'tut-3', text: '👆 Тап по тексту — изменить', done: false },
    { id: 'tut-4', text: '📁 Тап по шапке — создать папку', done: false },
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
      if (typeof parsed.updatedAt !== 'number') parsed.updatedAt = Date.now();
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

  // Синхронизация при старте
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    async function syncCloud() {
      const local = loadFromLocal();

      if (!isTelegram) {
        return;
      }

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

      // Сценарии:
      // 1. Есть локальные данные, нет облачных → пишем локальные в облако
      // 2. Есть облачные, нет локальных → применяем облачные
      // 3. Оба есть → побеждает более свежий по updatedAt
      // 4. Нет ни там, ни там → дефолт (уже стоит)

      if (local && !cloud) {
        console.log('[State] Local exists, cloud empty → pushing to cloud');
        const str = JSON.stringify(local);
        await cloudSetItem(CLOUD_KEY, str);
        return;
      }

      if (!local && cloud) {
        console.log('[State] Local empty, cloud exists → applying cloud');
        setState(cloud);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud)); } catch {}
        return;
      }

      if (local && cloud) {
        if (cloud.updatedAt > local.updatedAt) {
          console.log('[State] Cloud is newer → applying cloud');
          setState(cloud);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud)); } catch {}
        } else {
          console.log('[State] Local is newer or equal → pushing to cloud');
          const str = JSON.stringify(local);
          await cloudSetItem(CLOUD_KEY, str);
        }
      }
    }

    syncCloud();
    return () => { cancelled = true; };
  }, []);

  // Сохранение при каждом изменении folders/activeFolderId
  useEffect(() => {
    if (!initializedRef.current) return;

    // Обновляем updatedAt
    const now = Date.now();
    const newState: AppState = { ...state, updatedAt: now };

    const str = JSON.stringify(newState);
    try { localStorage.setItem(STORAGE_KEY, str); } catch {}
    if (isTelegram) cloudSetItem(CLOUD_KEY, str).catch(() => {});

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.folders, state.activeFolderId]);

  const activeFolder = state.folders.find(f => f.id === state.activeFolderId) || state.folders[0];

  const updateFolderTasks = useCallback((folderId: string, updater: (tasks: Task[]) => Task[]) => {
    setState(prev => ({
      ...prev,
      updatedAt: Date.now(),
      folders: prev.folders.map(f =>
        f.id === folderId ? { ...f, tasks: updater(f.tasks) } : f
      ),
    }));
  }, []);

  const setFolderColor = useCallback((folderId: string, key: 'baseColor' | 'bgColor', color: string) => {
    setState(prev => ({
      ...prev,
      updatedAt: Date.now(),
      folders: prev.folders.map(f =>
        f.id === folderId ? { ...f, [key]: color } : f
      ),
    }));
  }, []);

  const switchFolder = useCallback((folderId: string) => {
    setState(prev => ({ ...prev, updatedAt: Date.now(), activeFolderId: folderId }));
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
      updatedAt: Date.now(),
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
          updatedAt: Date.now(),
          folders: [defaultFolder],
          activeFolderId: defaultFolder.id,
        };
      }
      return {
        ...prev,
        updatedAt: Date.now(),
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
