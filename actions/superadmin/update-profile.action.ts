'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  email: z.email('Email inválido').optional(),
  phone: z.string().optional(),
  newPassword: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres').optional(),
  confirmPassword: z.string().optional(),
});

export interface UpdateProfileActionState {
  error?: string;
  success?: boolean;
}

export async function updateProfileAction(
  _prev: UpdateProfileActionState,
  formData: FormData,
): Promise<UpdateProfileActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const raw = {
    name: (formData.get('name') as string | null)?.trim() || undefined,
    email: (formData.get('email') as string | null)?.trim() || undefined,
    phone: (formData.get('phone') as string | null)?.trim() || undefined,
    newPassword: (formData.get('newPassword') as string | null)?.trim() || undefined,
    confirmPassword: (formData.get('confirmPassword') as string | null)?.trim() || undefined,
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const { newPassword, confirmPassword, ...profileFields } = parsed.data;

  if (newPassword && newPassword !== confirmPassword) {
    return { error: 'As senhas não coincidem' };
  }

  const payload: Record<string, string> = {};
  if (profileFields.name) payload.name = profileFields.name;
  if (profileFields.email) payload.email = profileFields.email;
  if (profileFields.phone !== undefined) payload.phone = profileFields.phone;
  if (newPassword) payload.password = newPassword;

  if (Object.keys(payload).length === 0) {
    return { error: 'Nenhum campo foi alterado' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/perfil`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao atualizar perfil' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath('/superadmin/perfil');
  return { success: true };
}
