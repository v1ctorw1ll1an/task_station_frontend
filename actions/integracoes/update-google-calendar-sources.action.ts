'use server';

import { getSession } from '@/lib/auth';
import { extractActionError } from '@/lib/action-error';
import type { GoogleCalendarStatus } from './google-calendar-types';

export async function updateGoogleCalendarSourcesAction(
  sources: { sourceId: string; importEnabled: boolean }[],
): Promise<{ data?: GoogleCalendarStatus; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/google/sources`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ sources }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: extractActionError(data, 'Erro ao salvar calendários').message };
    return { data: data as GoogleCalendarStatus };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
