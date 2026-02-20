'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface DeleteCompanyActionState {
  error?: string;
  success?: boolean;
}

export async function deleteCompanyAction(
  id: string,
): Promise<DeleteCompanyActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/empresas/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao excluir empresa' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath('/superadmin/empresas');
  return { success: true };
}
