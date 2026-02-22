'use server';

import { getSession } from '@/lib/auth';

export interface WorkspaceRole {
  workspaceId: string;
  workspaceName: string;
  isActive: boolean;
  membershipId: string | null;
  role: string | null;
}

export interface MemberRolesResult {
  user: { id: string; name: string; email: string };
  companyRole: string | null;
  companyMembershipId: string | null;
  workspaceRoles: WorkspaceRole[];
}

export async function getMemberRolesAction(
  companyId: string,
  userId: string,
): Promise<{ data?: MemberRolesResult; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/empresa/${companyId}/membros/${userId}/papeis`,
      {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? 'Erro ao buscar papéis' };
    }
    const data = (await res.json()) as MemberRolesResult;
    return { data };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
