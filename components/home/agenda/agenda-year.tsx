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
import { dayKey, groupTasksByDay } from './agenda-utils';
import { DayTasksPopover } from './day-tasks-popover';

const WEEK_OPTS = { weekStartsOn: 0 as const };
const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface AgendaYearProps {
  anchor: Date;
  tasks: TaskDueCardData[];
}

export function AgendaYear({ anchor, tasks }: AgendaYearProps) {
  const grouped = groupTasksByDay(tasks);
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
                const tasksOfDay = grouped.get(dayKey(day)) ?? [];
                const hasTasks = tasksOfDay.length > 0;

                return (
                  <DayTasksPopover key={day.toISOString()} date={day} tasks={tasksOfDay}>
                    <button
                      type="button"
                      className={cn(
                        'relative aspect-square text-[11px] rounded-full flex items-center justify-center hover:bg-accent transition-colors',
                        !inMonth && 'text-muted-foreground/40',
                        inMonth && hasTasks && 'font-semibold',
                        today && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                    >
                      {format(day, 'd')}
                      {inMonth && hasTasks && !today && (
                        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
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
