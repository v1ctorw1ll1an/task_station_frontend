'use client';

import { addHours, addMinutes, format, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EventColorPicker, EVENT_COLOR_PRESETS } from './event-color-picker';
import { RecurrencePicker } from './recurrence-picker';

export interface EventFormState {
  title: string;
  description: string;
  location: string;
  allDay: boolean;
  startDate: string; // YYYY-MM-DD (no TZ do evento)
  startTime: string; // HH:mm (no TZ do evento)
  endDate: string;
  endTime: string;
  color: string;
  rrule: string;
  reminders: number[]; // minutos antes
  timezone: string; // IANA tz do evento
  guestEmails: string[]; // emails externos a notificar
}

const BROWSER_TZ =
  typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'America/Sao_Paulo';

export const REMINDER_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 10, label: '10 min antes' },
  { minutes: 30, label: '30 min antes' },
  { minutes: 60, label: '1 hora antes' },
  { minutes: 1440, label: '1 dia antes' },
];

export function buildInitialFormState(occurrence?: {
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  startsAt: string;
  endsAt: string;
  color: string | null;
  rrule?: string | null;
  reminders?: { minutesBefore: number }[];
  timezone?: string;
  guestEmails?: string[];
}): EventFormState {
  if (!occurrence) {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const later = addHours(now, 1);
    return {
      title: '',
      description: '',
      location: '',
      allDay: false,
      startDate: format(now, 'yyyy-MM-dd'),
      startTime: format(now, 'HH:mm'),
      endDate: format(later, 'yyyy-MM-dd'),
      endTime: format(later, 'HH:mm'),
      color: EVENT_COLOR_PRESETS[1].value,
      rrule: '',
      reminders: [],
      timezone: BROWSER_TZ,
      guestEmails: [],
    };
  }
  const tz = occurrence.timezone ?? BROWSER_TZ;
  const start = parseISO(occurrence.startsAt);
  const end = parseISO(occurrence.endsAt);
  return {
    title: occurrence.title,
    description: occurrence.description ?? '',
    location: occurrence.location ?? '',
    allDay: occurrence.allDay,
    startDate: formatInTimeZone(start, tz, 'yyyy-MM-dd'),
    startTime: formatInTimeZone(start, tz, 'HH:mm'),
    endDate: formatInTimeZone(end, tz, 'yyyy-MM-dd'),
    endTime: formatInTimeZone(end, tz, 'HH:mm'),
    color: occurrence.color ?? EVENT_COLOR_PRESETS[1].value,
    rrule: occurrence.rrule ?? '',
    reminders: occurrence.reminders?.map((r) => r.minutesBefore) ?? [],
    timezone: tz,
    guestEmails: occurrence.guestEmails ?? [],
  };
}

/**
 * Combina data + hora no TZ informado e retorna ISO UTC.
 * Para all-day, usa 00:00 como wall-clock.
 */
