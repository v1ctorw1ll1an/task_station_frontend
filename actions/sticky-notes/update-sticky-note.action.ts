'use server';

import { getSession } from '@/lib/auth';
import type { StickyNoteColor } from '@/lib/stores/sticky-notes-store';

interface UpdatePayload {
  content?: string;
  color?: StickyNoteColor;
  x?: number;
  y?: number;
  visible?: boolean;
  minimized?: boolean;
  zIndex?: number;
}

export async function updateStickyNoteAction(
  id: string,
  payload: UpdatePayload,
): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session) return { success: false };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/sticky-notes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(payload),
    });
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}
