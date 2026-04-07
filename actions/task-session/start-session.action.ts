'use server';

import { getSession } from '@/lib/auth';
import type { RawSession } from '@/lib/stores/task-tracking-store';

export interface StartSessionResult {
  data?: RawSession;
  error?: string;
}

export async function startSessionAction(taskId: string): Promise<StartSessionResult> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/task-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ taskId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.message ?? 'Erro ao iniciar sessão' };
    return { data };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
