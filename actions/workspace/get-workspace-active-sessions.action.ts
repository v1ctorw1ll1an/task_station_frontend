'use server';

import { getSession } from '@/lib/auth';
import type { RawSession } from '@/lib/stores/task-tracking-store';

export interface WorkspaceActiveSessionsResult {
  sessions: RawSession[];
  forbidden?: boolean;
  error?: string;
}

export async function getWorkspaceActiveSessionsAction(
  workspaceId: string,
): Promise<WorkspaceActiveSessionsResult> {
  const session = await getSession();
  if (!session) return { sessions: [], error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/task-sessions/active`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });

    if (res.status === 403) return { sessions: [], forbidden: true };
    if (!res.ok) return { sessions: [], error: 'Erro ao carregar sessões ativas' };
    const sessions: RawSession[] = await res.json();
    return { sessions };
  } catch {
    return { sessions: [], error: 'Erro ao conectar com o servidor' };
  }
}
