'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { extractActionError } from '@/lib/action-error';
import type { GoogleSyncDirection, GoogleSyncPanel } from './google-sync-types';

export async function getGoogleSyncPanelAction(): Promise<{
  data?: GoogleSyncPanel;
  error?: string;
}> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/superadmin/integrations/google`,
      { headers: { Authorization: `Bearer ${session.token}` }, cache: 'no-store' },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: extractActionError(data, 'Erro ao carregar a integração').message };
    }
    return { data: (await res.json()) as GoogleSyncPanel };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function setGoogleSyncDirectionAction(direction: GoogleSyncDirection): Promise<{
  data?: GoogleSyncPanel;
  error?: string;
}> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/superadmin/integrations/google/direction`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ direction }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: extractActionError(data, 'Erro ao salvar a direção').message };
    }
    revalidatePath('/superadmin/integracoes');
    return { data: (await res.json()) as GoogleSyncPanel };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
