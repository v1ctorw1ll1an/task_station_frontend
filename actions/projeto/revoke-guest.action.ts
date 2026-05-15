'use server';

import { getSession } from '@/lib/auth';

export async function revokeGuestAction(
  projectId: string,
  taskId: string,
  guestId: string,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/guests/${guestId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );
    if (!res.ok && res.status !== 204) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: data.message ?? 'Erro ao revogar convidado' };
    }
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
