'use server';

import { getSession } from '@/lib/auth';

export async function deleteChecklistItemAction(
  projectId: string,
  taskId: string,
  checklistId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projetos/${projectId}/tasks/${taskId}/checklists/${checklistId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    },
  );

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? 'Erro ao remover item' };
  }

  return {};
}
