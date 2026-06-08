'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface UpdateTaskActionState {
  error?: string;
  success?: boolean;
  conflict?: boolean;
  updatedAt?: string;
}

export async function updateTaskAction(
  _prev: UpdateTaskActionState,
  formData: FormData,
): Promise<UpdateTaskActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const projectId = formData.get('projectId');
  const workspaceId = formData.get('workspaceId');
  const taskId = formData.get('taskId');
  if (!projectId || typeof projectId !== 'string') return { error: 'Projeto inválido' };
  if (!workspaceId || typeof workspaceId !== 'string') return { error: 'Workspace inválido' };
  if (!taskId || typeof taskId !== 'string') return { error: 'Task inválida' };

  const body: Record<string, unknown> = {};

  const title = formData.get('title');
  if (title && typeof title === 'string' && title.trim()) body.title = title.trim();

  const description = formData.get('description');
  if (description !== null && typeof description === 'string')
    body.description = description.trim() || null;

  const priority = formData.get('priority');
  if (priority && typeof priority === 'string') body.priority = priority;

  const assigneeIds = formData.getAll('assigneeIds[]');
  body.assigneeIds = assigneeIds.filter((id): id is string => typeof id === 'string');

  const startDate = formData.get('startDate');
  if (startDate !== null && typeof startDate === 'string')
    body.startDate = startDate || null;

  const dueDate = formData.get('dueDate');
  if (dueDate !== null && typeof dueDate === 'string')
    body.dueDate = dueDate || null;

  const allDay = formData.get('allDay');
  if (allDay !== null && typeof allDay === 'string') body.allDay = allDay === 'true';

  const timezone = formData.get('timezone');
  if (timezone && typeof timezone === 'string') body.timezone = timezone;

  const labelIds = formData.getAll('labelIds[]');
  body.labelIds = labelIds.filter((id): id is string => typeof id === 'string');

  const lastKnownUpdatedAt = formData.get('lastKnownUpdatedAt');
  if (lastKnownUpdatedAt && typeof lastKnownUpdatedAt === 'string') {
    body.lastKnownUpdatedAt = lastKnownUpdatedAt;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        return { conflict: true, error: data.message ?? 'Conflito de edição detectado' };
      }
      return { error: data.message ?? 'Erro ao atualizar task' };
    }

    const responseData = await res.json().catch(() => ({}));
    revalidatePath(`/workspace/${workspaceId}/projetos/${projectId}`);
    return { success: true, updatedAt: responseData.updatedAt };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
