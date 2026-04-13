'use server';

import { getSession } from '@/lib/auth';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  createdById: string;
  createdAt: string;
}

export async function getChecklistsAction(
  projectId: string,
  taskId: string,
): Promise<ChecklistItem[]> {
  const session = await getSession();
  if (!session) return [];

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projetos/${projectId}/tasks/${taskId}/checklists`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return [];
  return res.json();
}
