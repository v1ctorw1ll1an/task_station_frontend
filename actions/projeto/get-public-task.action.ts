'use server';

export interface PublicTaskAssignee {
  name: string;
  photoUrl: string | null;
}

export interface PublicTaskLabel {
  name: string;
  color: string;
}

export interface PublicTaskChecklist {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface PublicTaskGuest {
  id: string;
  name: string;
  isYou: boolean;
}

export interface PublicTaskColumn {
  id: string;
  name: string;
  color: string | null;
  isDone: boolean;
}

export interface PublicTask {
  id: string;
  taskNumber: number | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string | null;
  dueDate: string | null;
  order: number;
  column: PublicTaskColumn;
  assignees: PublicTaskAssignee[];
  labels: PublicTaskLabel[];
  checklists: PublicTaskChecklist[];
  guests: PublicTaskGuest[];
  permissions: { canEdit: boolean };
}

export async function getPublicTaskAction(
  token: string,
): Promise<{ task?: PublicTask; error?: string; notFound?: boolean }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/public/tasks/${encodeURIComponent(token)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.status === 404) return { notFound: true };
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: data.message ?? 'Erro ao carregar task' };
    }
    const task = (await res.json()) as PublicTask;
    return { task };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
