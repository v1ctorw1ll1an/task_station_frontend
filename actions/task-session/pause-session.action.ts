'use server';

import { getSession } from '@/lib/auth';
import type { RawSession } from '@/lib/stores/task-tracking-store';

export interface SessionActionResult {
  data?: RawSession;
  error?: string;
}

export async function pauseSessionAction(sessionId: string): Promise<SessionActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/task-sessions/${sessionId}/pause`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.message ?? 'Erro ao pausar sessão' };
    return { data };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
