import { useState, useEffect, useMemo } from 'react';
import { SwipeableTask } from './components/SwipeableTask';
import { Task } from './types';
import { useAppState } from './hooks/useAppState';
import { Palette } from 'lucide-react';
import { COLOR_PALETTE, darkenColor, lightenColor } from './utils/color';
import { motion, AnimatePresence } from 'framer-motion';
import { setHeaderColor } from './lib/telegram';

export default function App() {
  const { tasks, baseColor, updateTasks, setBaseColor } = useAppState();
  const [showPalette, setShowPalette] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const headerBg = darkenColor(baseColor, 5);
  const taskBg = lightenColor(baseColor, 5);

  useEffect(() => {
    setHeaderColor(headerBg);
  }, [headerBg]);

  const toggleTask = (id: string) => {
    updateTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    updateTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (id: string, text: string) => {
    updateTasks(prev => prev.map(t => (t.id === id ? { ...t, text } : t)));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      done: false,
    };

    updateTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.done === b.done) return 0;
      return a.done ? 1 : -1;
    });
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: headerBg }}>
      <div
        className="pb-4 px-6 transition-colors duration-300 flex justify-between items-end shrink-0"
        style={{ backgroundColor: headerBg }}
      >
        <h1 className="text-5xl font-bold text-white tracking-tight">Задачи</h1>
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="mb-1 p-2 rounded-full active:bg-white/20 transition-colors"
        >
          <Palette size={24} className="text-white/80" />
        </button>
      </div>

      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-900 border-b border-zinc-800 shrink-0"
          >
            <div className="flex gap-3 px-6 py-4 overflow-x-auto">
              {COLOR_PALETTE.map((c: { name: string; hex: string }) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setBaseColor(c.hex);
                    setShowPalette(false);
                  }}
                  className={`w-10 h-10 rounded-full shrink-0 transition-transform active:scale-90 ${
                    baseColor === c.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pb-24 bg-black">
        {sortedTasks.map(task => (
          <SwipeableTask
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onUpdate={updateTask}
            taskBg={task.done ? headerBg : taskBg}
          />
        ))}

        <form onSubmit={addTask} className="px-6 py-4 border-b border-zinc-900">
          <input
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            placeholder="+ Новая задача"
            className="w-full bg-transparent text-zinc-400 text-xl outline-none placeholder-zinc-600"
          />
        </form>
      </div>
    </div>
  );
}
