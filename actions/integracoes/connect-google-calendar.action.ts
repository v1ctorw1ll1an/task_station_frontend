'use server';

import { getSession } from '@/lib/auth';
import { extractActionError } from '@/lib/action-error';

/** Devolve a URL de consentimento do Google; o cliente redireciona para ela. */
export async function connectGoogleCalendarAction(): Promise<{ url?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/google/connect`,
      { headers: { Authorization: `Bearer ${session.token}` }, cache: 'no-store' },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: extractActionError(data, 'Não foi possível iniciar a conexão').message };
    }
    return { url: (data as { url: string }).url };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
