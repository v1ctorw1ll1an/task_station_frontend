'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface ToggleSuperuserActionState {
  error?: string;
  success?: boolean;
}

export async function toggleSuperuserAction(
  id: string,
  isSuperuser: boolean,
): Promise<ToggleSuperuserActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/usuarios/${id}/superusuario`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ isSuperuser }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao atualizar status' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/superadmin/usuarios/${id}`);
  return { success: true };
}
