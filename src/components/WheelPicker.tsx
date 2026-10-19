import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface WheelPickerProps {
  items: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  itemHeight?: number;
  visibleItems?: number;
  label?: string;
}

export function WheelPicker({ items, value, onChange, itemHeight = 36, visibleItems = 5, label }: WheelPickerProps) {
  const containerHeight = itemHeight * visibleItems;
  const centerOffset = (containerHeight - itemHeight) / 2;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [internalIndex, setInternalIndex] = useState(() => items.findIndex(i => i === value));

  // Синхронизация с внешним value
  useEffect(() => {
    const idx = items.findIndex(i => i === value);
    if (idx !== -1 && idx !== internalIndex) {
      setInternalIndex(idx);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: idx * itemHeight, behavior: 'auto' });
      }
    }
  }, [value]);

  // При монтировании скроллим к текущему значению
  useEffect(() => {
    if (scrollRef.current && internalIndex >= 0) {
      scrollRef.current.scrollTop = internalIndex * itemHeight;
    }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const idx = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== internalIndex) {
      setInternalIndex(clamped);
      onChange(items[clamped]);
    }
  };

  return (
    <div className="flex flex-col items-center" style={{ width: '33%' }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-scroll no-scrollbar w-full"
        style={{
          height: containerHeight,
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ height: centerOffset }} />
        {items.map((item, i) => {
          const isSelected = i === internalIndex;
          return (
            <div
              key={i}
              className={`flex items-center justify-center text-center select-none transition-all ${
                isSelected ? 'text-white text-xl font-semibold' : 'text-zinc-500 text-lg'
              }`}
              style={{ height: itemHeight, scrollSnapAlign: 'center' }}
            >
              {item}
            </div>
          );
        })}
        <div style={{ height: centerOffset }} />
      </div>
      {label && <div className="text-xs text-zinc-500 mt-2">{label}</div>}
    </div>
  );
}
