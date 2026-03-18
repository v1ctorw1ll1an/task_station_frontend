export interface ColumnColor {
  label: string;
  value: string;
}

export const COLUMN_COLORS: ColumnColor[] = [
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Violeta', value: '#7c3aed' },
  { label: 'Roxo', value: '#a855f7' },
  { label: 'Fúcsia', value: '#d946ef' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Vermelho rosado', value: '#f43f5e' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Laranja', value: '#f97316' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Amarelo', value: '#eab308' },
  { label: 'Lima', value: '#84cc16' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Ciano', value: '#06b6d4' },
  { label: 'Azul claro', value: '#0ea5e9' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Marinho', value: '#1d4ed8' },
  { label: 'Ardósia', value: '#64748b' },
  { label: 'Zinco', value: '#71717a' },
];

/** Aplica 10% de opacidade ao hex de 6 dígitos → ex: #6366f11A */
export function colorWithOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${hex}${alpha}`;
}
