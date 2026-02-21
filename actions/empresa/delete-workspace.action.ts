'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function deleteWorkspaceAction(companyId: string, workspaceId: string) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/empresa/${companyId}/workspaces/${workspaceId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao excluir workspace' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/empresa/${companyId}/workspaces`);
  return { success: true };
}
