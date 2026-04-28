import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import type { TaskDueCardData } from '../task-due-card';

export type AgendaView = 'day' | 'week' | 'month' | 'year';

export interface DateRange {
  from: Date;
  to: Date;
}

const WEEK_OPTS = { weekStartsOn: 0 as const }; // Domingo, padrão Google Calendar

export function computeRange(view: AgendaView, anchor: Date): DateRange {
  switch (view) {
    case 'day':
      return { from: anchor, to: anchor };
    case 'week':
      return { from: startOfWeek(anchor, WEEK_OPTS), to: endOfWeek(anchor, WEEK_OPTS) };
    case 'month':
      return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
    case 'year':
      return { from: startOfYear(anchor), to: endOfYear(anchor) };
  }
}

/**
 * Para o grid mensal, precisamos exibir dias do mês anterior/próximo
 * que preenchem a primeira e última semana — Google Calendar style.
 */
export function monthGridRange(anchor: Date): DateRange {
  return {
    from: startOfWeek(startOfMonth(anchor), WEEK_OPTS),
    to: endOfWeek(endOfMonth(anchor), WEEK_OPTS),
  };
}

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function groupTasksByDay(tasks: TaskDueCardData[]): Map<string, TaskDueCardData[]> {
  const map = new Map<string, TaskDueCardData[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const key = t.dueDate.split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}
