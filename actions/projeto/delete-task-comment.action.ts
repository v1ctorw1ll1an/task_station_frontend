'use server';

import { getSession } from '@/lib/auth';

export interface DeleteCommentActionState {
  error?: string;
  success?: boolean;
}

export async function deleteTaskCommentAction(
  projectId: string,
  taskId: string,
  commentId: string,
): Promise<DeleteCommentActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/comments/${commentId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao excluir comentário' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  return { success: true };
}
