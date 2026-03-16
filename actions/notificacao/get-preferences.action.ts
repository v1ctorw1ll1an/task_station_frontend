'use server';
import { getSession } from '@/lib/auth';

export async function getPreferencesAction() {
  const session = await getSession();
  if (!session) return null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/notificacoes/preferencias`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return null;
  return res.json();
}
