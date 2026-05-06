'use server';

import { getSession } from '@/lib/auth';
import type { KanbanTask } from '@/components/workspace/kanban/kanban-card';

export async function getTaskByIdAction(
  projectId: string,
  taskId: string,
): Promise<KanbanTask | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projetos/${projectId}/tasks/${taskId}`,
      { headers: { Authorization: `Bearer ${session.token}` }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
