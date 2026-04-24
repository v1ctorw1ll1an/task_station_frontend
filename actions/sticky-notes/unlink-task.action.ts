'use server';

import { getSession } from '@/lib/auth';

export async function unlinkTaskFromNoteAction(
  noteId: string,
  taskId: string,
): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session) return { success: false };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/sticky-notes/${noteId}/tasks/${taskId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}
