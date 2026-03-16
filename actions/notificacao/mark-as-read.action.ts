'use server';
import { getSession } from '@/lib/auth';

export async function markAsReadAction(id: string) {
  const session = await getSession();
  if (!session) return;

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/notificacoes/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${session.token}` },
  });
}
