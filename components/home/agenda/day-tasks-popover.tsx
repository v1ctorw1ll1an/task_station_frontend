'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskDueCard, type TaskDueCardData } from '../task-due-card';

interface DayTasksPopoverProps {
  date: Date;
  tasks: TaskDueCardData[];
  children: React.ReactNode;
}

export function DayTasksPopover({ date, tasks, children }: DayTasksPopoverProps) {
  const headerLabel = format(date, "d 'de' MMMM, EEEE", { locale: ptBR });

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="center">
        <div className="border-b px-4 py-2">
          <p className="text-sm font-semibold capitalize">{headerLabel}</p>
          <p className="text-xs text-muted-foreground">
            {tasks.length === 0
              ? 'Sem tarefas'
              : `${tasks.length} tarefa${tasks.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto p-3 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhuma tarefa neste dia
            </p>
          ) : (
            tasks.map((t) => <TaskDueCard key={t.id} task={t} />)
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
