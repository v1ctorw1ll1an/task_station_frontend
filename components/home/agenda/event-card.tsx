'use client';

import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, MapPin, Repeat, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEventOccurrence } from '@/lib/event-types';

interface EventCardProps {
  event: CalendarEventOccurrence;
  onClick?: () => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact }: EventCardProps) {
  const start = parseISO(event.startsAt);
  const end = parseISO(event.endsAt);
  const color = event.color ?? '#6366f1';
  const tz = event.timezone;

  const timeLabel = event.allDay
    ? 'Dia inteiro'
    : `${formatInTimeZone(start, tz, 'HH:mm', { locale: ptBR })} – ${formatInTimeZone(end, tz, 'HH:mm', { locale: ptBR })}`;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Evento: ${event.title} · ${timeLabel}`}
        className={cn(
          'flex w-full items-center gap-1 rounded-full px-1.5 py-1 text-xs truncate text-left transition-opacity hover:opacity-90 font-medium',
        )}
        style={{
          backgroundColor: `${color}26`,
          color: color,
          boxShadow: `inset 0 0 0 1px ${color}40`,
        }}
      >
        <CalendarDays className="h-3 w-3 shrink-0" />
        {!event.allDay && (
          <span className="tabular-nums text-[10px] shrink-0 opacity-80">
            {formatInTimeZone(start, tz, 'HH:mm')}
          </span>
        )}
        <span className="min-w-0 truncate">{event.title}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left transition-opacity hover:opacity-90',
      )}
      style={{
        backgroundColor: `${color}1f`,
        boxShadow: `inset 0 0 0 1px ${color}40, inset 4px 0 0 0 ${color}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0"
            style={{ backgroundColor: color, color: 'white' }}
          >
            <CalendarDays className="h-2.5 w-2.5" />
            Evento
          </span>
          <h3 className="text-sm font-semibold leading-snug truncate" style={{ color }}>
            {event.title}
          </h3>
        </div>
        {event.isRecurringInstance && (
          <Repeat className="h-3 w-3 shrink-0 text-muted-foreground mt-0.5" aria-label="Recorrente" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeLabel}
        </span>
        {event.location && (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3" />
            {event.location}
          </span>
        )}
        {event.attendees.length > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.attendees.length}
          </span>
        )}
      </div>

      {!event.isOwner && event.myRsvpStatus && (
        <span
          className={cn(
            'inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide w-fit',
            event.myRsvpStatus === 'accepted' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
            event.myRsvpStatus === 'declined' && 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
            event.myRsvpStatus === 'tentative' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
            event.myRsvpStatus === 'invited' && 'bg-muted text-muted-foreground',
          )}
        >
          {event.myRsvpStatus === 'invited' ? 'Convite' : event.myRsvpStatus}
        </span>
      )}
    </button>
  );
}
