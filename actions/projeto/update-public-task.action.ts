'use server';

import type { PublicTask } from './get-public-task.action';

export interface UpdatePublicTaskFields {
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string | null;
  dueDate?: string | null;
  columnId?: string;
}

export async function updatePublicTaskAction(
  token: string,
  fields: UpdatePublicTaskFields,
): Promise<{ task?: PublicTask; error?: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/public/tasks/${encodeURIComponent(token)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      return { error: message ?? 'Erro ao atualizar task' };
    }
    const task = (await res.json()) as PublicTask;
    return { task };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
