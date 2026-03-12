'use server';

import { getSession } from '@/lib/auth';

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  photoUrl?: string;
}

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/me/perfil`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao atualizar perfil' };
    }
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
