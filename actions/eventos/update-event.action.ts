'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import type { EventMutationScope } from '@/lib/event-types';

export interface UpdateEventActionState {
  error?: string;
  success?: boolean;
}

export async function updateEventAction(
  _prev: UpdateEventActionState,
  formData: FormData,
): Promise<UpdateEventActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const eventId = formData.get('eventId');
  if (typeof eventId !== 'string' || eventId.length === 0) {
    return { error: 'ID do evento inválido' };
  }

  const scope = (formData.get('scope') ?? 'all') as EventMutationScope;
  const originalDate = formData.get('originalDate');

  const body: Record<string, unknown> = {};
  const title = formData.get('title');
  const description = formData.get('description');
  const location = formData.get('location');
  const color = formData.get('color');
  const startsAt = formData.get('startsAt');
  const endsAt = formData.get('endsAt');
  const allDayRaw = formData.get('allDay');
  const rruleRaw = formData.get('rrule');
  const attendeeIdsRaw = formData.get('attendeeUserIds');
  const remindersRaw = formData.get('reminders');
  const guestEmailsRaw = formData.get('guestEmails');
  const timezone = formData.get('timezone');

  if (typeof title === 'string') body.title = title.trim();
  if (typeof description === 'string') body.description = description;
  if (typeof location === 'string') body.location = location;
  if (typeof color === 'string' && color.length > 0) body.color = color;
  if (typeof startsAt === 'string') body.startsAt = startsAt;
  if (typeof endsAt === 'string') body.endsAt = endsAt;
  if (typeof timezone === 'string' && timezone.length > 0) body.timezone = timezone;
  if (allDayRaw !== null) body.allDay = allDayRaw === 'true';
  if (typeof rruleRaw === 'string') body.rrule = rruleRaw.length > 0 ? rruleRaw : null;
  if (typeof attendeeIdsRaw === 'string') {
    body.attendeeUserIds = attendeeIdsRaw.length > 0 ? attendeeIdsRaw.split(',').filter(Boolean) : [];
  }
  if (typeof guestEmailsRaw === 'string') {
    body.guestEmails =
      guestEmailsRaw.length > 0
        ? guestEmailsRaw
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
        : [];
  }
  if (typeof remindersRaw === 'string') {
    body.reminders =
      remindersRaw.length > 0
        ? remindersRaw
            .split(',')
            .map((m) => Number(m))
            .filter((n) => Number.isInteger(n) && n >= 0)
            // Cada lembrete dispara em ambos os canais (email + notification).
            // A preferência do destinatário decide o que efetivamente aparece.
            .flatMap((minutesBefore) => [
              { minutesBefore, method: 'email' as const },
              { minutesBefore, method: 'notification' as const },
            ])
        : [];
  }

  const params = new URLSearchParams({ scope });
  if (typeof originalDate === 'string' && originalDate.length > 0) {
    params.set('originalDate', originalDate);
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/calendar-events/${eventId}?${params}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao atualizar evento' };
    }

    const companyId = formData.get('companyId');
    if (typeof companyId === 'string' && companyId.length > 0) {
      revalidatePath(`/empresa/${companyId}/inicio`);
    }
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
