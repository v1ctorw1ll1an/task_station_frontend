'use server';

import { getSession } from '@/lib/auth';

export async function updatePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/me/perfil/senha`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao alterar senha' };
    }
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
