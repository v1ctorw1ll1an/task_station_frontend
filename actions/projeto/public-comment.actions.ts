'use server';

export interface PublicComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  isGuest: boolean;
  isYou: boolean;
}

const base = (token: string) =>
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/tasks/${encodeURIComponent(token)}/comments`;

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
  const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
  return message ?? 'Erro na operação';
}

export async function getPublicCommentsAction(
  token: string,
): Promise<{ comments?: PublicComment[]; error?: string }> {
  try {
    const res = await fetch(base(token), { method: 'GET', cache: 'no-store' });
    if (!res.ok) return { error: await parseError(res) };
    return { comments: (await res.json()) as PublicComment[] };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function createPublicCommentAction(
  token: string,
  content: string,
): Promise<{ comment?: PublicComment; error?: string }> {
  try {
    const res = await fetch(base(token), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return { error: await parseError(res) };
    return { comment: (await res.json()) as PublicComment };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function updatePublicCommentAction(
  token: string,
  commentId: string,
  content: string,
): Promise<{ comment?: PublicComment; error?: string }> {
  try {
    const res = await fetch(`${base(token)}/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return { error: await parseError(res) };
    return { comment: (await res.json()) as PublicComment };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function deletePublicCommentAction(
  token: string,
  commentId: string,
): Promise<{ error?: string }> {
  try {
    const res = await fetch(`${base(token)}/${commentId}`, { method: 'DELETE' });
    if (!res.ok) return { error: await parseError(res) };
    return {};
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
