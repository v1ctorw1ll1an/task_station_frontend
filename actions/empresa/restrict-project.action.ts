'use server';

import { getSession } from '@/lib/auth';

export async function restrictProjectAction(
  companyId: string,
  workspaceId: string,
  projectId: string,
  userId: string,
) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/empresa/${companyId}/workspaces/${workspaceId}/projetos/${projectId}/restrict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ userId }),
      },
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? 'Erro ao restringir projeto' };
    }
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function unrestrictProjectAction(
  companyId: string,
  workspaceId: string,
  projectId: string,
  userId: string,
) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/empresa/${companyId}/workspaces/${workspaceId}/projetos/${projectId}/restrict/${userId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? 'Erro ao remover restrição' };
    }
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
