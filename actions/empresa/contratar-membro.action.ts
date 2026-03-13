'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface ContratarMembroActionState {
  error?: string;
  success?: boolean;
  emailFailed?: boolean;
  magicLink?: string;
}

export async function contratarMembroAction(
  _prev: ContratarMembroActionState,
  formData: FormData,
): Promise<ContratarMembroActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const companyId = formData.get('companyId');
  if (!companyId || typeof companyId !== 'string') return { error: 'Empresa inválida' };

  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('phone');

  if (!name || typeof name !== 'string' || name.trim().length < 2)
    return { error: 'Nome deve ter ao menos 2 caracteres' };
  if (!email || typeof email !== 'string' || !email.includes('@'))
    return { error: 'Email inválido' };

  const body: Record<string, string> = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
  };
  if (phone && typeof phone === 'string' && phone.trim()) {
    body.phone = phone.trim();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/membros/contratar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao adicionar membro' };
    }

    const data = await res.json().catch(() => ({}));
    revalidatePath(`/empresa/${companyId}/membros`);
    if (data.emailSent === false && data.magicLink) {
      return { success: true, emailFailed: true, magicLink: data.magicLink as string };
    }
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
