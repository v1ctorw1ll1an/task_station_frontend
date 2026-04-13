'use server';

import { getSession } from '@/lib/auth';

export async function updateChecklistItemAction(
  projectId: string,
  taskId: string,
  checklistId: string,
  dto: { title?: string; completed?: boolean },
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projetos/${projectId}/tasks/${taskId}/checklists/${checklistId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(dto),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? 'Erro ao atualizar item' };
  }

  return {};
}
