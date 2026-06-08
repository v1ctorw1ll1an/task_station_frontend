'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { BROWSER_TZ } from '@/lib/datetime';
import type { TaskDueCardData } from '../task-due-card';
import type { CalendarEventOccurrence } from '@/lib/event-types';
import {
  buildTimeline,
  dayKey,
  groupEventsByDay,
  groupTasksByDay,
  GRID_HEIGHT,
  HOUR_PX,
  MIN_BLOCK_PX,
  type TaskDateField,
  type TimelineItem,
} from './agenda-utils';
import { EventCard } from './event-card';
import { EditEventDialog } from './edit-event-dialog';

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-400',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GUTTER = '3.5rem';

/** Minutos desde a meia-noite no fuso do navegador. */
function minutesNow(): number {
  const [h, m] = formatInTimeZone(new Date(), BROWSER_TZ, 'HH:mm').split(':').map(Number);
  return h * 60 + m;
}

/** HH:mm a partir de minutos desde a meia-noite. */
function formatMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

interface AgendaTimeGridProps {
  days: Date[];
  tasks: TaskDueCardData[];
  events: CalendarEventOccurrence[];
  dateField: TaskDateField;
  companyId: string;
  onTaskClick?: (task: TaskDueCardData) => void;
  onCreateAt?: (date: Date) => void;
  /** Mostra cabeçalho por coluna (dia da semana + número). Usar na view semana. */
  showHeaders?: boolean;
}

