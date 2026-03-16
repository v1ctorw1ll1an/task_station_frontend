'use server';

import { getSession } from '@/lib/auth';
import type { KanbanColumn } from '@/components/workspace/kanban/kanban-board';

export async function getKanbanDataAction(
  projectId: string,
): Promise<{ columns: KanbanColumn[] } | null> {
  const session = await getSession();
  if (!session) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/kanban`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
