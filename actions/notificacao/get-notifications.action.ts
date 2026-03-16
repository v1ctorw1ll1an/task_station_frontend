'use server';
import { getSession } from '@/lib/auth';

export async function getNotificationsAction(page = 1, limit = 20, unreadOnly = false) {
  const session = await getSession();
  if (!session) return { data: [], total: 0, page, limit };

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (unreadOnly) params.set('unreadOnly', 'true');

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/notificacoes?${params}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return { data: [], total: 0, page, limit };
  return res.json();
}
