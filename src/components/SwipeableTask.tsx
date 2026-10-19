import { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Bell } from 'lucide-react';
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
}

export function SwipeableTask({ task, onToggle, onDelete, onUpdate }: SwipeableTaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const controls = useAnimation();

  const handleDragEnd = async (_event: any, info: PanInfo) => {
    const threshold = 80;
    
    if (info.offset.x > threshold) {
      // Свайп вправо -> выполнено
      haptic('medium');
      onToggle(task.id);
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    } else if (info.offset.x < -threshold) {
      // Свайп влево -> удалить
      haptic('heavy');
      await controls.start({ x: -400, opacity: 0, transition: { duration: 0.2 } });
      onDelete(task.id);
    } else {
      // Возврат на место
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    }
  };

  return (
    <div className="relative overflow-hidden bg-black">
      {/* Фоны под карточкой (появляются при свайпе) */}
      <div className="absolute inset-0 flex justify-between items-center px-6">
        <div className="text-green-500 font-bold text-lg">Готово</div>
        <div className="text-red-500 font-bold text-lg">Удалить</div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ cursor: 'grabbing' }}
        className={`relative flex items-center justify-between px-6 py-4 border-b border-black/10 transition-colors duration-300 ${
          task.done ? 'bg-zinc-800' : 'bg-orange-600'
        }`}
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
            className="bg-transparent outline-none w-full text-xl text-white font-medium placeholder-white/50"
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className={`text-xl text-white w-full truncate font-medium transition-all ${
              task.done ? 'line-through text-gray-400' : ''
            }`}
          >
            {task.text || <span className="text-white/50">Новая задача</span>}
          </div>
        )}

        {task.reminder && !task.done && (
          <div className="flex items-center gap-1 text-sm text-white/80 shrink-0 ml-4">
            <Bell size={16} />
            <span>in 12m</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
