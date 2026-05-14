'use server';

import { getSession } from '@/lib/auth';

export async function getMyTasksAction(
  companyId: string,
  page = 1,
  limit = 20,
  filter?: string,
  dueDateFrom?: string,
  dueDateTo?: string,
  startDateFrom?: string,
  startDateTo?: string,
) {
  const session = await getSession();
  if (!session) return { data: [], total: 0, page, limit };

  const params = new URLSearchParams({
    companyId,
    page: String(page),
    limit: String(limit),
  });
  if (filter) params.set('filter', filter);
  if (dueDateFrom) params.set('dueDateFrom', dueDateFrom);
  if (dueDateTo) params.set('dueDateTo', dueDateTo);
  if (startDateFrom) params.set('startDateFrom', startDateFrom);
  if (startDateTo) params.set('startDateTo', startDateTo);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/tasks?${params}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return { data: [], total: 0, page, limit };
  return res.json();
}
