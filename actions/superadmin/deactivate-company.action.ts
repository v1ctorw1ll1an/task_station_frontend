'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface DeactivateCompanyActionState {
  error?: string;
  success?: boolean;
}

export async function deactivateCompanyAction(
  id: string,
): Promise<DeactivateCompanyActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/empresas/${id}/inativar`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao inativar empresa' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath('/superadmin/empresas');
  return { success: true };
}
