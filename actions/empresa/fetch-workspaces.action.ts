'use server';
import { getSession } from '@/lib/auth';

export interface WorkspaceItem {
  id: string;
  name: string;
}

export async function fetchWorkspacesAction(
  companyId: string,
  page: number,
  search?: string,
): Promise<{ data: WorkspaceItem[]; total: number }> {
  const session = await getSession();
  if (!session) return { data: [], total: 0 };

  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) params.set('search', search);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/empresa/${companyId}/workspaces?${params}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return { data: [], total: 0 };
  const json = await res.json() as { data: WorkspaceItem[]; total: number };
  return { data: json.data ?? [], total: json.total ?? 0 };
}
