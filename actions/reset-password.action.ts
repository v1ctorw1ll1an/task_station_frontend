'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resetPasswordSchema } from '@/lib/schemas/reset-password.schema';
import { SessionUser } from '@/lib/auth';

export interface ResetPasswordActionState {
  error?: string;
}

export async function resetPasswordAction(
  _prev: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const raw = {
    name: formData.get('name') || undefined,
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: parsed.data.name || undefined,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      }),
    });

    if (!res.ok) {
      return { error: 'Erro ao redefinir senha' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  // Atualiza o cookie user com mustResetPassword: false
  const userRaw = cookieStore.get('user')?.value;
  if (userRaw) {
    const user = JSON.parse(userRaw) as SessionUser;
    const isProduction = process.env.NODE_ENV === 'production';
    cookieStore.set('user', JSON.stringify({ ...user, mustResetPassword: false }), {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  redirect('/dashboard');
}
