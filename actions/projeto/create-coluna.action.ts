'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface CreateColunaActionState {
  error?: string;
  success?: boolean;
}

export async function createColunaAction(
  _prev: CreateColunaActionState,
  formData: FormData,
): Promise<CreateColunaActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const projectId = formData.get('projectId');
  const workspaceId = formData.get('workspaceId');
  const name = formData.get('name');

  if (!projectId || typeof projectId !== 'string') return { error: 'Projeto inválido' };
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };
  if (!name || typeof name !== 'string' || name.trim().length === 0)
    return { error: 'Nome obrigatório' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/colunas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao criar coluna' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
  return { success: true };
}
