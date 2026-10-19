import { useState } from 'react';
import { SwipeableTask } from './components/SwipeableTask';
import { Task } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Info, Palette } from 'lucide-react';
import { COLOR_PALETTE, darkenColor, lightenColor } from './utils/color';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useLocalStorage('clear_first_launch', true);
  const [baseColor, setBaseColor] = useLocalStorage('clear_base_color', '#71717a');
  const [showPalette, setShowPalette] = useState(false);
  
  const [tasks, setTasks] = useLocalStorage<Task[]>('clear_tasks', [
    { id: 'tut-1', text: '👉 Свайпни вправо, чтобы выполнить', done: false },
    { id: 'tut-2', text: '👈 Свайпни влево, чтобы удалить', done: false },
    { id: 'tut-3', text: '👆 Нажми на текст, чтобы изменить', done: false },
    { id: 'tut-4', text: 'Это выполнено (свайп вправо)', done: true },
  ]);

  const [newTaskText, setNewTaskText] = useState('');

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = (id: string, text: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, text } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      done: false,
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskText('');
  };

  const clearTutorial = () => {
    setTasks(tasks.filter(t => !t.id.startsWith('tut-')));
    setIsFirstLaunch(false);
  };

  const headerBg = darkenColor(baseColor, 30);
  const taskBg = lightenColor(baseColor, 40);
  const doneTaskBg = '#3f3f46';

  return (
    <div className="min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Хедер */}
      <div 
        className="pt-16 pb-4 px-6 transition-colors duration-500 flex justify-between items-end"
        style={{ backgroundColor: headerBg }}
      >
        <h1 className="text-5xl font-bold text-white tracking-tight">Задачи</h1>
        <button 
          onClick={() => setShowPalette(!showPalette)}
          className="mb-1 p-2 rounded-full transition-colors"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Palette size={24} className="text-white/80" />
        </button>
      </div>

      {/* Палитра цветов */}
      <AnimatePresence>
        {showPalette && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-900 border-b border-zinc-800"
          >
            <div className="flex gap-3 px-6 py-4 overflow-x-auto">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setBaseColor(c.hex);
                    setShowPalette(false);
                  }}
                  className={`w-10 h-10 rounded-full shrink-0 transition-transform ${
                    baseColor === c.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                  }`}
                  style={{ backgroundColor: c.hex, WebkitTapHighlightColor: 'transparent' }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Плашка онбординга */}
      {isFirstLaunch && tasks.some(t => t.id.startsWith('tut-')) && (
        <div className="bg-zinc-900 px-6 py-3 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Info size={16} />
            <span>Это обучающие задачи</span>
          </div>
          <button 
            onClick={clearTutorial}
            className="text-blue-500 text-sm font-semibold"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Очистить
          </button>
        </div>
      )}

      {/* Список задач */}
      <div className="flex-1 overflow-y-auto pb-24">
        {tasks.map(task => (
          <SwipeableTask
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onUpdate={updateTask}
            taskBg={task.done ? doneTaskBg : taskBg}
          />
        ))}
        
        <form onSubmit={addTask} className="px-6 py-4 border-b border-zinc-900">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="+ Новая задача"
            className="w-full bg-transparent text-zinc-400 text-xl outline-none placeholder-zinc-600"
          />
        </form>
      </div>
    </div>
  );
}
