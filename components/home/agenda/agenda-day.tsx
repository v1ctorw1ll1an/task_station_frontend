'use client';

import type { TaskDueCardData } from '../task-due-card';
import type { CalendarEventOccurrence } from '@/lib/event-types';
import type { TaskDateField } from './agenda-utils';
import { AgendaTimeGrid } from './agenda-time-grid';

interface AgendaDayProps {
  anchor: Date;
  tasks: TaskDueCardData[];
  events: CalendarEventOccurrence[];
  companyId: string;
  dateField: TaskDateField;
  onTaskClick?: (task: TaskDueCardData) => void;
}

export function AgendaDay({ anchor, tasks, events, companyId, dateField, onTaskClick }: AgendaDayProps) {
  if (tasks.length === 0 && events.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-12">
        Nada agendado para hoje
      </p>
    );
  }

  return (
    <AgendaTimeGrid
      days={[anchor]}
      tasks={tasks}
      events={events}
      dateField={dateField}
      companyId={companyId}
      onTaskClick={onTaskClick}
      showHeaders={false}
    />
  );
}
