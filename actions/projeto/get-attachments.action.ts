'use server';

import { getSession } from '@/lib/auth';

export interface TaskAttachment {
  id: string;
  taskId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  hasThumbnail: boolean;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

export async function getAttachmentsAction(
  projectId: string,
  taskId: string,
): Promise<{ data?: TaskAttachment[]; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/attachments`,
      { headers: { Authorization: `Bearer ${session.token}` }, cache: 'no-store' },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao buscar anexos' };
    }

    return { data: await res.json() };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
