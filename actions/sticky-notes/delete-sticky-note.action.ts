'use server';

import { getSession } from '@/lib/auth';

export async function deleteStickyNoteAction(id: string): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session) return { success: false };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/sticky-notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    });
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}
