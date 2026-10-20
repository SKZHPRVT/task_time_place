import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useDragControls, PanInfo, Reorder } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import { Task } from '../types';
import { haptic } from '../lib/telegram';

interface SwipeableTaskProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onOpenReminder?: (id: string) => void;
  taskBg?: string;
  textColor?: string;
}

export function SwipeableTask({
  task,
  onToggle,
  onDelete,
  onUpdate,
  onOpenReminder,
  taskBg,
  textColor = 'text-white',
}: SwipeableTaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const controls = useAnimation();
  const dragControls = useDragControls();
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDragEnd = async (_event: any, info: PanInfo) => {
    const threshold = 80;

    if (info.offset.x > threshold) {
      haptic('medium');
      onToggle(task.id);
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    } else if (info.offset.x < -threshold) {
      haptic('heavy');
      onDelete(task.id);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    }
  };

  // 🆕 Long press → запуск drag для reorder
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    // Не активируем long press при тапе на кнопку напоминания
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    longPressTimer.current = setTimeout(() => {
      haptic('medium');
      dragControls.start(e);
    }, 300);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const bgColor = taskBg || '#a1a1aa';
  const hasReminder = Boolean(task.reminder);

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      style={{ backgroundColor: bgColor }}
      className="relative flex items-start px-3 py-4 border-b border-black/10 w-full overflow-hidden"
    >
      {/* Фоны при свайпе */}
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
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex items-start w-full z-10"
      >
        <div className="flex-1 min-w-0 mr-3">
          {isEditing ? (
            <input
              ref={inputRef}
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
            <div className={`text-xs mt-1 ${textColor} opacity-70`}>
              {formatReminder(task.reminder)}
            </div>
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
            className={`${textColor} ${hasReminder && !task.done ? 'opacity-100' : 'opacity-40'}`}
            fill={hasReminder && !task.done ? 'currentColor' : 'none'}
          />
        </button>
      </motion.div>
    </Reorder.Item>
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
