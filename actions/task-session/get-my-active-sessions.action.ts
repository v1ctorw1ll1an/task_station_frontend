'use server';

import { getSession } from '@/lib/auth';
import type { RawSession } from '@/lib/stores/task-tracking-store';

export async function getMyActiveSessionsAction(): Promise<RawSession[]> {
  const session = await getSession();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/task-sessions/mine/active`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
