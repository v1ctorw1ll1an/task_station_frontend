'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export interface AceitarConviteActionState {
  error?: string;
}

/**
 * Aceita o convite e já deixa a empresa selecionada. Grava o mesmo cookie
 * `last_company_id` que `selectCompanyAction` usa — sem isso o usuário voltaria
 * ao seletor logo depois de entrar.
 */
export async function aceitarConviteAction(
  _prev: AceitarConviteActionState,
  formData: FormData,
): Promise<AceitarConviteActionState> {
  const token = formData.get('token');
  if (typeof token !== 'string' || !token) {
    return { error: 'Convite inválido' };
  }

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/convite/${token}`)}`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  let companyId: string;
  try {
    const res = await fetch(`${apiUrl}/api/v1/convites/${encodeURIComponent(token)}/aceitar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const message = Array.isArray(body.message) ? body.message[0] : body.message;
      return { error: message ?? 'Não foi possível aceitar o convite.' };
    }

    ({ companyId } = (await res.json()) as { companyId: string });
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  const cookieStore = await cookies();
  cookieStore.set('last_company_id', companyId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });

  redirect(`/empresa/${companyId}/inicio`);
}
