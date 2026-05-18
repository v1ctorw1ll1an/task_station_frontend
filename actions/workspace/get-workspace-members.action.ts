'use server';

import { getSession } from '@/lib/auth';

export interface WorkspaceMemberOption {
  id: string;
  name: string;
  photoUrl: string | null;
}

export async function getWorkspaceMembersAction(
  workspaceId: string,
): Promise<WorkspaceMemberOption[]> {
  const session = await getSession();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/workspace/${workspaceId}/membros?limit=200&page=1`,
      {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).map(
      (m: { user: { id: string; name: string; photoUrl: string | null } }) => ({
        id: m.user.id,
        name: m.user.name,
        photoUrl: m.user.photoUrl ?? null,
      }),
    );
  } catch {
    return [];
  }
}
