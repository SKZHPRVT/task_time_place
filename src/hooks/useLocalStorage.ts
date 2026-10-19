import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsed = JSON.parse(item);
      
      // Валидация для массива задач
      if (Array.isArray(parsed)) {
        const isValid = parsed.every((t: any) => 
          t && typeof t === 'object' && typeof t.id === 'string' && typeof t.text === 'string'
        );
        if (!isValid) {
          console.warn('Invalid tasks in localStorage, resetting to default');
          return initialValue;
        }
      }
      
      return parsed;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
