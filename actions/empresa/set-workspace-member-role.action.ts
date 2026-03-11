'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export type WorkspaceMemberRole = 'workspace_admin' | 'project_admin' | 'member' | null;

export async function setWorkspaceMemberRoleAction(
  companyId: string,
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberRole,
) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/empresa/${companyId}/workspaces/${workspaceId}/membros/${userId}/role`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ role }),
      },
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? 'Erro ao atualizar papel' };
    }
    revalidatePath(`/empresa/${companyId}/membros`);
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
