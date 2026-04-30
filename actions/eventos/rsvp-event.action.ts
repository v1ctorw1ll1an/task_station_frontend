'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import type { AttendeeStatus } from '@/lib/event-types';

export async function rsvpEventAction(
  eventId: string,
  status: AttendeeStatus,
  companyId?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Sessão expirada' };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/calendar-events/${eventId}/rsvp`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message ?? 'Erro ao responder convite' };
    }
    if (companyId) revalidatePath(`/empresa/${companyId}/inicio`);
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao conectar com o servidor' };
  }
}
