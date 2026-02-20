'use server';

import { redirect } from 'next/navigation';
import { confirmResetPasswordSchema } from '@/lib/schemas/confirm-reset-password.schema';

export interface ConfirmResetPasswordActionState {
  error?: string;
}

export async function confirmResetPasswordAction(
  _prev: ConfirmResetPasswordActionState,
  formData: FormData,
): Promise<ConfirmResetPasswordActionState> {
  const raw = {
    token: formData.get('token'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const token = raw.token as string | null;
  if (!token) {
    return { error: 'Token inválido ou expirado' };
  }

  const parsed = confirmResetPasswordSchema.safeParse({
    newPassword: raw.newPassword,
    confirmPassword: raw.confirmPassword,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      }),
    });

    if (!res.ok) {
      return { error: 'Token inválido ou expirado' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  redirect('/login?reset=success');
}
