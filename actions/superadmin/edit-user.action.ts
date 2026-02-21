'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface EditUserActionState {
  error?: string;
  success?: boolean;
}

export async function editUserAction(
  _prev: EditUserActionState,
  formData: FormData,
): Promise<EditUserActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const id = formData.get('id') as string;
  if (!id) return { error: 'ID do usuário não informado' };

  const payload: Record<string, string> = {};

  const name = formData.get('name') as string | null;
  const email = formData.get('email') as string | null;
  const phone = formData.get('phone') as string | null;
  const password = formData.get('password') as string | null;

  if (name?.trim()) payload.name = name.trim();
  if (email?.trim()) payload.email = email.trim();
  if (phone?.trim()) payload.phone = phone.trim();
  if (password?.trim()) {
    if (password.trim().length < 8) {
      return { error: 'A senha deve ter no mínimo 8 caracteres' };
    }
    payload.password = password.trim();
  }

  if (Object.keys(payload).length === 0) {
    return { error: 'Nenhum campo foi alterado' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/usuarios/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(payload),
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
