'use server';

import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function deactivateMembershipAction(
  companyId: string,
  membershipId: string,
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
    const body = await res.json().catch(() => ({}));
    return { error: body.message ?? 'Erro ao inativar administrador' };
  }

  revalidatePath(`/superadmin/empresas/${companyId}`);
  return {};
}
