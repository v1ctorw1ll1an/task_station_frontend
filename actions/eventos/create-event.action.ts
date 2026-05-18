'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface CreateEventActionState {
  error?: string;
  success?: boolean;
  eventId?: string;
}

export async function createEventAction(
  _prev: CreateEventActionState,
  formData: FormData,
): Promise<CreateEventActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const title = formData.get('title');
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return { error: 'Título é obrigatório' };
  }

  const startsAt = formData.get('startsAt');
  const endsAt = formData.get('endsAt');
  if (typeof startsAt !== 'string' || typeof endsAt !== 'string') {
    return { error: 'Datas inválidas' };
  }

  const allDay = formData.get('allDay') === 'true';
  const description = formData.get('description');
  const location = formData.get('location');
  const color = formData.get('color');
  const rrule = formData.get('rrule');
  const companyId = formData.get('companyId');
  const workspaceId = formData.get('workspaceId');
  const timezone =
    typeof formData.get('timezone') === 'string'
      ? (formData.get('timezone') as string)
      : Intl.DateTimeFormat().resolvedOptions().timeZone;

  const attendeeIdsRaw = formData.get('attendeeUserIds');
  const attendeeUserIds =
    typeof attendeeIdsRaw === 'string' && attendeeIdsRaw.length > 0
      ? attendeeIdsRaw.split(',').filter(Boolean)
      : undefined;

  const guestEmailsRaw = formData.get('guestEmails');
  const guestEmails =
    typeof guestEmailsRaw === 'string' && guestEmailsRaw.length > 0
      ? guestEmailsRaw
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      : undefined;

  const remindersRaw = formData.get('reminders');
  const reminders =
    typeof remindersRaw === 'string' && remindersRaw.length > 0
      ? remindersRaw
          .split(',')
          .map((m) => Number(m))
          .filter((n) => Number.isInteger(n) && n >= 0)
          // Cada lembrete escolhido pelo usuário dispara em todos os canais:
          // email + notification (in-app/Web Push). Cada canal respeita as
          // preferências do destinatário no momento da entrega.
          .flatMap((minutesBefore) => [
            { minutesBefore, method: 'email' as const },
            { minutesBefore, method: 'notification' as const },
          ])
      : undefined;

  const body: Record<string, unknown> = {
    title: title.trim(),
    startsAt,
    endsAt,
    allDay,
    timezone,
  };
  if (typeof description === 'string' && description.length > 0) body.description = description;
  if (typeof location === 'string' && location.length > 0) body.location = location;
  if (typeof color === 'string' && color.length > 0) body.color = color;
  if (typeof rrule === 'string' && rrule.length > 0) body.rrule = rrule;
  if (typeof companyId === 'string' && companyId.length > 0) body.companyId = companyId;
  if (typeof workspaceId === 'string' && workspaceId.length > 0) body.workspaceId = workspaceId;
  if (attendeeUserIds && attendeeUserIds.length > 0) body.attendeeUserIds = attendeeUserIds;
  if (guestEmails && guestEmails.length > 0) body.guestEmails = guestEmails;
  if (reminders && reminders.length > 0) body.reminders = reminders;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/calendar-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao criar evento' };
    }

    const event = await res.json().catch(() => null);

    if (typeof companyId === 'string' && companyId.length > 0) {
      revalidatePath(`/empresa/${companyId}/inicio`);
    }
    return { success: true, eventId: event?.id };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
