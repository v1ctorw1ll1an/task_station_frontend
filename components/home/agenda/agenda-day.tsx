'use client';

import { useState } from 'react';
import { TaskDueCard, type TaskDueCardData } from '../task-due-card';
import { EventCard } from './event-card';
import { EditEventDialog } from './edit-event-dialog';
import type { CalendarEventOccurrence } from '@/lib/event-types';

interface AgendaDayProps {
  tasks: TaskDueCardData[];
  events: CalendarEventOccurrence[];
  companyId: string;
  onTaskClick?: (task: TaskDueCardData) => void;
}

export function AgendaDay({ tasks, events, companyId, onTaskClick }: AgendaDayProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventOccurrence | null>(null);

  if (tasks.length === 0 && events.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-12">
        Nada agendado para hoje
      </p>
    );
  }

  // Eventos all-day primeiro, depois timed (já vêm ordenados de groupEventsByDay; reordeno aqui também)
  const sortedEvents = [...events].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    return a.startsAt.localeCompare(b.startsAt);
  });

  return (
    <>
      <div className="space-y-2">
        {sortedEvents.map((ev) => (
          <EventCard key={ev.occurrenceKey} event={ev} onClick={() => setSelectedEvent(ev)} />
        ))}
        {tasks.map((t) => (
          <TaskDueCard key={t.id} task={t} onTaskClick={onTaskClick} />
        ))}
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
