'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function updateMemberAction(
  companyId: string,
  userId: string,
  isActive: boolean,
) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/membros/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ isActive }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao atualizar membro' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/empresa/${companyId}/membros`);
  return { success: true };
}
