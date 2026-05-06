'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskDueCard, type TaskDueCardData } from '../task-due-card';
import { EventCard } from './event-card';
import { EditEventDialog } from './edit-event-dialog';
import type { CalendarEventOccurrence } from '@/lib/event-types';

interface DayTasksPopoverProps {
  date: Date;
  tasks: TaskDueCardData[];
  events?: CalendarEventOccurrence[];
  companyId?: string;
  children: React.ReactNode;
  onTaskClick?: (task: TaskDueCardData) => void;
}

export function DayTasksPopover({
  date,
  tasks,
  events = [],
  companyId,
  children,
  onTaskClick,
}: DayTasksPopoverProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventOccurrence | null>(null);

  const headerLabel = format(date, "d 'de' MMMM, EEEE", { locale: ptBR });
  const total = tasks.length + events.length;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="center">
          <div className="border-b px-4 py-2">
            <p className="text-sm font-semibold capitalize">{headerLabel}</p>
            <p className="text-xs text-muted-foreground">
              {total === 0
                ? 'Sem itens'
                : `${total} ite${total === 1 ? 'm' : 'ns'}`}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto p-3 space-y-2">
            {total === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Nada agendado neste dia
              </p>
            ) : (
              <>
                {events.map((ev) => (
                  <EventCard
                    key={ev.occurrenceKey}
                    event={ev}
                    onClick={() => setSelectedEvent(ev)}
                  />
                ))}
                {tasks.map((t) => (
                  <TaskDueCard key={t.id} task={t} onTaskClick={onTaskClick} />
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedEvent && companyId && (
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
