'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function revokeAdminAction(companyId: string, userId: string) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/admins/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao revogar administrador' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/empresa/${companyId}/membros`);
  return { success: true };
}
