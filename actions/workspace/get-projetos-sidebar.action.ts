'use server';

import { getSession } from '@/lib/auth';

export interface SidebarProject {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  icon: string | null;
  iconColor: string | null;
}

export async function getWorkspaceProjectsForSidebar(
  workspaceId: string,
): Promise<SidebarProject[]> {
  const session = await getSession();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/workspace/${workspaceId}/projetos?limit=100&page=1`,
      {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}
