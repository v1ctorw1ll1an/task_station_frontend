'use client';

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { TaskDueCardData } from '../task-due-card';
import type { CalendarEventOccurrence } from '@/lib/event-types';
import { dayKey, groupEventsByDay, groupTasksByDay, type TaskDateField } from './agenda-utils';
import { DayTasksPopover } from './day-tasks-popover';

const WEEK_OPTS = { weekStartsOn: 0 as const };
const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface AgendaYearProps {
  anchor: Date;
  tasks: TaskDueCardData[];
  events: CalendarEventOccurrence[];
  companyId: string;
  onCreateAt?: (date: Date) => void;
  dateField?: TaskDateField;
  onTaskClick?: (task: TaskDueCardData) => void;
}

export function AgendaYear({ anchor, tasks, events, companyId, onCreateAt, dateField = 'dueDate', onTaskClick }: AgendaYearProps) {
  const groupedTasks = groupTasksByDay(tasks, dateField);
  const groupedEvents = groupEventsByDay(events);
  const year = anchor.getFullYear();

  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {months.map((month) => {
        const days = eachDayOfInterval({
          start: startOfWeek(startOfMonth(month), WEEK_OPTS),
          end: endOfWeek(endOfMonth(month), WEEK_OPTS),
        });

        return (
          <div key={month.getMonth()} className="rounded-lg border bg-card p-3">
            <p className="text-sm font-semibold capitalize mb-2">
              {format(month, 'MMMM', { locale: ptBR })}
            </p>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-muted-foreground mb-1">
              {WEEKDAY_INITIALS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day) => {
                const inMonth = isSameMonth(day, month);
                const today = isToday(day);
                const k = dayKey(day);
                const tasksOfDay = groupedTasks.get(k) ?? [];
                const eventsOfDay = groupedEvents.get(k) ?? [];
                const hasTasks = tasksOfDay.length > 0;
                const hasEvents = eventsOfDay.length > 0;
                const hasItems = hasTasks || hasEvents;
                const eventColor = hasEvents ? eventsOfDay[0].color ?? '#6366f1' : null;

                return (
                  <DayTasksPopover
                    key={day.toISOString()}
                    date={day}
                    tasks={tasksOfDay}
                    events={eventsOfDay}
                    companyId={companyId}
                    onTaskClick={onTaskClick}
                  >
                    <button
                      type="button"
                      onDoubleClick={() => onCreateAt?.(day)}
                      className={cn(
                        'relative aspect-square text-[11px] rounded-full flex items-center justify-center hover:bg-accent transition-colors',
                        !inMonth && 'text-muted-foreground/40',
                        inMonth && hasItems && 'font-semibold',
                        today && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                    >
                      {format(day, 'd')}
                      {inMonth && hasItems && !today && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                          {hasTasks && (
                            <span
                              className="h-1 w-1 rounded-full bg-primary"
                              title="Task"
                            />
                          )}
                          {hasEvents && (
                            <span
                              className="h-1 w-1 rounded-full"
                              style={{ backgroundColor: eventColor ?? '#6366f1' }}
                              title="Evento"
                            />
                          )}
                        </span>
                      )}
                    </button>
                  </DayTasksPopover>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
