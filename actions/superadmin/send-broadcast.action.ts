'use server';

import { getSession } from '@/lib/auth';

export interface SendBroadcastState {
  success?: boolean;
  error?: string;
}

export async function sendSuperadminBroadcastAction(
  _prev: SendBroadcastState,
  formData: FormData,
): Promise<SendBroadcastState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const title = formData.get('title') as string;
  const body = formData.get('body') as string;
  const companyIdsRaw = formData.get('companyIds') as string | null;

  if (!title?.trim()) return { error: 'Título é obrigatório' };
  if (!body?.trim()) return { error: 'Conteúdo é obrigatório' };

  const companyIds: string[] | undefined = companyIdsRaw
    ? JSON.parse(companyIdsRaw) as string[]
    : undefined;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        ...(companyIds && companyIds.length > 0 ? { companyIds } : {}),
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
