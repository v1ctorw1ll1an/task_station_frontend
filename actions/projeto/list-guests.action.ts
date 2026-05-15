'use server';

import { getSession } from '@/lib/auth';

export interface TaskGuestSummary {
  id: string;
  name: string;
  phoneE164: string;
  email: string | null;
  invitedAt: string;
  lastAccessedAt: string | null;
}

export async function listGuestsAction(
  projectId: string,
  taskId: string,
): Promise<{ guests?: TaskGuestSummary[]; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/guests`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: data.message ?? 'Erro ao listar convidados' };
    }
    const guests = (await res.json()) as TaskGuestSummary[];
    return { guests };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
