'use server';

import { getSession } from '@/lib/auth';

/**
 * Marca o tutorial como visto. Silencioso de propósito: se falhar, o pior que
 * acontece é o tour reaparecer no próximo acesso — não vale interromper o usuário
 * com um erro por causa disso.
 */
export async function completeTutorialAction(): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/me/tutorial/concluir`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
