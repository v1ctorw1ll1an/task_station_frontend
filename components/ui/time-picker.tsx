'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string; // 'HH:mm' or ''
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  step?: number; // segundos — default 60 (1 min)
}

export function TimePicker({
  value,
  onChange,
  className,
  disabled,
  step = 300,
}: TimePickerProps) {
  return (
    <div
      className={cn(
        'flex h-8 items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm',
        'focus-within:ring-1 focus-within:ring-ring',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        step={step}
        className="flex-1 bg-transparent outline-none text-sm tabular-nums [&::-webkit-calendar-picker-indicator]:opacity-60"
      />
    </div>
  );
}
