export function darkenColor(hex: string, percent: number): string {
  try {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#3f3f46';
    let num = parseInt(hex.replace('#', ''), 16);
    if (isNaN(num)) return '#3f3f46';
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  } catch {
    return '#3f3f46';
  }
}

export function lightenColor(hex: string, percent: number): string {
  try {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#a1a1aa';
    let num = parseInt(hex.replace('#', ''), 16);
    if (isNaN(num)) return '#a1a1aa';
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  } catch {
    return '#a1a1aa';
  }
}

export type ColorOption = {
  name: string;
  hex: string;
  headerHex: string;
  taskHex: string;
};

// Палитра для шапки и задач (12 цветов по колесу)
export const COLOR_PALETTE: ColorOption[] = [
  { name: 'Чёрный',    hex: '#000000', headerHex: '#000000', taskHex: '#1f1f22' },
  { name: 'Серый',     hex: '#71717a', headerHex: '#5c5c63', taskHex: '#8a8a92' },
  { name: 'Белый',     hex: '#e4e4e7', headerHex: '#c4c4c8', taskHex: '#f4f4f5' },
  { name: 'Красный',   hex: '#ef4444', headerHex: '#c73636', taskHex: '#f87171' },
  { name: 'Оранжевый', hex: '#f97316', headerHex: '#d15f10', taskHex: '#fb923c' },
  { name: 'Жёлтый',    hex: '#eab308', headerHex: '#c79506', taskHex: '#facc15' },
  { name: 'Зелёный',   hex: '#22c55e', headerHex: '#1a9e4a', taskHex: '#4ade80' },
  { name: 'Бирюзовый', hex: '#14b8a6', headerHex: '#0e9384', taskHex: '#2dd4bf' },
  { name: 'Голубой',   hex: '#38bdf8', headerHex: '#1e9dd1', taskHex: '#7dd3fc' },
  { name: 'Синий',     hex: '#3b82f6', headerHex: '#2563c9', taskHex: '#60a5fa' },
  { name: 'Фиолетовый',hex: '#a855f7', headerHex: '#8b3fd1', taskHex: '#c084fc' },
  { name: 'Розовый',   hex: '#ec4899', headerHex: '#c93780', taskHex: '#f472b6' },
];

// Палитра для фона (всё то же, но можно отдельно настроить)
export const BG_PALETTE: ColorOption[] = [
  { name: 'Чёрный',    hex: '#000000', headerHex: '#000000', taskHex: '#000000' },
  { name: 'Тёмно-серый', hex: '#18181b', headerHex: '#18181b', taskHex: '#18181b' },
  { name: 'Серый',     hex: '#3f3f46', headerHex: '#3f3f46', taskHex: '#3f3f46' },
  { name: 'Белый',     hex: '#f4f4f5', headerHex: '#f4f4f5', taskHex: '#f4f4f5' },
  { name: 'Тёмно-красный', hex: '#450a0a', headerHex: '#450a0a', taskHex: '#450a0a' },
  { name: 'Тёмно-зелёный', hex: '#052e16', headerHex: '#052e16', taskHex: '#052e16' },
  { name: 'Тёмно-синий', hex: '#172554', headerHex: '#172554', taskHex: '#172554' },
  { name: 'Тёмно-фиолетовый', hex: '#3b0764', headerHex: '#3b0764', taskHex: '#3b0764' },
  { name: 'Красный',   hex: '#ef4444', headerHex: '#ef4444', taskHex: '#ef4444' },
  { name: 'Зелёный',   hex: '#22c55e', headerHex: '#22c55e', taskHex: '#22c55e' },
  { name: 'Синий',     hex: '#3b82f6', headerHex: '#3b82f6', taskHex: '#3b82f6' },
  { name: 'Фиолетовый',hex: '#a855f7', headerHex: '#a855f7', taskHex: '#a855f7' },
];

// Хелпер: получить цвета для шапки и задач по hex
export function getHeaderTaskColors(hex: string): { header: string; task: string } {
  const found = COLOR_PALETTE.find(c => c.hex === hex);
  if (found) return { header: found.headerHex, task: found.taskHex };
  return { header: darkenColor(hex, 5), task: lightenColor(hex, 5) };
}

// Определяет, светлый ли цвет (для выбора цвета текста)
export function isLightColor(hex: string): boolean {
  try {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
    const num = parseInt(hex.replace('#', ''), 16);
    if (isNaN(num)) return false;
    const R = (num >> 16) & 0xff;
    const G = (num >> 8) & 0xff;
    const B = num & 0xff;
    // Относительная яркость (W3C)
    const luminance = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
    return luminance > 0.6;
  } catch {
    return false;
  }
}
