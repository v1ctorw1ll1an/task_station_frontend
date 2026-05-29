'use server';

import type { PublicTaskChecklist } from './get-public-task.action';

const base = (token: string) =>
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/tasks/${encodeURIComponent(token)}/checklists`;

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
  const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
  return message ?? 'Erro na operação';
}

export async function getPublicChecklistsAction(
  token: string,
): Promise<{ items?: PublicTaskChecklist[]; error?: string }> {
  try {
    const res = await fetch(base(token), { method: 'GET', cache: 'no-store' });
    if (!res.ok) return { error: await parseError(res) };
    return { items: (await res.json()) as PublicTaskChecklist[] };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function createPublicChecklistAction(
  token: string,
  title: string,
): Promise<{ item?: PublicTaskChecklist; error?: string }> {
  try {
    const res = await fetch(base(token), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return { error: await parseError(res) };
    return { item: (await res.json()) as PublicTaskChecklist };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function updatePublicChecklistAction(
  token: string,
  checklistId: string,
  fields: { title?: string; completed?: boolean },
): Promise<{ item?: PublicTaskChecklist; error?: string }> {
  try {
    const res = await fetch(`${base(token)}/${checklistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) return { error: await parseError(res) };
    return { item: (await res.json()) as PublicTaskChecklist };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function deletePublicChecklistAction(
  token: string,
  checklistId: string,
): Promise<{ error?: string }> {
  try {
    const res = await fetch(`${base(token)}/${checklistId}`, { method: 'DELETE' });
    if (!res.ok) return { error: await parseError(res) };
    return {};
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function reorderPublicChecklistAction(
  token: string,
  items: { id: string; order: number }[],
): Promise<{ error?: string }> {
  try {
    const res = await fetch(`${base(token)}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return { error: await parseError(res) };
    return {};
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
