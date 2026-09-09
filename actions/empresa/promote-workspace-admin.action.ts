'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { extractActionError } from '@/lib/action-error';

export async function promoteWorkspaceAdminAction(
  companyId: string,
  workspaceId: string,
  userId: string,
) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/empresa/${companyId}/workspaces/${workspaceId}/admins`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ userId }),
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // Entrar na empresa ocupa assento: este fluxo pode devolver SEAT_LIMIT, e a
      // tela precisa da flag para oferecer os planos em vez de só mostrar o texto.
      const { message, seatLimit } = extractActionError(body, 'Erro ao promover admin de workspace');
      return { error: message, seatLimit };
    }
    revalidatePath(`/empresa/${companyId}/membros`);
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
