import { useState } from 'react';
import { SwipeableTask } from './components/SwipeableTask';
import { Task } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

export default function App() {
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

  return (
    <div className="min-h-screen flex flex-col bg-black overflow-hidden">
      <div className="pt-16 pb-4 px-6 bg-zinc-800">
        <h1 className="text-5xl font-bold text-white tracking-tight">Задачи</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {tasks.map(task => (
          <SwipeableTask
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onUpdate={updateTask}
            taskBg={task.done ? '#3f3f46' : '#a1a1aa'}
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
