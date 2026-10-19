import { useState } from 'react';
import { SwipeableTask } from './components/SwipeableTask';
import { Task } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

export default function App() {
  // Используем localStorage, чтобы задачи не пропадали при перезагрузке
  const [tasks, setTasks] = useLocalStorage<Task[]>('clear_tasks', [
    { id: '1', text: 'Уборка/разбор вещей', done: false },
    { id: '2', text: 'Похудеть до 73.5 кг', done: false, reminder: '2026-10-19T23:00:00' },
    { id: '3', text: 'Выкладка на авито ненужного', done: true },
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
    
    setTasks([newTask, ...tasks]); // Добавляем в начало
    setNewTaskText('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Хедер */}
      <div className="pt-16 pb-6 px-6 bg-red-600 transition-colors duration-500">
        <h1 className="text-5xl font-bold text-white tracking-tight">Задачи</h1>
      </div>

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
