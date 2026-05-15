'use server';

import { getSession } from '@/lib/auth';

export interface AddGuestActionState {
  error?: string;
  success?: boolean;
  whatsappUrl?: string;
  guest?: {
    id: string;
    name: string;
    phoneE164: string;
    email: string | null;
  };
}

export async function addGuestAction(
  _prev: AddGuestActionState,
  formData: FormData,
): Promise<AddGuestActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const projectId = formData.get('projectId');
  const taskId = formData.get('taskId');
  const name = formData.get('name');
  const phone = formData.get('phone');
  const email = formData.get('email');

  if (!projectId || typeof projectId !== 'string') return { error: 'Projeto inválido' };
  if (!taskId || typeof taskId !== 'string') return { error: 'Task inválida' };
  if (!name || typeof name !== 'string' || name.trim().length === 0)
    return { error: 'Nome é obrigatório' };
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0)
    return { error: 'Telefone é obrigatório' };

  const body: Record<string, unknown> = {
    name: name.trim(),
    phone: phone.trim(),
  };
  if (email && typeof email === 'string' && email.trim()) {
    body.email = email.trim();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/tasks/${taskId}/guests`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: data.message ?? 'Erro ao adicionar convidado' };
    }

    const data = (await res.json().catch(() => null)) as {
      guest: { id: string; name: string; phoneE164: string; email: string | null };
      whatsappUrl: string;
    } | null;

    if (!data) return { error: 'Resposta inválida do servidor' };

    return {
      success: true,
      guest: data.guest,
      whatsappUrl: data.whatsappUrl,
    };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