export function AgendaTimeGrid({
  days,
  tasks,
  events,
  dateField,
  companyId,
  onTaskClick,
  onCreateAt,
  showHeaders,
}: AgendaTimeGridProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventOccurrence | null>(null);
  // null no SSR/primeiro paint → evita mismatch de hidratação na linha do "agora".
  const [nowMin, setNowMin] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupedTasks = groupTasksByDay(tasks, dateField);
  const groupedEvents = groupEventsByDay(events);

  const perDay = days.map((day) => {
    const key = dayKey(day);
    return {
      day,
      key,
      ...buildTimeline(groupedEvents.get(key) ?? [], groupedTasks.get(key) ?? [], dateField),
    };
  });

  const hasAllDayBand = perDay.some((d) => d.allDayEvents.length > 0 || d.allDayTasks.length > 0);
  const cols = `${GUTTER} repeat(${days.length}, minmax(0, 1fr))`;

  // Tick do "agora" a cada 60s.
  useEffect(() => {
    const update = () => setNowMin(minutesNow());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll até ~1h antes de agora (uma vez, no mount).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = Math.max(0, minutesNow() / 60 - 1) * HOUR_PX;
  }, []);

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        {/* Cabeçalho + faixa "Dia todo" + corpo no MESMO container de scroll: como
            todos compartilham `cols` e a mesma largura útil (descontada a scrollbar),
            as colunas ficam sempre alinhadas. Cabeçalho/faixa ficam fixos via sticky. */}
        <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
          {(showHeaders || hasAllDayBand) && (
            <div className="sticky top-0 z-30 bg-card">
              {showHeaders && (
                <div className="grid border-b bg-muted/20" style={{ gridTemplateColumns: cols }}>
                  <div />
                  {days.map((day) => {
                    const today = isToday(day);
                    return (
                      <div key={day.toISOString()} className="flex flex-col items-center gap-0.5 border-l py-1.5">
                        <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {format(day, 'EEE', { locale: ptBR })}
                        </span>
                        <span
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                            today && 'bg-primary text-primary-foreground',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {hasAllDayBand && (
                <div className="grid border-b bg-muted/10" style={{ gridTemplateColumns: cols }}>
                  <div className="flex items-start justify-end pr-2 pt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Dia todo
                  </div>
                  {perDay.map(({ key, allDayEvents, allDayTasks }) => (
                    <div key={key} className="flex max-h-28 min-h-[2rem] flex-col gap-1 overflow-y-auto border-l p-1">
                      {allDayEvents.map((ev) => (
                        <EventCard key={ev.occurrenceKey} event={ev} compact onClick={() => setSelectedEvent(ev)} />
                      ))}
                      {allDayTasks.map((t) => (
                        <TaskChip key={t.id} task={t} onTaskClick={onTaskClick} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Corpo: grid de horas */}
          <div className="grid" style={{ gridTemplateColumns: cols }}>
            {/* Gutter de horas */}
            <div className="relative" style={{ height: GRID_HEIGHT }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                  style={{ top: h * HOUR_PX }}
                >
                  {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                </div>
              ))}
            </div>

            {/* Colunas dos dias */}
            {perDay.map(({ day, key, timed }) => (
              <div
                key={key}
                className="relative border-l"
                style={{ height: GRID_HEIGHT }}
                onDoubleClick={() => onCreateAt?.(day)}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-border/50"
                    style={{ top: h * HOUR_PX }}
                  />
                ))}

                {timed.map((it) =>
                  it.kind === 'event' ? (
                    <TimedEventBlock key={it.key} item={it} onClick={() => setSelectedEvent(it.event!)} />
                  ) : (
                    <TimedTaskBlock key={it.key} item={it} onTaskClick={onTaskClick} />
                  ),
                )}

                {nowMin !== null && isToday(day) && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20"
                    style={{ top: (nowMin / 60) * HOUR_PX }}
                  >
                    <div className="relative border-t-2 border-red-500">
                      <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <EditEventDialog
          occurrence={selectedEvent}
          companyId={companyId}
          open={!!selectedEvent}
          onOpenChange={(open) => {
            if (!open) setSelectedEvent(null);
          }}
        />
      )}
    </>
  );
}

function TimedEventBlock({ item, onClick }: { item: TimelineItem; onClick: () => void }) {
  const ev = item.event!;
  const color = ev.color ?? '#6366f1';
  const height = Math.max(((item.endMin - item.startMin) / 60) * HOUR_PX, MIN_BLOCK_PX);
  const widthPct = 100 / item.colCount;
  const timeLabel = formatMin(item.startMin);
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Evento: ${ev.title} · ${timeLabel}`}
      className="absolute z-10 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-90"
      style={{
        top: (item.startMin / 60) * HOUR_PX,
        height,
        left: `calc(${item.col * widthPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
        backgroundColor: `${color}1f`,
        boxShadow: `inset 0 0 0 1px ${color}40, inset 3px 0 0 0 ${color}`,
        color,
      }}
    >
      <span className="block truncate font-medium">{ev.title}</span>
      {height > 30 && <span className="block tabular-nums opacity-80">{timeLabel}</span>}
    </button>
  );
}

function TimedTaskBlock({
  item,
  onTaskClick,
}: {
  item: TimelineItem;
  onTaskClick?: (task: TaskDueCardData) => void;
}) {
  const t = item.task!;
  const widthPct = 100 / item.colCount;
  const cls = cn(
    'absolute z-10 flex items-center gap-1 overflow-hidden rounded border-l-2 bg-muted/70 px-1.5 text-left text-[11px] leading-tight transition-colors hover:bg-accent',
    PRIORITY_BORDER[t.priority] ?? 'border-l-slate-300',
  );
  const style = {
    top: (item.startMin / 60) * HOUR_PX,
    height: MIN_BLOCK_PX,
    left: `calc(${item.col * widthPct}% + 1px)`,
    width: `calc(${widthPct}% - 2px)`,
  };
  const inner = (
    <>
      <span className="shrink-0 tabular-nums text-muted-foreground">{formatMin(item.startMin)}</span>
      <span className="min-w-0 truncate">{t.title}</span>
    </>
  );
  return onTaskClick ? (
    <button type="button" onClick={() => onTaskClick(t)} title={t.title} className={cls} style={style}>
      {inner}
    </button>
  ) : (
    <Link
      href={`/workspace/${t.project.workspace.id}/projetos/${t.project.id}?task=${t.id}`}
      title={t.title}
      className={cls}
      style={style}
    >
      {inner}
    </Link>
  );
}

function TaskChip({
  task,
  onTaskClick,
}: {
  task: TaskDueCardData;
  onTaskClick?: (task: TaskDueCardData) => void;
}) {
  const cls = cn(
    'flex w-full items-center gap-1 truncate rounded border-l-2 bg-muted/60 px-1.5 py-0.5 text-left text-[11px] transition-colors hover:bg-accent/60',
    PRIORITY_BORDER[task.priority] ?? 'border-l-slate-300',
  );
  return onTaskClick ? (
    <button type="button" onClick={() => onTaskClick(task)} title={task.title} className={cls}>
      <span className="min-w-0 truncate">{task.title}</span>
    </button>
  ) : (
    <Link
      href={`/workspace/${task.project.workspace.id}/projetos/${task.project.id}?task=${task.id}`}
      title={task.title}
      className={cls}
    >
      <span className="min-w-0 truncate">{task.title}</span>
    </Link>
  );
}
