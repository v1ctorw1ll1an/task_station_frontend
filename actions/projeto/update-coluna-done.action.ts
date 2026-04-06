'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface UpdateColunaDoneState {
  error?: string;
  success?: boolean;
}

export async function updateColunaDoneAction(
  projectId: string,
  columnId: string,
  workspaceId: string,
  isDone: boolean,
): Promise<UpdateColunaDoneState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/colunas/${columnId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ isDone }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao atualizar coluna' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
  return { success: true };
}
