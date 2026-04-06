'use server';

import { getSession } from '@/lib/auth';

export interface TransferTargetColumn {
  id: string;
  name: string;
}

export interface TransferTargetProject {
  id: string;
  name: string;
  columns: TransferTargetColumn[];
}

export interface TransferTargetWorkspace {
  workspaceId: string;
  workspaceName: string;
  projects: TransferTargetProject[];
}

export async function getTransferTargetsAction(
  projectId: string,
): Promise<{ error?: string; data?: TransferTargetWorkspace[] }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/projetos/${projectId}/transfer-targets`,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message ?? 'Erro ao buscar projetos' };
    }

    const data = await res.json();
    return { data };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
