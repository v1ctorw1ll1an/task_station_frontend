'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function promoteAdminAction(workspaceId: string, userId: string) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao promover membro' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/workspace/${workspaceId}/membros`);
  return { success: true };
}
