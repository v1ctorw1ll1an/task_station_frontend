'use server';

import { getSession } from '@/lib/auth';

export async function reorderChecklistAction(
  projectId: string,
  taskId: string,
  items: { id: string; order: number }[],
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/checklists/reorder`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ items }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao reordenar checklist' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  return {};
}
