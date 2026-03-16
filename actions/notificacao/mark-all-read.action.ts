'use server';
import { getSession } from '@/lib/auth';

export async function markAllReadAction() {
  const session = await getSession();
  if (!session) return;

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/notificacoes/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${session.token}` },
  });
}
