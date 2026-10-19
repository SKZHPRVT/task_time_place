import { useState } from 'react';
import { SwipeableTask } from './components/SwipeableTask';
import { Task } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Info } from 'lucide-react';

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useLocalStorage('clear_first_launch', true);
  
  // Задачи-подсказки для обучения
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

  return (
    <div className="min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Хедер */}
      <div className="pt-16 pb-6 px-6 bg-red-600 transition-colors duration-500">
        <h1 className="text-5xl font-bold text-white tracking-tight">Задачи</h1>
      </div>

      {/* Плашка онбординга */}
      {isFirstLaunch && tasks.some(t => t.id.startsWith('tut-')) && (
        <div className="bg-zinc-900 px-6 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Info size={16} />
            <span>Это обучающие задачи</span>
          </div>
          <button 
            onClick={clearTutorial}
            className="text-blue-500 text-sm font-semibold active:opacity-50 transition-opacity"
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
          />
        ))}
        
        {/* Поле добавления новой задачи */}
        <form onSubmit={addTask} className="px-6 py-4 border-b border-white/5">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="+ Новая задача"
            className="w-full bg-transparent text-white/50 text-xl outline-none focus:text-white transition-colors placeholder:text-white/30"
          />
        </form>
      </div>
    </div>
  );
}
