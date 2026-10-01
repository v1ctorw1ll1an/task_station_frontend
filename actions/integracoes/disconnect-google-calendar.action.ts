'use server';

import { getSession } from '@/lib/auth';
import { extractActionError } from '@/lib/action-error';

export async function disconnectGoogleCalendarAction(): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/google`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: extractActionError(data, 'Erro ao desconectar').message };
    }
    return {};
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
