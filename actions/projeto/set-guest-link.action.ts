'use server';

import { getSession } from '@/lib/auth';

export async function setGuestLinkAction(
  projectId: string,
  taskId: string,
  guestId: string,
  enabled: boolean,
): Promise<{ linkEnabled?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/guests/${guestId}/link`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ enabled }),
      },
    );
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: data.message ?? 'Erro ao atualizar o link' };
    }
    const data = (await res.json()) as { linkEnabled: boolean };
    return { linkEnabled: data.linkEnabled };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
