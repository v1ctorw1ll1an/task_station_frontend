'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function restoreTaskAction(
  projectId: string,
  taskId: string,
  workspaceId: string,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/restore`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao restaurar task' };
    }

    revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
