import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { formatTaskTime, timeInTz } from '@/lib/datetime';
import type { TaskDueCardData } from '../task-due-card';
import type { CalendarEventOccurrence } from '@/lib/event-types';

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

export type TaskDateField = 'dueDate' | 'startDate';

export function groupTasksByDay(
  tasks: TaskDueCardData[],
  dateField: TaskDateField = 'dueDate',
): Map<string, TaskDueCardData[]> {
  const map = new Map<string, TaskDueCardData[]>();
  for (const t of tasks) {
    const raw = dateField === 'startDate' ? t.startDate : t.dueDate;
    if (!raw) continue;
    // Agrupa pelo dia no TZ da task (igual a groupEventsByDay) — uma task às 22h
    // BRT não "vaza" para o dia seguinte como aconteceria usando a data UTC crua.
    const key = formatInTimeZone(new Date(raw), t.timezone, 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

export function groupEventsByDay(
  events: CalendarEventOccurrence[],
): Map<string, CalendarEventOccurrence[]> {
  const map = new Map<string, CalendarEventOccurrence[]>();
  for (const ev of events) {
    // Agrupa pelo dia no TZ do evento — assim um evento agendado às 23h BRT
    // aparece no dia correto na UI mesmo para usuários em outro timezone.
    const key = formatInTimeZone(new Date(ev.startsAt), ev.timezone, 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  // Ordena por horário dentro de cada dia (all-day primeiro, depois timed)
  for (const list of map.values()) {
    list.sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      return a.startsAt.localeCompare(b.startsAt);
    });
  }
  return map;
}

// ─── Grid de horas (views Hoje / Esta Semana, estilo Google Calendar) ───────

/** Altura de 1 hora no grid (px). */
export const HOUR_PX = 48;
/** Altura total do grid de 24h (px). */
export const GRID_HEIGHT = 24 * HOUR_PX;
/** Altura mínima de um bloco posicionado (px). */
export const MIN_BLOCK_PX = 22;
/** Duração nominal de uma task (sem fim) para cálculo de sobreposição (min). */
export const TASK_SLOT_MIN = 30;

/** Minutos desde a meia-noite do `iso` no `tz` (wall-clock). 0 se vazio/inválido. */
export function minutesInTz(iso: string, tz: string): number {
  const t = timeInTz(iso, tz);
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const clampMin = (n: number) => Math.max(0, Math.min(1440, n));

/** Item posicionável no grid de horas — abstrai evento e task num só layout. */
export interface TimelineItem {
  key: string;
  kind: 'event' | 'task';
  startMin: number;
  endMin: number;
  event?: CalendarEventOccurrence;
  task?: TaskDueCardData;
  /** Coluna atribuída na sobreposição (0-based) e total de colunas no cluster. */
  col: number;
  colCount: number;
}

/**
 * Separa os itens de um dia em "sem horário" (faixa do topo) e "com horário"
 * (posicionados no grid). Evento `allDay` ou task com hora 00:00 = sem horário.
 * Os itens com horário já saem com colunas de sobreposição resolvidas.
 */
export function buildTimeline(
  eventsOfDay: CalendarEventOccurrence[],
  tasksOfDay: TaskDueCardData[],
  dateField: TaskDateField,
): {
  allDayEvents: CalendarEventOccurrence[];
  allDayTasks: TaskDueCardData[];
  timed: TimelineItem[];
} {
  const allDayEvents: CalendarEventOccurrence[] = [];
  const allDayTasks: TaskDueCardData[] = [];
  const timed: TimelineItem[] = [];

  for (const ev of eventsOfDay) {
    if (ev.allDay) {
      allDayEvents.push(ev);
      continue;
    }
    const startMin = clampMin(minutesInTz(ev.startsAt, ev.timezone));
    const endRaw = minutesInTz(ev.endsAt, ev.timezone);
    // Ocorrência que termina em outro dia → estende até o fim do dia visível.
    const endMin = clampMin(endRaw <= startMin ? 1440 : endRaw);
    timed.push({ key: ev.occurrenceKey, kind: 'event', startMin, endMin, event: ev, col: 0, colCount: 1 });
  }

  for (const t of tasksOfDay) {
    const raw = dateField === 'startDate' ? t.startDate : t.dueDate;
    if (!raw || formatTaskTime(raw, t.timezone) === '') {
      allDayTasks.push(t);
      continue;
    }
    const startMin = clampMin(minutesInTz(raw, t.timezone));
    const endMin = clampMin(startMin + TASK_SLOT_MIN);
    timed.push({ key: t.id, kind: 'task', startMin, endMin, task: t, col: 0, colCount: 1 });
  }

  return { allDayEvents, allDayTasks, timed: layoutColumns(timed) };
}

/**
 * Resolve sobreposição estilo Google Calendar: ordena por início, agrupa em
 * clusters conectados por sobreposição e atribui a cada item a primeira coluna
 * livre. `colCount` (total de colunas do cluster) define a largura de cada bloco.
 */
export function layoutColumns(items: TimelineItem[]): TimelineItem[] {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  let cluster: TimelineItem[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const colsEnd: number[] = [];
    for (const it of cluster) {
      let placed = false;
      for (let c = 0; c < colsEnd.length; c++) {
        if (it.startMin >= colsEnd[c]) {
          it.col = c;
          colsEnd[c] = it.endMin;
          placed = true;
          break;
        }
      }
      if (!placed) {
        it.col = colsEnd.length;
        colsEnd.push(it.endMin);
      }
    }
    for (const it of cluster) it.colCount = colsEnd.length;
    cluster = [];
    clusterEnd = -1;
  };

  for (const it of sorted) {
    if (cluster.length > 0 && it.startMin >= clusterEnd) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.endMin);
  }
  flush();
  return sorted;
}
