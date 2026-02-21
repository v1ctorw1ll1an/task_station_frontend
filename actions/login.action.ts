'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema } from '@/lib/schemas/login.schema';

export interface LoginActionState {
  error?: string;
}

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  let data: { access_token: string; user: { id: string; email: string; isSuperuser: boolean; mustResetPassword: boolean } };

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      return { error: 'Credenciais inválidas' };
    }

    data = await res.json();
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set('access_token', data.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  cookieStore.set('user', JSON.stringify(data.user), {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  if (data.user.mustResetPassword) {
    redirect('/first-access');
  }

  if (data.user.isSuperuser) {
    redirect('/superadmin/empresas');
  }

  redirect('/dashboard');
}
