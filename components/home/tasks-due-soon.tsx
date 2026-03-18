'use client';

import { useState, useTransition } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMyTasksAction } from '@/actions/me/get-my-tasks.action';
import { TaskDueCard, type TaskDueCardData } from './task-due-card';

const FILTERS = [
  { key: 'today', label: 'Hoje' },
  { key: 'tomorrow', label: 'Amanhã' },
  { key: 'this_week', label: 'Esta Semana' },
  { key: 'overdue', label: 'Atrasadas' },
  { key: 'custom', label: 'Personalizado' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const EMPTY_MESSAGES: Record<FilterKey, string> = {
  today: 'Nenhuma tarefa com prazo para hoje',
  tomorrow: 'Nenhuma tarefa com prazo para amanhã',
  this_week: 'Nenhuma tarefa com prazo para esta semana',
  overdue: 'Nenhuma tarefa atrasada',
  custom: 'Nenhuma tarefa encontrada no período selecionado',
};

interface TasksDueSoonProps {
  companyId: string;
  initialData: TaskDueCardData[];
  initialTotal: number;
}

export function TasksDueSoon({ companyId, initialData, initialTotal }: TasksDueSoonProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('today');
  const [tasks, setTasks] = useState<TaskDueCardData[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');

  const limit = 10;

  const fetchTasks = (filter: FilterKey, p: number, from?: string, to?: string) => {
    startTransition(async () => {
      const result = await getMyTasksAction(
        companyId,
        p,
        limit,
        filter,
        filter === 'custom' ? from : undefined,
        filter === 'custom' ? to : undefined,
      );
      setTasks(result.data);
      setTotal(result.total);
      setPage(p);
    });
  };

  const handleFilterChange = (filter: FilterKey) => {
    setActiveFilter(filter);
    if (filter !== 'custom') {
      fetchTasks(filter, 1);
    }
  };

  const handleCustomSearch = () => {
    if (dueDateFrom || dueDateTo) {
      fetchTasks('custom', 1, dueDateFrom, dueDateTo);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Tarefas com prazo</h2>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">({total})</span>
        )}
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {activeFilter === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">De</label>
            <input
              type="date"
              value={dueDateFrom}
              onChange={(e) => setDueDateFrom(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Até</label>
            <input
              type="date"
              value={dueDateTo}
              onChange={(e) => setDueDateTo(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            />
          </div>
          <button
            onClick={handleCustomSearch}
            className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Buscar
          </button>
        </div>
      )}

      {/* Task list */}
      <div className={cn('p-3 space-y-2', isPending && 'opacity-50 pointer-events-none')}>
        {tasks.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {EMPTY_MESSAGES[activeFilter]}
          </p>
        ) : (
          tasks.map((task) => <TaskDueCard key={task.id} task={task} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t">
          <button
            disabled={page <= 1}
            onClick={() => fetchTasks(activeFilter, page - 1, dueDateFrom, dueDateTo)}
            className="rounded-md px-3 py-1 text-xs font-medium bg-muted hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => fetchTasks(activeFilter, page + 1, dueDateFrom, dueDateTo)}
            className="rounded-md px-3 py-1 text-xs font-medium bg-muted hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
