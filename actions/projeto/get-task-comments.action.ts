'use server';

import { getSession } from '@/lib/auth';

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export async function getTaskCommentsAction(
  projectId: string,
  taskId: string,
): Promise<TaskComment[]> {
  const session = await getSession();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/comments`,
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
