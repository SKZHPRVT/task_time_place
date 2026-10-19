import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsed = JSON.parse(item);
      
      // Жесткая валидация для массива задач
      if (key === 'clear_tasks') {
        if (!Array.isArray(parsed)) return initialValue;
        const isValid = parsed.every((t: any) => 
          t && typeof t === 'object' && 
          typeof t.id === 'string' && 
          typeof t.text === 'string' && 
          typeof t.done === 'boolean'
        );
        if (!isValid) {
          console.warn('[useLocalStorage] Invalid tasks format, resetting');
          return initialValue;
        }
      }
      
      // Жесткая валидация для цвета (должна быть строка вида #xxxxxx)
      if (key === 'clear_base_color') {
        if (typeof parsed !== 'string' || !parsed.startsWith('#') || parsed.length < 4) {
          console.warn('[useLocalStorage] Invalid color format, resetting');
          return initialValue;
        }
      }
      
      return parsed;
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[useLocalStorage] Error setting key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
