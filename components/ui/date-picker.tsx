'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Exibe o botão de limpar (X / "Limpar"). Default: true. Use false em campos obrigatórios. */
  clearable?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecionar data',
  className,
  disabled,
  side,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? parseISO(value) : undefined;

  const formattedDate = selected
    ? format(selected, "d 'de' MMM. yyyy", { locale: ptBR })
    : null;

  function handleSelect(date: Date | undefined) {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      setOpen(false);
    }
  }

  function handleToday() {
    onChange(format(new Date(), 'yyyy-MM-dd'));
    setOpen(false);
  }

  function handleClear(e?: React.MouseEvent) {
    e?.stopPropagation();
    onChange('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm',
            'hover:bg-accent/50 transition-colors cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !formattedDate && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left truncate">{formattedDate ?? placeholder}</span>
          {clearable && value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side={side}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          locale={ptBR}
          autoFocus
        />
        <div className="border-t px-3 py-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={handleToday}
          >
            Hoje
          </Button>
          {clearable && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs text-muted-foreground"
              onClick={() => handleClear()}
            >
              Limpar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
