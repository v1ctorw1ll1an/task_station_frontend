'use server';
import { getSession } from '@/lib/auth';

export async function getUnreadCountAction(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/notificacoes/unread-count`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return 0;
  const { count } = await res.json();
  return count as number;
}
