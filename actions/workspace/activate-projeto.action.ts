'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function activateProjetoAction(workspaceId: string, projectId: string) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/workspace/${workspaceId}/projetos/${projectId}/ativar`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao reativar projeto' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/projetos`);
  return { success: true };
}
