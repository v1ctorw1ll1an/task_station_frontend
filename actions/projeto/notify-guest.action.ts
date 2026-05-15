'use server';

import { getSession } from '@/lib/auth';

export async function notifyGuestAction(
  projectId: string,
  taskId: string,
  guestId: string,
  historyEntryIds: string[],
): Promise<{ whatsappUrl?: string; publicUrl?: string; fields?: string[]; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/guests/${guestId}/notify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ historyEntryIds }),
      },
    );
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      return { error: message ?? 'Erro ao gerar mensagem' };
    }
    const data = (await res.json()) as {
      whatsappUrl: string;
      publicUrl: string;
      fields: string[];
    };
    return data;
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
