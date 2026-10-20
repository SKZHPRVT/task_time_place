import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Folder } from '../types';
import { Plus, X, Check } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { getHeaderTaskColors, isLightColor } from '../utils/color';

interface FolderSheetProps {
  isOpen: boolean;
  folders: Folder[];
  activeFolderId: string;
  onClose: () => void;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

export function FolderSheet({ isOpen, folders, activeFolderId, onClose, onSwitch, onCreate, onDelete }: FolderSheetProps) {
  const handleDragEnd = (_e: any, info: PanInfo) => {
    if (info.offset.y > 100) onClose();
  };

  const handleCreateClick = () => {
    const name = window.prompt('Название новой папки:');
    if (name && name.trim()) {
      onCreate(name.trim());
      haptic('medium');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            style={{ backdropFilter: 'blur(4px)' }}
          />
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
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1.5 bg-zinc-600 rounded-full" />
            </div>

            <div className="flex justify-between items-center px-6 pb-4">
              <h2 className="text-white text-xl font-bold">Мои папки</h2>
              <button
                onClick={handleCreateClick}
                className="text-blue-500 text-base font-semibold flex items-center gap-1 active:opacity-50"
              >
                <Plus size={18} /> Новая
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {folders.map(folder => {
                const colors = getHeaderTaskColors(folder.baseColor);
                const headerBg = colors.header;
                const light = isLightColor(folder.baseColor);
                const textColor = light ? 'text-zinc-900' : 'text-white';

                return (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between px-6 py-3 border-b border-zinc-800"
                    style={{ backgroundColor: headerBg }}
                  >
                    <button
                      onClick={() => {
                        onSwitch(folder.id);
                        haptic('light');
                        onClose();
                      }}
                      className={`flex-1 text-left text-lg font-medium ${textColor}`}
                    >
                      {folder.name}
                      {folder.id === activeFolderId && (
                        <Check size={16} className={`inline ml-2 ${light ? 'text-green-700' : 'text-green-400'}`} />
                      )}
                    </button>
                    {folders.length > 1 && (
                      <button
                        onClick={() => {
                          onDelete(folder.id);
                          haptic('heavy');
                        }}
                        className="p-2 active:opacity-50"
                      >
                        <X size={18} className={light ? 'text-red-700' : 'text-red-400'} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
