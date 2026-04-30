'use client';

import { Check, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EVENT_COLOR_PRESETS: { name: string; value: string }[] = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Cinza', value: '#64748b' },
];

interface EventColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function EventColorPicker({ value, onChange }: EventColorPickerProps) {
  const isCustom = !EVENT_COLOR_PRESETS.some((p) => p.value.toLowerCase() === value.toLowerCase());

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {EVENT_COLOR_PRESETS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          aria-label={c.name}
          title={c.name}
          className={cn(
            'h-6 w-6 rounded-full flex items-center justify-center transition-transform',
            value.toLowerCase() === c.value.toLowerCase()
              ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
              : 'hover:scale-110',
          )}
          style={{ backgroundColor: c.value }}
        >
          {value.toLowerCase() === c.value.toLowerCase() && (
            <Check className="h-3.5 w-3.5 text-white" />
          )}
        </button>
      ))}
      <label
        title="Cor personalizada"
        className={cn(
          'relative h-6 w-6 rounded-full cursor-pointer flex items-center justify-center border border-dashed border-muted-foreground/40 hover:border-foreground transition-colors overflow-hidden',
          isCustom && 'ring-2 ring-foreground ring-offset-2 ring-offset-background border-solid',
        )}
        style={isCustom ? { backgroundColor: value } : undefined}
      >
        {isCustom ? (
          <Check className="h-3.5 w-3.5 text-white relative z-10" />
        ) : (
          <Pipette className="h-3 w-3 text-muted-foreground" />
        )}
        <input
          type="color"
          value={isCustom ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Selecionar cor personalizada"
        />
      </label>
    </div>
  );
}
