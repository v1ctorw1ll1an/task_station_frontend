'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X } from 'lucide-react';
import { RRule, type Options } from 'rrule';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

type Preset = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom';

const CUSTOM_PREFIX = 'RDATES=';

interface RecurrencePickerProps {
  /** Data de início — usada para construir BYDAY/BYMONTHDAY */
  startsAt: Date;
  /** RRULE atual ('' = não repete) */
  value: string;
  onChange: (rrule: string) => void;
}

const WEEKDAY_RRULE = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];

function buildRrule(preset: Preset, startsAt: Date): string {
  if (preset === 'none') return '';
  if (preset === 'custom') return `${CUSTOM_PREFIX}`;

  const dow = startsAt.getDay();
  const byweekday = WEEKDAY_RRULE[dow];

  const opts: Partial<Options> = {};
  switch (preset) {
    case 'daily':
      opts.freq = RRule.DAILY;
      break;
    case 'weekly':
      opts.freq = RRule.WEEKLY;
      opts.byweekday = [byweekday];
      break;
    case 'weekdays':
      opts.freq = RRule.WEEKLY;
      opts.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
      break;
    case 'monthly':
      opts.freq = RRule.MONTHLY;
      opts.bymonthday = [startsAt.getDate()];
      break;
    case 'yearly':
      opts.freq = RRule.YEARLY;
      break;
  }

  const rule = new RRule(opts);
  return rule.toString().replace(/^RRULE:/, '');
}

function detectPreset(rrule: string, startsAt: Date): Preset {
  if (!rrule) return 'none';
  if (rrule.startsWith(CUSTOM_PREFIX)) return 'custom';
  const upper = rrule.toUpperCase();
  if (upper.includes('FREQ=DAILY')) return 'daily';
  if (upper.includes('FREQ=WEEKLY')) {
    if (upper.includes('BYDAY=MO,TU,WE,TH,FR')) return 'weekdays';
    return 'weekly';
  }
  if (upper.includes('FREQ=MONTHLY')) return 'monthly';
  if (upper.includes('FREQ=YEARLY')) return 'yearly';
  void startsAt;
  return 'none';
}

function parseCustomDates(rrule: string): string[] {
  if (!rrule.startsWith(CUSTOM_PREFIX)) return [];
  const csv = rrule.substring(CUSTOM_PREFIX.length);
  return csv ? csv.split(',').filter(Boolean) : [];
}

function buildCustomRrule(dates: string[]): string {
  const sorted = [...new Set(dates)].sort();
  return `${CUSTOM_PREFIX}${sorted.join(',')}`;
}

export function RecurrencePicker({ startsAt, value, onChange }: RecurrencePickerProps) {
  const preset = useMemo(() => detectPreset(value, startsAt), [value, startsAt]);
  const customDates = useMemo(() => parseCustomDates(value), [value]);

  const weekdayLabel = format(startsAt, 'EEEE', { locale: ptBR });
  const monthdayLabel = format(startsAt, "d 'de cada mês'", { locale: ptBR });
  const yearlyLabel = format(startsAt, "d 'de' MMMM", { locale: ptBR });

  function handleChange(next: Preset) {
    onChange(buildRrule(next, startsAt));
  }

  function addCustomDate(date: string) {
    if (!date) return;
    onChange(buildCustomRrule([...customDates, date]));
  }

  function removeCustomDate(date: string) {
    onChange(buildCustomRrule(customDates.filter((d) => d !== date)));
  }

  return (
    <div className="space-y-2">
      <Select value={preset} onValueChange={(v) => handleChange(v as Preset)}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Repetição" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Não se repete</SelectItem>
          <SelectItem value="daily">Diariamente</SelectItem>
          <SelectItem value="weekly">Semanalmente ({weekdayLabel})</SelectItem>
          <SelectItem value="weekdays">Dias úteis (seg–sex)</SelectItem>
          <SelectItem value="monthly">Mensalmente ({monthdayLabel})</SelectItem>
          <SelectItem value="yearly">Anualmente ({yearlyLabel})</SelectItem>
          <SelectItem value="custom">Datas personalizadas</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <div className="rounded-md border bg-muted/30 p-2 space-y-1.5">
          <p className="text-[11px] text-muted-foreground">
            Datas selecionadas (mantém o horário de início):
          </p>
          {customDates.length === 0 && (
            <p className="text-[11px] italic text-muted-foreground/70">Nenhuma data adicionada</p>
          )}
          {customDates.map((d) => (
            <div
              key={d}
              className="flex items-center justify-between gap-2 rounded bg-card px-2 py-1 text-xs"
            >
              <span>{format(parseISO(d), "d 'de' MMM. yyyy", { locale: ptBR })}</span>
              <button
                type="button"
                onClick={() => removeCustomDate(d)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
            <DatePicker
              value=""
              onChange={addCustomDate}
              placeholder="Adicionar data"
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
