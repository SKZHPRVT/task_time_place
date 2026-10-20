import { useState, useEffect, useMemo, useCallback } from 'react';
import { SwipeableTask } from './components/SwipeableTask';
import { ReminderSheet } from './components/ReminderSheet';
import { FolderSheet } from './components/FolderSheet';
import { Task } from './types';
import { useAppState } from './hooks/useAppState';
import { useReminderChecker } from './hooks/useReminderChecker';
import { Palette } from 'lucide-react';
import { COLOR_PALETTE, getHeaderTaskColors, isLightColor, lightenColor, darkenColor } from './utils/color';
import { motion, AnimatePresence } from 'framer-motion';
import { setHeaderColor } from './lib/telegram';

export default function App() {
  const {
    folders,
    activeFolder,
    updateFolderTasks,
    setFolderColor,
    switchFolder,
    createFolder,
    deleteFolder,
  } = useAppState();

  const [showPalette, setShowPalette] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [paletteMode, setPaletteMode] = useState<'base' | 'bg'>('base');
  const [newTaskText, setNewTaskText] = useState('');
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  const baseColor = activeFolder.baseColor;
  const bgColor = activeFolder.bgColor;

  const colors = getHeaderTaskColors(baseColor);
  const headerBg = colors.header;

  const textIsLight = isLightColor(baseColor);
  const taskTextColor = textIsLight ? 'text-zinc-900' : 'text-white';

  useEffect(() => {
    setHeaderColor(headerBg);
  }, [headerBg]);

  const toggleTask = (id: string) => {
    updateFolderTasks(activeFolder.id, prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    updateFolderTasks(activeFolder.id, prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (id: string, text: string) => {
    updateFolderTasks(activeFolder.id, prev => prev.map(t => (t.id === id ? { ...t, text } : t)));
  };

  const setReminder = (id: string, reminder: string | undefined) => {
    updateFolderTasks(activeFolder.id, prev => prev.map(t => (t.id === id ? { ...t, reminder } : t)));
  };

  const handleReminderTriggered = useCallback((id: string) => {
    updateFolderTasks(activeFolder.id, prev => prev.map(t => (t.id === id ? { ...t, reminder: undefined } : t)));
  }, [activeFolder.id, updateFolderTasks]);

  useReminderChecker(activeFolder.tasks, handleReminderTriggered);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      done: false,
    };
    updateFolderTasks(activeFolder.id, prev => [newTask, ...prev]);
    setNewTaskText('');
  };

  const sortedTasks = useMemo(() => {
    return [...activeFolder.tasks].sort((a, b) => {
      if (a.done === b.done) return 0;
      return a.done ? 1 : -1;
    });
  }, [activeFolder.tasks]);

  const editingTask = editingReminderId ? activeFolder.tasks.find(t => t.id === editingReminderId) : null;

  const handlePaletteSelect = (hex: string) => {
    setFolderColor(activeFolder.id, paletteMode === 'base' ? 'baseColor' : 'bgColor', hex);
  };

  const currentColor = paletteMode === 'base' ? baseColor : bgColor;
  const bgIsLight = isLightColor(bgColor);
  const activeTasksCount = sortedTasks.filter(t => !t.done).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: bgColor }}>
      <div
        className="pb-4 px-6 transition-colors duration-300 flex justify-between items-start shrink-0 gap-2"
        style={{ backgroundColor: headerBg }}
      >
        <button
          onClick={() => setShowFolders(true)}
          className="min-w-0 flex-1 text-left active:opacity-60 transition-opacity"
        >
          <h1
            className="font-bold text-white tracking-tight leading-tight break-all"
            style={{ fontSize: 'clamp(1.25rem, 5vw, 3rem)' }}
          >
            {activeFolder.name}
          </h1>
        </button>

        <button
          onClick={() => setShowPalette(!showPalette)}
          className="p-2 rounded-full active:bg-white/20 transition-colors shrink-0 mt-1"
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
            <div className="flex gap-2 px-6 pt-4">
              <button
                onClick={() => setPaletteMode('base')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  paletteMode === 'base' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Шапка и задачи
              </button>
              <button
                onClick={() => setPaletteMode('bg')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  paletteMode === 'bg' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Фон
              </button>
            </div>
            <div className="flex gap-3 px-6 py-4 overflow-x-auto">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => handlePaletteSelect(c.hex)}
                  title={c.name}
                  className={`w-10 h-10 rounded-full shrink-0 transition-transform active:scale-90 border border-white/10 ${
                    currentColor === c.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pb-24" style={{ backgroundColor: bgColor }}>
        {sortedTasks.map((task, idx) => {
          let taskBg: string;
          if (task.done) {
            taskBg = headerBg;
          } else {
            const activeIdx = sortedTasks.slice(0, idx).filter(t => !t.done).length;
            const lightenPercent = activeTasksCount > 1
              ? -5 + (activeIdx / Math.max(1, activeTasksCount - 1)) * 30
              : -5;
            taskBg = lightenPercent >= 0
              ? lightenColor(baseColor, lightenPercent)
              : darkenColor(baseColor, Math.abs(lightenPercent));
          }

          return (
            <SwipeableTask
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onOpenReminder={setEditingReminderId}
              taskBg={taskBg}
              textColor={taskTextColor}
            />
          );
        })}

        <form onSubmit={addTask} className="px-6 py-4">
          <input
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            placeholder="+ Новая задача"
            className={`w-full bg-transparent text-xl outline-none ${
              bgIsLight ? 'text-zinc-700 placeholder-zinc-500' : 'text-zinc-400 placeholder-zinc-600'
            }`}
          />
        </form>
      </div>

      <FolderSheet
        isOpen={showFolders}
        folders={folders}
        activeFolderId={activeFolder.id}
        onClose={() => setShowFolders(false)}
        onSwitch={switchFolder}
        onCreate={createFolder}
        onDelete={deleteFolder}
      />

      <ReminderSheet
        isOpen={editingReminderId !== null}
        currentReminder={editingTask?.reminder}
        onClose={() => setEditingReminderId(null)}
        onSave={reminder => editingReminderId && setReminder(editingReminderId, reminder)}
        onRemove={() => editingReminderId && setReminder(editingReminderId, undefined)}
      />
    </div>
  );
}
