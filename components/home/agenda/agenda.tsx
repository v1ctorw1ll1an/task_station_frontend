'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  addDays,
  addMonths,
  addYears,
  format,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMyTasksAction } from '@/actions/me/get-my-tasks.action';
import type { TaskDueCardData } from '../task-due-card';
import { computeRange, type AgendaView } from './agenda-utils';
import { AgendaDay } from './agenda-day';
import { AgendaWeek } from './agenda-week';
import { AgendaMonth } from './agenda-month';
import { AgendaYear } from './agenda-year';

const VIEWS: { key: AgendaView; label: string }[] = [
  { key: 'day', label: 'Hoje' },
  { key: 'week', label: 'Esta Semana' },
  { key: 'month', label: 'Este Mês' },
  { key: 'year', label: 'Este Ano' },
];

interface AgendaProps {
  companyId: string;
  initialTasks: TaskDueCardData[];
}

function shiftAnchor(view: AgendaView, anchor: Date, delta: number): Date {
  switch (view) {
    case 'day':
      return addDays(anchor, delta);
    case 'week':
      return addDays(anchor, delta * 7);
    case 'month':
      return addMonths(anchor, delta);
    case 'year':
      return addYears(anchor, delta);
  }
}

function rangeLabel(view: AgendaView, anchor: Date): string {
  if (view === 'day') {
    return format(anchor, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  }
  if (view === 'week') {
    const start = startOfWeek(anchor, { weekStartsOn: 0 });
    const end = endOfWeek(anchor, { weekStartsOn: 0 });
    const fmt = "d 'de' MMM";
    return `${format(start, fmt, { locale: ptBR })} – ${format(end, fmt, { locale: ptBR })} ${format(end, 'yyyy', { locale: ptBR })}`;
  }
  if (view === 'month') {
    return format(anchor, "MMMM 'de' yyyy", { locale: ptBR });
  }
  return format(anchor, 'yyyy', { locale: ptBR });
}

export function Agenda({ companyId, initialTasks }: AgendaProps) {
  const [view, setView] = useState<AgendaView>('day');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [tasks, setTasks] = useState<TaskDueCardData[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const { from, to } = computeRange(view, anchor);
    const isDay = view === 'day';
    startTransition(async () => {
      const result = await getMyTasksAction(
        companyId,
        1,
        isDay ? 50 : 500,
        'custom',
        format(from, 'yyyy-MM-dd'),
        format(to, 'yyyy-MM-dd'),
      );
      setTasks(result.data);
    });
  }, [view, anchor, companyId]);

  return (
    <div className="rounded-lg border bg-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 px-4 py-3 border-b sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold">Agenda</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs de view */}
          <div className="flex gap-1">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  view === v.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegação de período */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAnchor((a) => shiftAnchor(view, a, -1))}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchor((a) => shiftAnchor(view, a, 1))}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Próximo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="ml-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Hoje
          </button>
        </div>
        <p className="text-sm font-medium capitalize">{rangeLabel(view, anchor)}</p>
      </div>

      {/* Conteúdo da view */}
      <div className={cn('p-4', isPending && 'opacity-50 pointer-events-none')}>
        {view === 'day' && <AgendaDay tasks={tasks} />}
        {view === 'week' && <AgendaWeek anchor={anchor} tasks={tasks} />}
        {view === 'month' && <AgendaMonth anchor={anchor} tasks={tasks} />}
        {view === 'year' && <AgendaYear anchor={anchor} tasks={tasks} />}
      </div>
    </div>
  );
}
