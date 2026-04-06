'use server';

import { getSession } from '@/lib/auth';

export interface TransferTaskPayload {
  mode: 'copy' | 'cut';
  targetProjectId: string;
  targetColumnId: string;
  includeAssignees?: boolean;
  includeLabels?: 'skip' | 'match' | 'create';
  includeComments?: boolean;
  includeAttachments?: boolean;
  includeHistory?: boolean;
  includeDates?: boolean;
}

export interface TransferTaskResult {
  task: Record<string, unknown>;
  skippedAssignees: string[];
}

export async function transferTaskAction(
  projectId: string,
  taskId: string,
  payload: TransferTaskPayload,
): Promise<{ error?: string; data?: TransferTaskResult }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/transfer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao transferir task' };
    }

    const data = await res.json();
    return { data };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
