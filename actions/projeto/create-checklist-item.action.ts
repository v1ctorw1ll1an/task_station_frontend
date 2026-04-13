'use server';

import { getSession } from '@/lib/auth';
import type { ChecklistItem } from './get-checklists.action';

export async function createChecklistItemAction(
  projectId: string,
  taskId: string,
  title: string,
): Promise<{ item?: ChecklistItem; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projetos/${projectId}/tasks/${taskId}/checklists`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ title }),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? 'Erro ao criar item' };
  }

  const item: ChecklistItem = await res.json();
  return { item };
}
