'use client';

import { useState } from 'react';
import Link from 'next/link';
import { eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskDueCardData } from '../task-due-card';
import type { CalendarEventOccurrence } from '@/lib/event-types';
import { dayKey, groupEventsByDay, groupTasksByDay, monthGridRange, type TaskDateField } from './agenda-utils';
import { formatTaskTime } from '@/lib/datetime';
import { DayTasksPopover } from './day-tasks-popover';
import { EditEventDialog } from './edit-event-dialog';

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-400',
};

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface AgendaMonthProps {
  anchor: Date;
  tasks: TaskDueCardData[];
  events: CalendarEventOccurrence[];
  companyId: string;
  onCreateAt?: (date: Date) => void;
  dateField?: TaskDateField;
  onTaskClick?: (task: TaskDueCardData) => void;
}

export function AgendaMonth({ anchor, tasks, events, companyId, onCreateAt, dateField = 'dueDate', onTaskClick }: AgendaMonthProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventOccurrence | null>(null);
  const range = monthGridRange(anchor);
  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const groupedTasks = groupTasksByDay(tasks, dateField);
  const groupedEvents = groupEventsByDay(events);

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS_SHORT.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 grid-rows-[repeat(auto-fill,minmax(110px,1fr))] gap-px bg-border">
          {days.map((day) => {
            const inMonth = isSameMonth(day, anchor);
            const today = isToday(day);
            const tasksOfDay = groupedTasks.get(dayKey(day)) ?? [];
            const eventsOfDay = groupedEvents.get(dayKey(day)) ?? [];
            const totalItems = tasksOfDay.length + eventsOfDay.length;
            const visibleEvents = eventsOfDay.slice(0, 2);
            const visibleTasks =
              visibleEvents.length < 3 ? tasksOfDay.slice(0, 3 - visibleEvents.length) : [];
            const overflow = totalItems - visibleEvents.length - visibleTasks.length;

            return (
              <div
                key={day.toISOString()}
                onDoubleClick={() => onCreateAt?.(day)}
                className={cn(
                  'bg-card min-h-[110px] flex flex-col cursor-pointer',
                  !inMonth && 'bg-muted/20',
                )}
              >
                <div className="flex justify-end px-1.5 pt-1.5">
                  <DayTasksPopover
                    date={day}
                    tasks={tasksOfDay}
                    events={eventsOfDay}
                    companyId={companyId}
                    onTaskClick={onTaskClick}
                  >
                    <button
                      type="button"
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium hover:bg-accent transition-colors',
                        !inMonth && 'text-muted-foreground/60',
                        today && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  </DayTasksPopover>
                </div>
                <div className="flex-1 px-1 pb-1 space-y-0.5 overflow-hidden">
                  {visibleEvents.map((ev) => {
                    const color = ev.color ?? '#6366f1';
                    return (
                      <button
                        key={ev.occurrenceKey}
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        title={`Evento: ${ev.title}`}
                        className="flex w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] truncate text-left transition-opacity hover:opacity-90 font-medium"
                        style={{
                          backgroundColor: `${color}26`,
                          color,
                          boxShadow: `inset 0 0 0 1px ${color}40`,
                        }}
                      >
                        <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                        {!ev.allDay && (
                          <span className="tabular-nums text-[10px] shrink-0 opacity-80">
                            {formatInTimeZone(new Date(ev.startsAt), ev.timezone, 'HH:mm')}
                          </span>
                        )}
                        <span className="truncate">{ev.title}</span>
                      </button>
                    );
                  })}
                  {visibleTasks.map((t) => {
                    const cls = cn(
                      'block rounded border-l-2 bg-muted/40 hover:bg-accent/60 transition-colors px-1.5 py-0.5 text-[11px] truncate',
                      PRIORITY_BORDER[t.priority] ?? 'border-l-slate-300',
                    );
                    const raw = dateField === 'startDate' ? t.startDate : t.dueDate;
                    const timeStr = raw ? formatTaskTime(raw, t.timezone) : '';
                    const label = (
                      <>
                        {timeStr && <span className="tabular-nums text-muted-foreground mr-1">{timeStr}</span>}
                        {t.title}
                      </>
                    );
                    return onTaskClick ? (
                      <button
                        key={t.id}
                        type="button"
                        title={t.title}
                        onClick={() => onTaskClick(t)}
                        className={`${cls} w-full text-left`}
                      >
                        {label}
                      </button>
                    ) : (
                      <Link
                        key={t.id}
                        href={`/workspace/${t.project.workspace.id}/projetos/${t.project.id}?task=${t.id}`}
                        title={t.title}
                        className={cls}
                      >
                        {label}
                      </Link>
                    );
                  })}
                  {overflow > 0 && (
                    <DayTasksPopover
                      date={day}
                      tasks={tasksOfDay}
                      events={eventsOfDay}
                      companyId={companyId}
                    >
                      <button
                        type="button"
                        className="block w-full text-left text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40 rounded px-1.5 py-0.5 transition-colors"
                      >
                        +{overflow} mais
                      </button>
                    </DayTasksPopover>
                  )}
                </div>
              </div>
            );
          })}
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
