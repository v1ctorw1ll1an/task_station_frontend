'use server';

import { getSession } from '@/lib/auth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export async function getProfileAction(): Promise<{ data?: UserProfile; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/me/perfil`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao carregar perfil' };
    }
    return { data: await res.json() };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
