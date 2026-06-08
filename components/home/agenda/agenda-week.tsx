'use client';

import { eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import type { TaskDueCardData } from '../task-due-card';
import type { CalendarEventOccurrence } from '@/lib/event-types';
import type { TaskDateField } from './agenda-utils';
import { AgendaTimeGrid } from './agenda-time-grid';

interface AgendaWeekProps {
  anchor: Date;
  tasks: TaskDueCardData[];
  events: CalendarEventOccurrence[];
  companyId: string;
  onCreateAt?: (date: Date) => void;
  dateField?: TaskDateField;
  onTaskClick?: (task: TaskDueCardData) => void;
}

export function AgendaWeek({
  anchor,
  tasks,
  events,
  companyId,
  onCreateAt,
  dateField = 'dueDate',
  onTaskClick,
}: AgendaWeekProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(anchor, { weekStartsOn: 0 }),
    end: endOfWeek(anchor, { weekStartsOn: 0 }),
  });

  return (
    <AgendaTimeGrid
      days={days}
      tasks={tasks}
      events={events}
      dateField={dateField}
      companyId={companyId}
      onCreateAt={onCreateAt}
      onTaskClick={onTaskClick}
      showHeaders
    />
  );
}
