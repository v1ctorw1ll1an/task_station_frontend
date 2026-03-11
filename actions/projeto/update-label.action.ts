'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface UpdateLabelActionState {
  error?: string;
  success?: boolean;
}

export async function updateLabelAction(
  _prev: UpdateLabelActionState,
  formData: FormData,
): Promise<UpdateLabelActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const projectId = formData.get('projectId');
  const workspaceId = formData.get('workspaceId');
  const labelId = formData.get('labelId');
  if (!projectId || typeof projectId !== 'string') return { error: 'Projeto inválido' };
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };
  if (!labelId || typeof labelId !== 'string') return { error: 'Label inválida' };

  const body: Record<string, unknown> = {};

  const name = formData.get('name');
  if (name && typeof name === 'string' && name.trim()) body.name = name.trim();

  const color = formData.get('color');
  if (color && typeof color === 'string' && color.trim()) body.color = color.trim();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/labels/${labelId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao atualizar label' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
  return { success: true };
}
