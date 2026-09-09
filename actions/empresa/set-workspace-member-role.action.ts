'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { extractActionError } from '@/lib/action-error';

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
      const body = await res.json().catch(() => ({}));
      // Dar acesso a quem ainda não é da empresa ocupa assento — pode vir SEAT_LIMIT.
      const { message, seatLimit } = extractActionError(body, 'Erro ao atualizar papel');
      return { error: message, seatLimit };
    }
    revalidatePath(`/empresa/${companyId}/membros`);
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
