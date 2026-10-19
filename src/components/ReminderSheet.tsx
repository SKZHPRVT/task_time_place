import { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { WheelPicker } from './WheelPicker';

interface ReminderSheetProps {
  isOpen: boolean;
  currentReminder?: string;
  onClose: () => void;
  onSave: (reminder: string) => void;
  onRemove: () => void;
}

// Генерируем список дат на 30 дней вперёд
function getDateItems() {
  const items: { label: string; value: string }[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    let label: string;
    if (i === 0) label = 'Сегодня';
    else if (i === 1) label = 'Завтра';
    else label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    items.push({ label, value: d.toISOString().slice(0, 10) });
  }
  return items;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export function ReminderSheet({ isOpen, currentReminder, onClose, onSave, onRemove }: ReminderSheetProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');

  // Инициализация при открытии
  useEffect(() => {
    if (!isOpen) return;
    if (currentReminder) {
      try {
        const d = new Date(currentReminder);
        setSelectedDate(d.toISOString().slice(0, 10));
        setSelectedHour(String(d.getHours()).padStart(2, '0'));
        setSelectedMinute(String(d.getMinutes()).padStart(2, '0'));
        return;
      } catch {}
    }
    // По умолчанию — сегодня, через час
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    setSelectedDate(now.toISOString().slice(0, 10));
    setSelectedHour(String(now.getHours()).padStart(2, '0'));
    setSelectedMinute('00');
  }, [isOpen, currentReminder]);

  const handleDone = () => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const date = new Date(y, m - 1, d, parseInt(selectedHour), parseInt(selectedMinute));
      onSave(date.toISOString());
      onClose();
    } catch (e) {
      console.warn('[ReminderSheet] Invalid date:', e);
    }
  };

  const handleDragEnd = (_e: any, info: PanInfo) => {
    if (info.offset.y > 100) onClose();
  };

  const dateItems = getDateItems();
  const dateLabels = dateItems.map(d => d.label);
  const dateValues = dateItems.map(d => d.value);
  const currentDateIdx = Math.max(0, dateValues.indexOf(selectedDate));
  const currentDateLabel = dateLabels[currentDateIdx];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемнение */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* Шторка */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-3xl pb-8"
            style={{ touchAction: 'none' }}
          >
            {/* Ручка сверху */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1.5 bg-zinc-600 rounded-full" />
            </div>

            {/* Заголовок + кнопки */}
            <div className="flex justify-between items-center px-6 pb-4">
              <button
                onClick={() => { onRemove(); onClose(); }}
                className="text-blue-500 text-base font-medium active:opacity-50 transition-opacity"
              >
                {currentReminder ? 'Удалить напоминание' : 'Отмена'}
              </button>
              <button
                onClick={handleDone}
                className="text-blue-500 text-base font-semibold active:opacity-50 transition-opacity"
              >
                Готово
              </button>
            </div>

            {/* Колёса */}
            <div className="flex justify-center items-start px-4 relative">
              {/* Подсветка выбранной строки */}
              <div
                className="absolute left-4 right-4 bg-zinc-800 rounded-xl pointer-events-none"
                style={{ top: '50%', height: 36, marginTop: -18 }}
              />

              <div className="flex w-full relative z-10">
                <WheelPicker
                  items={dateLabels}
                  value={currentDateLabel}
                  onChange={label => {
                    const idx = dateLabels.indexOf(String(label));
                    if (idx !== -1) setSelectedDate(dateValues[idx]);
                  }}
                />
                <WheelPicker items={HOURS} value={selectedHour} onChange={v => setSelectedHour(String(v))} />
                <WheelPicker items={MINUTES} value={selectedMinute} onChange={v => setSelectedMinute(String(v))} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
