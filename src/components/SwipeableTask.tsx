import { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import { Task } from '../types';

const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
  }
};

interface SwipeableTaskProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  taskBg: string;
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

  return (
    <div className="relative overflow-hidden bg-black w-full">
      {/* Фоны под карточкой. Привязываем иконки к краям экрана */}
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
        whileTap={{ cursor: 'grabbing' }}
        style={{ backgroundColor: taskBg }}
        className="relative flex items-center justify-between px-6 py-4 border-b border-black/10 transition-colors duration-300 w-full"
      >
        {isEditing ? (
          <input
            autoFocus
            defaultValue={task.text}
            onBlur={(e) => {
              setIsEditing(false);
              onUpdate(task.id, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className={`bg-transparent outline-none w-full text-xl font-medium placeholder-white/50 ${
              task.done ? 'text-gray-400 line-through' : 'text-zinc-900'
            }`}
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className={`text-xl w-full truncate font-medium transition-all ${
              task.done ? 'line-through text-gray-400' : 'text-zinc-900'
            }`}
          >
            {task.text || <span className="opacity-50">Новая задача</span>}
          </div>
        )}

        {task.reminder && !task.done && (
          <div className="flex items-center gap-1 text-sm shrink-0 ml-4 text-zinc-700">
            <Bell size={16} />
            <span>in 12m</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
