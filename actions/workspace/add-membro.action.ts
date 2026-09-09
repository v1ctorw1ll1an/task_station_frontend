'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { extractActionError } from '@/lib/action-error';
import { z } from 'zod';

const addMembroSchema = z.object({
  userId: z.string().uuid('UUID inválido'),
});

export interface AddMembroActionState {
  error?: string;
  /** true quando o plano está sem usuário livre — a tela oferece os planos. */
  seatLimit?: boolean;
  success?: boolean;
}

export async function addMembroAction(
  _prev: AddMembroActionState,
  formData: FormData,
): Promise<AddMembroActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const workspaceId = formData.get('workspaceId');
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };

  const parsed = addMembroSchema.safeParse({ userId: formData.get('userId') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/membros`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ userId: parsed.data.userId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // Entrar no workspace faz a pessoa entrar na empresa, e isso ocupa assento:
      // este fluxo pode devolver SEAT_LIMIT.
      const { message, seatLimit } = extractActionError(body, 'Erro ao adicionar membro');
      return { error: message, seatLimit };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/membros`);
  return { success: true };
}
