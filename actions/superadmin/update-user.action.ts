'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface UpdateUserActionState {
  error?: string;
  success?: boolean;
}

export async function updateUserAction(
  id: string,
  isActive: boolean,
): Promise<UpdateUserActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/usuarios/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ isActive }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao atualizar usuário' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath('/superadmin/usuarios');
  return { success: true };
}
