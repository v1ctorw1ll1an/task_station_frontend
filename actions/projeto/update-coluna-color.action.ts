'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface UpdateColunaColorState {
  error?: string;
  success?: boolean;
}

export async function updateColunaColorAction(
  projectId: string,
  columnId: string,
  workspaceId: string,
  color: string | null,
): Promise<UpdateColunaColorState> {
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
      body: JSON.stringify({ color: color ?? null }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao atualizar cor da coluna' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
  return { success: true };
}
