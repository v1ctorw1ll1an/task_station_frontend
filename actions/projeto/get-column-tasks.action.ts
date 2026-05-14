'use server';

import { getSession } from '@/lib/auth';
import type { KanbanTask } from '@/components/workspace/kanban/kanban-card';

export interface ColumnTasksPage {
  tasks: KanbanTask[];
  total: number;
  page: number;
  limit: number;
}

export async function getColumnTasksAction(
  projectId: string,
  columnId: string,
  page: number,
  limit = 50,
): Promise<ColumnTasksPage | null> {
  const session = await getSession();
  if (!session) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const url = new URL(
      `${apiUrl}/api/v1/projetos/${projectId}/colunas/${columnId}/tasks`,
    );
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as ColumnTasksPage;
  } catch {
    return null;
  }
}
