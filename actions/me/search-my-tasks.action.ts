'use server';

import { getSession } from '@/lib/auth';
import type { TaskDueCardData } from '@/components/home/task-due-card';

/** Busca tasks do usuário na empresa por título (em qualquer data). */
export async function searchMyTasksAction(
  companyId: string,
  q: string,
  limit = 20,
): Promise<{ data: TaskDueCardData[] }> {
  const session = await getSession();
  if (!session) return { data: [] };

  const term = q.trim();
  if (term.length < 2) return { data: [] };

  const params = new URLSearchParams({
    companyId,
    search: term,
    limit: String(limit),
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/tasks?${params}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return { data: [] };
  const json = (await res.json()) as { data: TaskDueCardData[] };
  return { data: json.data ?? [] };
}
