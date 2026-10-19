import { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import { Task } from '../types';
import { haptic } from '../lib/telegram';
import { isLightColor } from '../utils/color';

interface SwipeableTaskProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onOpenReminder?: (id: string) => void;
  taskBg?: string;
}

export function SwipeableTask({ task, onToggle, onDelete, onUpdate, onOpenReminder, taskBg }: SwipeableTaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const controls = useAnimation();

  const handleDragEnd = async (_event: any, info: PanInfo) => {
    const threshold = 80;

    if (info.offset.x > threshold) {
      haptic('medium');
      onToggle(task.id);
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    } else if (info.offset.x < -threshold) {
      haptic('heavy');
      await controls.start({ x: -400, opacity: 0, transition: { duration: 0.2 } });
      onDelete(task.id);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    }
  };

  const bgColor = taskBg || (task.done ? '#3f3f46' : '#a1a1aa');
  const hasReminder = Boolean(task.reminder);
  const light = isLightColor(bgColor);
  const textColor = light ? 'text-zinc-900' : 'text-white';
  const iconColor = light ? 'text-zinc-700' : 'text-white/40';
  const iconActiveColor = light ? 'text-zinc-900' : 'text-white';
  const timeColor = light ? 'text-zinc-600' : 'text-white/70';

  return (
    <div className="relative overflow-hidden w-full" style={{ backgroundColor: '#000' }}>
      <div className="absolute inset-0 flex justify-between items-center">
        <div className="pl-2 h-full flex items-center">
          <Check size={28} className="text-green-500" strokeWidth={3} />
        </div>
        <div className="pr-2 h-full flex items-center">
          <X size={28} className="text-red-500" strokeWidth={3} />
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ backgroundColor: bgColor }}
        className="relative flex items-start px-3 py-4 border-b border-black/10 w-full"
      >
        <div className="flex-1 min-w-0 mr-3">
          {isEditing ? (
            <input
              autoFocus
              defaultValue={task.text}
              onBlur={e => {
                setIsEditing(false);
                onUpdate(task.id, e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              className={`bg-transparent outline-none w-full text-xl font-medium ${textColor} ${
                task.done ? 'line-through opacity-60' : ''
              }`}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={`text-xl font-medium break-words whitespace-pre-wrap ${textColor} ${
                task.done ? 'line-through opacity-60' : ''
              }`}
            >
              {task.text || <span className="opacity-50">Новая задача</span>}
            </div>
          )}

          {task.reminder && !task.done && (
            <div className={`text-xs mt-1 ${timeColor}`}>{formatReminder(task.reminder)}</div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic('light');
            onOpenReminder?.(task.id);
          }}
          className="shrink-0 mt-1 p-1"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Напоминание"
        >
          <Bell
            size={20}
            className={hasReminder && !task.done ? iconActiveColor : iconColor}
            fill={hasReminder && !task.done ? 'currentColor' : 'none'}
          />
        </button>
      </motion.div>
    </div>
  );
}

function formatReminder(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.round((d.getTime() - now.getTime()) / 60000);
    if (diff < 0) return 'просрочено';
    if (diff < 60) return `через ${diff}м`;
    if (diff < 1440) return `через ${Math.round(diff / 60)}ч`;
    return (
      d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) +
      ' ' +
      d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return '';
  }
}
