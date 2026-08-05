'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export interface ConvitePendente {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; name: string };
}

export async function listarConvitesAction(companyId: string): Promise<ConvitePendente[]> {
  const session = await getSession();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/convites`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

/**
 * Reenviar é criar de novo com o mesmo e-mail: o backend revoga o pendente
 * anterior e gera um token novo, então um link vazado deixa de valer.
 */
export async function reenviarConviteAction(companyId: string, email: string) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/convites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao reenviar convite' };
    }

    const data = (await res.json()) as { emailSent: boolean; inviteLink: string };
    revalidatePath(`/empresa/${companyId}/membros`);
    return { success: true, emailSent: data.emailSent, inviteLink: data.inviteLink };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function revogarConviteAction(companyId: string, inviteId: string) {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/convites/${inviteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao revogar convite' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath(`/empresa/${companyId}/membros`);
  return { success: true };
}
