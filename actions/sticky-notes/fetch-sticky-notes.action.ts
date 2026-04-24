'use server';

import { getSession } from '@/lib/auth';
import type { StickyNote, StickyNoteColor } from '@/lib/stores/sticky-notes-store';

interface ApiNote {
  id: string;
  content: string;
  color: StickyNoteColor;
  x: number;
  y: number;
  visible: boolean;
  minimized: boolean;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
  taskLinks: Array<{
    task: {
      id: string;
      title: string;
      taskNumber: number | null;
      projectId: string;
      project: { workspaceId: string };
    };
  }>;
}

function transformNote(apiNote: ApiNote): StickyNote {
  return {
    id: apiNote.id,
    content: apiNote.content,
    color: apiNote.color,
    x: apiNote.x,
    y: apiNote.y,
    visible: apiNote.visible,
    minimized: apiNote.minimized,
    zIndex: apiNote.zIndex,
    createdAt: apiNote.createdAt,
    linkedTasks: apiNote.taskLinks.map((link) => ({
      id: link.task.id,
      title: link.task.title,
      taskNumber: link.task.taskNumber ?? 0,
      projectId: link.task.projectId,
      workspaceId: link.task.project.workspaceId,
    })),
  };
}

export async function fetchStickyNotesAction(): Promise<StickyNote[]> {
  const session = await getSession();
  if (!session) return [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/sticky-notes`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data: ApiNote[] = await res.json();
    return data.map(transformNote);
  } catch {
    return [];
  }
}
