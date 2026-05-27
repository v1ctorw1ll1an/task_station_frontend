'use server';

import { getSession } from '@/lib/auth';

export interface TaskHistoryEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  user: { id: string; name: string; email: string; photoUrl: string | null };
}

export interface TaskHistoryPage {
  data: TaskHistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const EMPTY: TaskHistoryPage = { data: [], total: 0, page: 1, limit: 20, totalPages: 1 };

export async function getTaskHistoryAction(
  projectId: string,
  taskId: string,
  page = 1,
  limit = 20,
): Promise<TaskHistoryPage> {
  const session = await getSession();
  if (!session) return EMPTY;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/history?${qs}`,
      {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return EMPTY;
    return res.json();
  } catch {
    return EMPTY;
  }
}
