'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createProjetoSchema } from '@/lib/schemas/create-projeto.schema';

export interface CreateProjetoActionState {
  error?: string;
  success?: boolean;
  projectId?: string;
}

export async function createProjetoAction(
  _prev: CreateProjetoActionState,
  formData: FormData,
): Promise<CreateProjetoActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const workspaceId = formData.get('workspaceId');
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };

  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  };

  const parsed = createProjetoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/projetos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao criar projeto' };
    }

    const body = await res.json().catch(() => ({}));
    revalidatePath(`/workspace/${workspaceId}/projetos`);
    return { success: true, projectId: body.project?.id };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
