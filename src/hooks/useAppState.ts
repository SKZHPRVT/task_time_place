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

function loadFromLocal(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (isValidState(parsed)) {
      // Если old state без updatedAt — ставим текущее время
      if (typeof parsed.updatedAt !== 'number') {
        parsed.updatedAt = Date.now();
      }
      return parsed;
    }
    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadFromLocal());
  const lastSyncedRef = useRef<string>(JSON.stringify(state));
  const isInitializingRef = useRef(true);

  // Фоновая синхронизация с CloudStorage (только при старте)
  useEffect(() => {
    let cancelled = false;
    async function syncCloud() {
      if (!isTelegram) {
        isInitializingRef.current = false;
        return;
      }
      const cloudRaw = await cloudGetItem(CLOUD_KEY);
      if (cancelled) return;

      if (cloudRaw) {
        try {
          const parsed = JSON.parse(cloudRaw);
          if (isValidState(parsed)) {
            if (typeof parsed.updatedAt !== 'number') parsed.updatedAt = 0;
            const localUpdatedAt = state.updatedAt;

            // 🆕 Побеждает тот, у кого updatedAt свежее
            if (parsed.updatedAt > localUpdatedAt) {
              console.log('[State] Cloud is newer, applying');
              setState(parsed);
              lastSyncedRef.current = JSON.stringify(parsed);
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch {}
            } else {
              console.log('[State] Local is newer or equal, keeping local');
            }
          }
        } catch {}
      }
      isInitializingRef.current = false;
    }
    syncCloud();
    return () => { cancelled = true; };
  }, []);

  // Сохранение при каждом изменении
  useEffect(() => {
    if (isInitializingRef.current) return;
    const newState = { ...state, updatedAt: Date.now() };
    // Обновляем стейт, чтобы updatedAt применился (только если это не вызывает цикл)
    if (state.updatedAt !== newState.updatedAt) {
      // Не обновляем здесь стейт, чтобы не было бесконечного цикла,
      // а просто сохраняем новую версию
    }
    const str = JSON.stringify(newState);
    if (str === lastSyncedRef.current) return;
    lastSyncedRef.current = str;
    try { localStorage.setItem(STORAGE_KEY, str); } catch {}
    if (isTelegram) cloudSetItem(CLOUD_KEY, str).catch(() => {});
    // Сохраняем updatedAt в стейт — но только если реально изменились данные
    setState(prev => ({ ...prev, updatedAt: newState.updatedAt }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.folders, state.activeFolderId]);

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
