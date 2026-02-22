'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createWorkspaceSchema } from '@/lib/schemas/create-workspace.schema';

export interface CreateWorkspaceActionState {
  error?: string;
  success?: boolean;
}

export async function createWorkspaceAction(
  _prev: CreateWorkspaceActionState,
  formData: FormData,
): Promise<CreateWorkspaceActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const companyId = formData.get('companyId');
  if (!companyId || typeof companyId !== 'string') return { error: 'Empresa inválida' };

  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    adminEmail: formData.get('adminEmail'),
  };

  const parsed = createWorkspaceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao criar workspace' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/empresa/${companyId}/workspaces`);
  return { success: true };
}
