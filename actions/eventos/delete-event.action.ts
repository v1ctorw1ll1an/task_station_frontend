'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import type { EventMutationScope } from '@/lib/event-types';

export async function deleteEventAction(
  eventId: string,
  scope: EventMutationScope = 'all',
  originalDate?: string,
  companyId?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Sessão expirada' };

  const params = new URLSearchParams({ scope });
  if (originalDate) params.set('originalDate', originalDate);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/calendar-events/${eventId}?${params}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message ?? 'Erro ao deletar evento' };
    }
    if (companyId) revalidatePath(`/empresa/${companyId}/inicio`);
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao conectar com o servidor' };
  }
}
