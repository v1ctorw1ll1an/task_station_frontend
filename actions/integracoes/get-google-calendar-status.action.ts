'use server';

import { getSession } from '@/lib/auth';
import type { GoogleCalendarStatus } from './google-calendar-types';

export async function getGoogleCalendarStatusAction(): Promise<{
  data?: GoogleCalendarStatus;
  error?: string;
}> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/google`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao carregar a integração' };
    }
    return { data: (await res.json()) as GoogleCalendarStatus };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
