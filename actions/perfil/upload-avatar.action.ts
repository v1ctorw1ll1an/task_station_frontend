'use server';

import { getSession } from '@/lib/auth';

export async function uploadAvatarAction(
  formData: FormData,
): Promise<{ photoUrl?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/me/perfil/foto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao enviar foto' };
    }
    const data = await res.json();
    const raw: string = data.photoUrl;
    const photoUrl = raw.startsWith('http')
      ? raw
      : `${process.env.NEXT_PUBLIC_API_URL}${raw}`;
    return { photoUrl };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
