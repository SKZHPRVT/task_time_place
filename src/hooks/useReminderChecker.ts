import { useEffect, useRef } from 'react';
import { Task } from '../types';
import { tg, haptic } from '../lib/telegram';

export function useReminderChecker(tasks: Task[], onReminderTriggered: (id: string) => void) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      const now = new Date();

      tasks.forEach(task => {
        if (task.done || !task.reminder) return;

        const fireKey = `${task.id}_${task.reminder}`;
        if (firedRef.current.has(fireKey)) return;

        const reminderTime = new Date(task.reminder);
        const diff = now.getTime() - reminderTime.getTime();

        if (diff >= 0 && diff < 60000) {
          firedRef.current.add(fireKey);

          haptic('heavy');
          if (tg?.HapticFeedback?.notificationOccurred) {
            try { tg.HapticFeedback.notificationOccurred('warning'); } catch {}
          }

          const message = `🔔 Напоминание!\n\n${task.text}`;
          if (tg?.showAlert) {
            try { tg.showAlert(message); } catch { alert(message); }
          } else {
            alert(message);
          }

          onReminderTriggered(task.id);
        }
      });
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [tasks, onReminderTriggered]);
}
