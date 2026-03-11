'use server';

import { getSession } from '@/lib/auth';

export interface CreateCommentActionState {
  error?: string;
  success?: boolean;
}

export async function createTaskCommentAction(
  _prev: CreateCommentActionState,
  formData: FormData,
): Promise<CreateCommentActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const projectId = formData.get('projectId');
  const taskId = formData.get('taskId');
  const content = formData.get('content');

  if (!projectId || typeof projectId !== 'string') return { error: 'Projeto inválido' };
  if (!taskId || typeof taskId !== 'string') return { error: 'Task inválida' };
  if (!content || typeof content !== 'string' || content.trim().length === 0)
    return { error: 'Comentário não pode ser vazio' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao criar comentário' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  return { success: true };
}
