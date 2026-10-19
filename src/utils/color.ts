export function darkenColor(hex: string, percent: number): string {
  try {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#3f3f46';
    let num = parseInt(hex.replace("#", ""), 16);
    if (isNaN(num)) return '#3f3f46';
    let amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = (num >> 8 & 0x00FF) - amt,
      B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  } catch (e) {
    return '#3f3f46';
  }
}

export function lightenColor(hex: string, percent: number): string {
  try {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#a1a1aa';
    let num = parseInt(hex.replace("#", ""), 16);
    if (isNaN(num)) return '#a1a1aa';
    let amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  } catch (e) {
    return '#a1a1aa';
  }
}

export const COLOR_PALETTE = [
  { name: 'Серый', hex: '#71717a' },
  { name: 'Красный', hex: '#ef4444' },
  { name: 'Оранжевый', hex: '#f97316' },
  { name: 'Желтый', hex: '#eab308' },
  { name: 'Зеленый', hex: '#22c55e' },
  { name: 'Синий', hex: '#3b82f6' },
  { name: 'Фиолетовый', hex: '#a855f7' },
  { name: 'Розовый', hex: '#ec4899' },
];
