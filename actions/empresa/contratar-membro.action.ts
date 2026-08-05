'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { extractActionError } from '@/lib/action-error';

export interface ContratarMembroActionState {
  error?: string;
  /** Erro de plano lotado: a tela oferece o caminho para contratar mais usuários. */
  seatLimit?: boolean;
  success?: boolean;
  emailFailed?: boolean;
  /** Link de primeiro acesso (conta nova) ou de convite (conta que já existia). */
  magicLink?: string;
  /**
   * `hired` = conta criada e já vinculada à empresa.
   * `invited` = o e-mail já tinha conta no TaskDY, então foi enviado um convite —
   * a pessoa só entra na empresa depois de aceitar.
   */
  mode?: 'hired' | 'invited';
  email?: string;
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
      const erro = extractActionError(data, 'Erro ao adicionar membro');
      return { error: erro.message, seatLimit: erro.seatLimit };
    }

    const data = await res.json().catch(() => ({}));
    revalidatePath(`/empresa/${companyId}/membros`);

    const mode = data.mode === 'invited' ? 'invited' : 'hired';
    // Conta nova → magicLink de primeiro acesso; conta existente → inviteLink.
    const link = (mode === 'invited' ? data.inviteLink : data.magicLink) as string | undefined;

    if (data.emailSent === false && link) {
      return { success: true, emailFailed: true, magicLink: link, mode, email: body.email };
    }
    return { success: true, mode, email: body.email };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
