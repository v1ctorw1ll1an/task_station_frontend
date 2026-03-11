'use server';

import { getSession } from '@/lib/auth';

export interface ProjectLabel {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export async function getLabelsAction(projectId: string): Promise<ProjectLabel[]> {
  const session = await getSession();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/projetos/${projectId}/labels`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
