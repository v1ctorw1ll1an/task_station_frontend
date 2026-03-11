'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { updateProjetoSchema } from '@/lib/schemas/update-projeto.schema';

export interface UpdateProjetoActionState {
  error?: string;
  success?: boolean;
}

export async function updateProjetoAction(
  _prev: UpdateProjetoActionState,
  formData: FormData,
): Promise<UpdateProjetoActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const workspaceId = formData.get('workspaceId');
  const projectId = formData.get('projectId');
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };
  if (!projectId || typeof projectId !== 'string') return { error: 'Projeto inválido' };

  const raw = {
    name: formData.get('name') || undefined,
    description: formData.get('description') || undefined,
  };

  const parsed = updateProjetoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/projetos/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao atualizar projeto' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/projetos`);
  revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
  return { success: true };
}