export function combineDateAndTime(
  date: string,
  time: string,
  allDay: boolean,
  timezone: string,
): string {
  // Sem data não há instante a calcular — evita `RangeError: Invalid time value`
  // ao renderizar enquanto o campo está vazio.
  if (!date) return '';
  const t = allDay ? '00:00:00' : `${time || '00:00'}:00`;
  const d = fromZonedTime(`${date}T${t}`, timezone);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

interface EventFormFieldsProps {
  state: EventFormState;
  onChange: (state: EventFormState) => void;
}

export function EventFormFields({ state, onChange }: EventFormFieldsProps) {
  // Derivado direto do state — evita useEffect/setState em cascata
  const startsAtDate = parseISO(`${state.startDate}T${state.startTime || '00:00'}:00`);

  function patch(updates: Partial<EventFormState>) {
    onChange({ ...state, ...updates });
  }

  // Ao escolher o início, o fim vira início + 30 min. Em "dia inteiro" não há
  // hora: o fim apenas acompanha a data de início. O `format` cuida da virada
  // de dia quando início + 30 min cruza a meia-noite.
  function applyStart(
    startDate: string,
    startTime: string,
    allDay: boolean,
  ): Partial<EventFormState> {
    if (allDay) return { startDate, startTime, endDate: startDate };
    const end = addMinutes(parseISO(`${startDate}T${startTime || '00:00'}:00`), 30);
    return {
      startDate,
      startTime,
      endDate: format(end, 'yyyy-MM-dd'),
      endTime: format(end, 'HH:mm'),
    };
  }

  function toggleReminder(minutes: number) {
    const next = state.reminders.includes(minutes)
      ? state.reminders.filter((m) => m !== minutes)
      : [...state.reminders, minutes];
    patch({ reminders: next });
  }

  function addGuestEmail(input: string) {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    // validação leve — backend valida com class-validator
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    if (state.guestEmails.includes(trimmed)) return;
    patch({ guestEmails: [...state.guestEmails, trimmed] });
  }

  function removeGuestEmail(email: string) {
    patch({ guestEmails: state.guestEmails.filter((e) => e !== email) });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="event-title">Título</Label>
        <Input
          id="event-title"
          value={state.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Adicionar título"
          autoFocus
          required
        />
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label htmlFor="event-allday" className="cursor-pointer">
          Dia inteiro
        </Label>
        <Switch
          id="event-allday"
          checked={state.allDay}
          onCheckedChange={(allDay) => patch({ allDay })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Início</Label>
          <DatePicker
            value={state.startDate}
            onChange={(startDate) => patch(applyStart(startDate, state.startTime, state.allDay))}
            clearable={false}
          />
          {!state.allDay && (
            <TimePicker
              value={state.startTime}
              onChange={(startTime) => patch(applyStart(state.startDate, startTime, state.allDay))}
            />
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fim</Label>
          <DatePicker
            value={state.endDate}
            onChange={(endDate) => patch({ endDate })}
            clearable={false}
          />
          {!state.allDay && (
            <TimePicker
              value={state.endTime}
              onChange={(endTime) => patch({ endTime })}
            />
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Repetição</Label>
        <RecurrencePicker
          startsAt={startsAtDate}
          value={state.rrule}
          onChange={(rrule) => patch({ rrule })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-location">Local (opcional)</Label>
        <Input
          id="event-location"
          value={state.location}
          onChange={(e) => patch({ location: e.target.value })}
          placeholder="Sala, link, endereço..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-description">Descrição (opcional)</Label>
        <textarea
          id="event-description"
          value={state.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          placeholder="Detalhes do evento"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Cor</Label>
        <EventColorPicker value={state.color} onChange={(color) => patch({ color })} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-guest-email" className="text-xs text-muted-foreground">
          Convidados por email
        </Label>
        <p className="text-[11px] text-muted-foreground/80">
          Recebem notificação ao criar, atualizar ou cancelar, e os lembretes do evento.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {state.guestEmails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs"
            >
              {email}
              <button
                type="button"
                onClick={() => removeGuestEmail(email)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remover ${email}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <Input
          id="event-guest-email"
          type="email"
          placeholder="email@exemplo.com (Enter para adicionar)"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              const target = e.currentTarget;
              addGuestEmail(target.value);
              target.value = '';
            }
          }}
          onBlur={(e) => {
            if (e.currentTarget.value.trim()) {
              addGuestEmail(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Lembretes</Label>
        <p className="text-[11px] text-muted-foreground/80">
          Disparam por email, toast no app e notificação do sistema operacional —
          conforme suas preferências em Perfil → Notificações.
        </p>
        <div className="flex flex-wrap gap-2">
          {REMINDER_OPTIONS.map((opt) => {
            const active = state.reminders.includes(opt.minutes);
            return (
              <button
                key={opt.minutes}
                type="button"
                onClick={() => toggleReminder(opt.minutes)}
                className={
                  active
                    ? 'rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1 text-xs font-medium'
                    : 'rounded-full border bg-muted text-muted-foreground hover:bg-accent px-3 py-1 text-xs font-medium'
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
