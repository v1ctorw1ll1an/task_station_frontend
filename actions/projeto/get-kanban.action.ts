'use server';

import { getSession } from '@/lib/auth';
import type { KanbanColumn } from '@/components/workspace/kanban/kanban-board';

interface RawKanbanColumn extends Omit<KanbanColumn, 'totalTasks'> {
  _count?: { tasks: number };
}

interface RawKanbanResponse {
  columns: RawKanbanColumn[];
  projectName?: string;
}

export async function getKanbanDataAction(
  projectId: string,
): Promise<{ columns: KanbanColumn[]; projectName?: string } | null> {
  const session = await getSession();
  if (!session) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/kanban`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RawKanbanResponse;

    const columns: KanbanColumn[] = data.columns.map((c) => {
      const { _count, ...rest } = c;
      return { ...rest, totalTasks: _count?.tasks ?? rest.tasks.length };
    });

    return { columns, projectName: data.projectName };
  } catch {
    return null;
  }
}
