'use server';

import { getSession } from '@/lib/auth';

export interface SendEmpresaBroadcastState {
  success?: boolean;
  error?: string;
}

export async function sendEmpresaBroadcastAction(
  companyId: string,
  _prev: SendEmpresaBroadcastState,
  formData: FormData,
): Promise<SendEmpresaBroadcastState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const title = formData.get('title') as string;
  const body = formData.get('body') as string;
  const workspaceIdsRaw = formData.get('workspaceIds') as string | null;

  if (!title?.trim()) return { error: 'Título é obrigatório' };
  if (!body?.trim()) return { error: 'Conteúdo é obrigatório' };

  const workspaceIds: string[] | undefined = workspaceIdsRaw
    ? JSON.parse(workspaceIdsRaw) as string[]
    : undefined;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        ...(workspaceIds && workspaceIds.length > 0 ? { workspaceIds } : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { message?: string };
      return { error: data.message ?? 'Erro ao enviar comunicado' };
    }

    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
