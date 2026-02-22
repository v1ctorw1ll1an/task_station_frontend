'use server';

import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function revokeCompanyAdminAction(
  companyId: string,
  membershipId: string,
  userId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Não autenticado' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(
    `${apiUrl}/api/v1/superadmin/empresas/${companyId}/membros/${membershipId}/inativar`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.token}` },
    },
  );

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { error: body.message ?? 'Erro ao revogar administrador' };
  }

  revalidatePath(`/superadmin/usuarios/${userId}`);
  revalidatePath(`/superadmin/empresas/${companyId}`);
  return {};
}
