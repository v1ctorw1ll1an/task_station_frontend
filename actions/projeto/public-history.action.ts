'use server';

import { TASK_HISTORY_MAX } from '@/lib/limits';

export interface PublicHistoryEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  author: string;
  isYou: boolean;
}

export interface PublicHistoryPage {
  data: PublicHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function getPublicHistoryAction(
  token: string,
  page = 1,
  limit = TASK_HISTORY_MAX,
): Promise<{ history?: PublicHistoryPage; error?: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/public/tasks/${encodeURIComponent(token)}/history?page=${page}&limit=${limit}`,
      { method: 'GET', cache: 'no-store' },
    );
    if (!res.ok) return { error: 'Erro ao carregar histórico' };
    return { history: (await res.json()) as PublicHistoryPage };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
