'use server';
import { getSession } from '@/lib/auth';

export async function deleteNotificationAction(id: string) {
  const session = await getSession();
  if (!session) return;

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/notificacoes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.token}` },
  });
}
