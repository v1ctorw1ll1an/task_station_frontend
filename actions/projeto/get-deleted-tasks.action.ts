'use server';

import { getSession } from '@/lib/auth';

export interface DeletedTask {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  startDate: string | null;
  deletedAt: string;
  column: { id: string; name: string };
  taskAssignees: { user: { id: string; name: string } }[];
  taskLabels: { label: { id: string; name: string; color: string } }[];
}

export async function getDeletedTasksAction(
  projectId: string,
): Promise<{ data?: DeletedTask[]; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/tasks/deleted`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao buscar tasks deletadas' };
    }

    const data = await res.json();
    return { data };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
