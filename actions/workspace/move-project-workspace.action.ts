'use server';

import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function moveProjectToWorkspaceAction(
  fromWorkspaceId: string,
  projectId: string,
  targetWorkspaceId: string,
): Promise<{ error?: string; projectId?: string; newWorkspaceId?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Não autenticado' };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/workspace/${fromWorkspaceId}/projetos/${projectId}/mover`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetWorkspaceId }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.message ?? 'Erro ao mover projeto' };
    }

    revalidatePath(`/workspace/${fromWorkspaceId}/projetos`);
    revalidatePath(`/workspace/${targetWorkspaceId}/projetos`);

    return await res.json();
  } catch {
    return { error: 'Erro de conexão' };
  }
}
