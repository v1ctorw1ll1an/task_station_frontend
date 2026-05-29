'use server';

import { getSession } from '@/lib/auth';

export async function previewNotifyAction(
  projectId: string,
  taskId: string,
  historyEntryIds: string[],
): Promise<{ message?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/guests/notify/preview`,
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
      return { error: message ?? 'Erro ao gerar resumo' };
    }
    const data = (await res.json()) as { message: string };
    return { message: data.message };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
