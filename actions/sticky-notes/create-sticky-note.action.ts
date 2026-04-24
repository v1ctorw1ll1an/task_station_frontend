'use server';

import { getSession } from '@/lib/auth';
import type { StickyNote, StickyNoteColor } from '@/lib/stores/sticky-notes-store';

interface CreatePayload {
  content: string;
  color: StickyNoteColor;
  x: number;
  y: number;
  visible: boolean;
  minimized: boolean;
  zIndex: number;
}

export async function createStickyNoteAction(
  payload: CreatePayload,
): Promise<{ success: true; note: StickyNote } | { success: false }> {
  const session = await getSession();
  if (!session) return { success: false };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/sticky-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return {
      success: true,
      note: {
        id: data.id,
        content: data.content,
        color: data.color,
        x: data.x,
        y: data.y,
        visible: data.visible,
        minimized: data.minimized,
        zIndex: data.zIndex,
        createdAt: data.createdAt,
        linkedTasks: [],
      },
    };
  } catch {
    return { success: false };
  }
}
