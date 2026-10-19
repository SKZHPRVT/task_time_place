import { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import { Task } from '../types';
import { haptic } from '../lib/telegram';

interface SwipeableTaskProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  taskBg?: string;
}

export function SwipeableTask({ task, onToggle, onDelete, onUpdate, taskBg }: SwipeableTaskProps) {
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
  
  // Активные — белый шрифт. Неактивные — темно-серый.
  const textColor = task.done ? 'text-zinc-500' : 'text-white';

  return (
    <div className="relative overflow-hidden bg-black w-full">
      <div className="absolute inset-0 flex justify-between items-center">
        <div className="pl-6 h-full flex items-center">
          <Check size={28} className="text-green-500" strokeWidth={3} />
        </div>
        <div className="pr-6 h-full flex items-center">
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
        className="relative flex items-center justify-between px-6 py-4 border-b border-black/10 w-full"
      >
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
              task.done ? 'line-through' : ''
            }`}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`text-xl w-full truncate font-medium ${textColor} ${
              task.done ? 'line-through' : ''
            }`}
          >
            {task.text || <span className="opacity-50">Новая задача</span>}
          </div>
        )}

        {task.reminder && !task.done && (
          <div className={`flex items-center gap-1 text-sm shrink-0 ml-4 ${textColor}`}>
            <Bell size={16} />
            <span>in 12m</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
