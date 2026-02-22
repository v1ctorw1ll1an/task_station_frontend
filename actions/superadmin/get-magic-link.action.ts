'use server';

import { getSession } from '@/lib/auth';

export interface GetMagicLinkActionState {
  error?: string;
  magicLink?: string | null;
}

export async function getMagicLinkAction(userId: string): Promise<GetMagicLinkActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/usuarios/${userId}/magic-link`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? 'Erro ao obter magic link' };
    }

    const body = (await res.json()) as { magicLink: string | null };
    return { magicLink: body.magicLink };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
