'use server';

import { getSession } from '@/lib/auth';

export interface GuestSearchResult {
  name: string;
  phoneE164: string;
  email: string | null;
}

export async function searchGuestsAction(
  projectId: string,
  taskId: string,
  q: string,
): Promise<{ results?: GuestSearchResult[]; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(`${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/guests/search`);
  if (q.trim().length > 0) url.searchParams.set('q', q.trim());

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: data.message ?? 'Erro ao buscar convidados' };
    }
    const results = (await res.json()) as GuestSearchResult[];
    return { results };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
