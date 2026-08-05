'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { consumeFirstAccessSchema } from '@/lib/schemas/consume-first-access.schema';

export interface ConsumeFirstAccessActionState {
  error?: string;
}

export async function consumeFirstAccessAction(
  token: string,
  _prev: ConsumeFirstAccessActionState,
  formData: FormData,
): Promise<ConsumeFirstAccessActionState> {
  const raw = {
    name: formData.get('name'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = consumeFirstAccessSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  let data: {
    access_token: string;
    user: { id: string; email: string; isSuperuser: boolean; mustResetPassword: boolean };
  };

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/auth/first-access?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      },
    );

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? 'Token inválido ou expirado' };
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
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set('user', JSON.stringify(data.user), {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  // Dono recém-cadastrado cai direto na tela de planos após ativar a conta.
  // Só admin de empresa que ainda precisa de plano — convidado (membro) segue pro dashboard.
  let destination = '/dashboard';
  try {
    const res = await fetch(`${apiUrl}/api/v1/me/empresas`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const companies: Array<{
        companyId: string;
        role: string;
        needsSubscription?: boolean;
      }> = await res.json();
      const pending = companies.find((c) => c.role === 'admin' && c.needsSubscription);
      if (pending) destination = `/empresa/${pending.companyId}/cobranca`;
    }
  } catch {
    // Falha ao resolver empresa não impede o login — segue pro dashboard.
  }

  redirect(destination);
}
