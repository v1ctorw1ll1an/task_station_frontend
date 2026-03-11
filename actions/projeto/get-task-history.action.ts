'use server';

import { getSession } from '@/lib/auth';

export interface TaskHistoryEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  user: { id: string; name: string };
}

export async function getTaskHistoryAction(
  projectId: string,
  taskId: string,
): Promise<TaskHistoryEntry[]> {
  const session = await getSession();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/history`,
      {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
