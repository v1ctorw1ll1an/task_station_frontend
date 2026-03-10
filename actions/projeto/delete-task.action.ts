'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function deleteTaskAction(
  projectId: string,
  taskId: string,
  workspaceId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao excluir task' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
  return { success: true };
}
