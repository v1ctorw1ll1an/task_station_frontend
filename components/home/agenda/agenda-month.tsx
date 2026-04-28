'use client';

import Link from 'next/link';
import { eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { TaskDueCardData } from '../task-due-card';
import { dayKey, groupTasksByDay, monthGridRange } from './agenda-utils';
import { DayTasksPopover } from './day-tasks-popover';

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
}

export function AgendaMonth({ anchor, tasks }: AgendaMonthProps) {
  const range = monthGridRange(anchor);
  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const grouped = groupTasksByDay(tasks);

  return (
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
          const tasksOfDay = grouped.get(dayKey(day)) ?? [];
          const visible = tasksOfDay.slice(0, 2);
          const overflow = tasksOfDay.length - visible.length;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'bg-card min-h-[110px] flex flex-col',
                !inMonth && 'bg-muted/20',
              )}
            >
              <div className="flex justify-end px-1.5 pt-1.5">
                <DayTasksPopover date={day} tasks={tasksOfDay}>
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
                {visible.map((t) => (
                  <Link
                    key={t.id}
                    href={`/workspace/${t.project.workspace.id}/projetos/${t.project.id}?task=${t.id}`}
                    title={t.title}
                    className={cn(
                      'block rounded border-l-2 bg-muted/40 hover:bg-accent/60 transition-colors px-1.5 py-0.5 text-[11px] truncate',
                      PRIORITY_BORDER[t.priority] ?? 'border-l-slate-300',
                    )}
                  >
                    {t.title}
                  </Link>
                ))}
                {overflow > 0 && (
                  <DayTasksPopover date={day} tasks={tasksOfDay}>
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
  );
}
