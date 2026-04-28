'use client';

import { TaskDueCard, type TaskDueCardData } from '../task-due-card';

interface AgendaDayProps {
  tasks: TaskDueCardData[];
}

export function AgendaDay({ tasks }: AgendaDayProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-12">
        Nenhuma tarefa para hoje
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <TaskDueCard key={t.id} task={t} />
      ))}
    </div>
  );
}
