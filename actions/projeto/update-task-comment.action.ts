'use server';

import { getSession } from '@/lib/auth';

export interface UpdateCommentActionState {
  error?: string;
  success?: boolean;
}

export async function updateTaskCommentAction(
  projectId: string,
  taskId: string,
  commentId: string,
  content: string,
): Promise<UpdateCommentActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  if (!content.trim()) return { error: 'Comentário não pode ser vazio' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/comments/${commentId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao editar comentário' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  return { success: true };
}
