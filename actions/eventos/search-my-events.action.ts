'use server';

import { getSession } from '@/lib/auth';
import type { CalendarEventOccurrence } from '@/lib/event-types';

/**
 * Busca eventos por título e retorna as próximas ocorrências (hoje → +12m),
 * como a busca do Google Calendar.
 */
export async function searchMyEventsAction(
  q: string,
  companyId?: string,
): Promise<{ data: CalendarEventOccurrence[] }> {
  const session = await getSession();
  if (!session) return { data: [] };

  const term = q.trim();
  if (term.length < 2) return { data: [] };

  const params = new URLSearchParams({ q: term });
  if (companyId) params.set('companyId', companyId);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/calendar-events/search?${params}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return { data: [] };
  const data = (await res.json()) as CalendarEventOccurrence[];
  return { data };
}
