'use server';

import { getSession } from '@/lib/auth';
import type { WorkspaceMember } from '@/components/workspace/kanban/kanban-board';

export async function getProjectMembrosAction(projectId: string): Promise<WorkspaceMember[]> {
  const session = await getSession();
  if (!session) return [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projetos/${projectId}/membros`,
      { headers: { Authorization: `Bearer ${session.token}` }, cache: 'no-store' },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
