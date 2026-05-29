'use server';

import type { PublicTaskColumn, PublicTaskLabel } from './get-public-task.action';

const base = (token: string) =>
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/tasks/${encodeURIComponent(token)}`;

export async function getPublicColumnsAction(
  token: string,
): Promise<{ columns?: PublicTaskColumn[]; error?: string }> {
  try {
    const res = await fetch(`${base(token)}/columns`, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return { error: 'Erro ao carregar colunas' };
    const columns = (await res.json()) as PublicTaskColumn[];
    return { columns };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function getPublicLabelsAction(
  token: string,
): Promise<{ labels?: PublicTaskLabel[]; error?: string }> {
  try {
    const res = await fetch(`${base(token)}/labels`, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return { error: 'Erro ao carregar labels' };
    const labels = (await res.json()) as PublicTaskLabel[];
    return { labels };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
