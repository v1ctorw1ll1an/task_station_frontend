'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface InvalidateCredentialsActionState {
  error?: string;
  magicLink?: string;
}

export async function invalidateCredentialsAction(
  userId: string,
): Promise<InvalidateCredentialsActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/superadmin/usuarios/${userId}/invalidar-credenciais`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? 'Erro ao invalidar credenciais' };
    }

    const body = (await res.json()) as { magicLink: string };
    revalidatePath(`/superadmin/usuarios/${userId}`);
    return { magicLink: body.magicLink };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
