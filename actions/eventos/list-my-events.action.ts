'use server';

import { getSession } from '@/lib/auth';
import type { CalendarEventOccurrence } from '@/lib/event-types';

export async function listMyEventsAction(
  fromDate: string,
  toDate: string,
  companyId?: string,
): Promise<{ data: CalendarEventOccurrence[] }> {
  const session = await getSession();
  if (!session) return { data: [] };

  const params = new URLSearchParams({ from: fromDate, to: toDate });
  if (companyId) params.set('companyId', companyId);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/calendar-events?${params}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return { data: [] };
  const data = (await res.json()) as CalendarEventOccurrence[];
  return { data };
}
