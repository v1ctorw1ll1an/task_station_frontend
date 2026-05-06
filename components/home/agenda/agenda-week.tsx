'use client';

import { useState } from 'react';
import Link from 'next/link';
import { eachDayOfInterval, format, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { TaskDueCardData } from '../task-due-card';
import type { CalendarEventOccurrence } from '@/lib/event-types';
import { dayKey, groupEventsByDay, groupTasksByDay, type TaskDateField } from './agenda-utils';
import { EventCard } from './event-card';
import { EditEventDialog } from './edit-event-dialog';

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-400',
};

interface AgendaWeekProps {
  anchor: Date;
  tasks: TaskDueCardData[];
  events: CalendarEventOccurrence[];
  companyId: string;
  onCreateAt?: (date: Date) => void;
  dateField?: TaskDateField;
  onTaskClick?: (task: TaskDueCardData) => void;
}

export function AgendaWeek({ anchor, tasks, events, companyId, onCreateAt, dateField = 'dueDate', onTaskClick }: AgendaWeekProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventOccurrence | null>(null);
  const days = eachDayOfInterval({
    start: startOfWeek(anchor, { weekStartsOn: 0 }),
    end: endOfWeek(anchor, { weekStartsOn: 0 }),
  });
  const groupedTasks = groupTasksByDay(tasks, dateField);
  const groupedEvents = groupEventsByDay(events);

  return (
    <>
      <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
        {days.map((day) => {
          const today = isToday(day);
          const tasksOfDay = groupedTasks.get(dayKey(day)) ?? [];
          const eventsOfDay = groupedEvents.get(dayKey(day)) ?? [];
          return (
            <div
              key={day.toISOString()}
              onDoubleClick={() => onCreateAt?.(day)}
              className={cn(
                'flex flex-col bg-card min-h-[260px] cursor-pointer',
                today && 'bg-primary/5',
              )}
            >
              <div className="flex flex-col items-center gap-1 px-2 py-2 border-b">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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
              <div className="flex-1 px-1.5 py-1.5 space-y-1 overflow-y-auto">
                {eventsOfDay.map((ev) => (
                  <EventCard
                    key={ev.occurrenceKey}
                    event={ev}
                    compact
                    onClick={() => setSelectedEvent(ev)}
                  />
                ))}
                {tasksOfDay.map((t) => {
                  const cls = cn(
                    'block w-full text-left rounded border-l-2 bg-muted/40 hover:bg-accent/60 transition-colors px-1.5 py-1 text-xs truncate',
                    PRIORITY_BORDER[t.priority] ?? 'border-l-slate-300',
                  );
                  return onTaskClick ? (
                    <button
                      key={t.id}
                      type="button"
                      title={t.title}
                      onClick={() => onTaskClick(t)}
                      className={cls}
                    >
                      {t.title}
                    </button>
                  ) : (
                    <Link
                      key={t.id}
                      href={`/workspace/${t.project.workspace.id}/projetos/${t.project.id}?task=${t.id}`}
                      title={t.title}
                      className={cls}
                    >
                      {t.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
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
