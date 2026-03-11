'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface CreateLabelActionState {
  error?: string;
  success?: boolean;
}

export async function createLabelAction(
  _prev: CreateLabelActionState,
  formData: FormData,
): Promise<CreateLabelActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const projectId = formData.get('projectId');
  const workspaceId = formData.get('workspaceId');
  if (!projectId || typeof projectId !== 'string') return { error: 'Projeto inválido' };
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };

  const name = formData.get('name');
  if (!name || typeof name !== 'string' || !name.trim()) return { error: 'Nome obrigatório' };

  const body: Record<string, unknown> = { name: name.trim() };

  const color = formData.get('color');
  if (color && typeof color === 'string' && color.trim()) body.color = color.trim();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao criar label' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
  return { success: true };
}
