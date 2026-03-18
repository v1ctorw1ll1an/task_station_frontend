'use server';

import { getSession } from '@/lib/auth';

export interface OverviewAssignee {
  id: string;
  name: string;
  photoUrl: string | null;
}

export interface OverviewTask {
  id: string;
  taskNumber: number | null;
  taskRef: string | null;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  columnId: string;
  assignees: OverviewAssignee[];
}

export interface OverviewColumn {
  id: string;
  name: string;
  color: string | null;
  order: number;
  taskCount: number;
  tasks: OverviewTask[];
}

export interface OverviewProject {
  id: string;
  name: string;
  icon: string | null;
  iconColor: string | null;
  taskPrefix: string;
  totalTasks: number;
  columns: OverviewColumn[];
}

export async function getWorkspaceOverviewAction(
  workspaceId: string,
): Promise<{ data: OverviewProject[]; error?: string }> {
  const session = await getSession();
  if (!session) return { data: [], error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/visao-geral`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });

    if (!res.ok) return { data: [], error: 'Erro ao buscar visão geral' };
    const data: OverviewProject[] = await res.json();
    return { data };
  } catch {
    return { data: [], error: 'Erro ao conectar com o servidor' };
  }
}
