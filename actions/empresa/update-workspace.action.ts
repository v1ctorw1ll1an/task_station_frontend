'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { updateWorkspaceSchema } from '@/lib/schemas/update-workspace.schema';

export interface UpdateWorkspaceActionState {
  error?: string;
  success?: boolean;
}

export async function updateWorkspaceAction(
  _prev: UpdateWorkspaceActionState,
  formData: FormData,
): Promise<UpdateWorkspaceActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const companyId = formData.get('companyId');
  const workspaceId = formData.get('workspaceId');
  if (!companyId || typeof companyId !== 'string') return { error: 'Empresa inválida' };
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };

  const raw = {
    name: formData.get('name') || undefined,
    description: formData.get('description') || undefined,
  };

  const parsed = updateWorkspaceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/workspaces/${workspaceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao atualizar workspace' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/empresa/${companyId}/workspaces`);
  return { success: true };
}
