'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface CreateTaskActionState {
  error?: string;
  success?: boolean;
  taskId?: string;
}

export async function createTaskAction(
  _prev: CreateTaskActionState,
  formData: FormData,
): Promise<CreateTaskActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const projectId = formData.get('projectId');
  const workspaceId = formData.get('workspaceId');
  if (!projectId || typeof projectId !== 'string') return { error: 'Projeto inválido' };
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };

  const title = formData.get('title');
  const columnId = formData.get('columnId');
  if (!title || typeof title !== 'string' || title.trim().length === 0)
    return { error: 'Título obrigatório' };
  if (!columnId || typeof columnId !== 'string') return { error: 'Coluna inválida' };

  const body: Record<string, unknown> = {
    title: title.trim(),
    columnId,
  };

  const description = formData.get('description');
  if (description && typeof description === 'string' && description.trim())
    body.description = description.trim();

  const priority = formData.get('priority');
  if (priority && typeof priority === 'string') body.priority = priority;

  const assigneeIds = formData.getAll('assigneeIds[]');
  if (assigneeIds.length) body.assigneeIds = assigneeIds.filter((id): id is string => typeof id === 'string');

  const startDate = formData.get('startDate');
  if (startDate && typeof startDate === 'string') body.startDate = startDate;

  const dueDate = formData.get('dueDate');
  if (dueDate && typeof dueDate === 'string') body.dueDate = dueDate;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao criar task' };
    }

    const task = await res.json().catch(() => null);
    revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
    return { success: true, taskId: task?.id };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
