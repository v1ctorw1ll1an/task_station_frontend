'use server';

import { getSession } from '@/lib/auth';

export interface WorkspaceOrderEntry {
  workspaceId: string;
  position: number;
}

export interface ProjectOrderEntry {
  projectId: string;
  workspaceId: string;
  position: number;
}

export interface SidebarOrderData {
  workspaceOrders: WorkspaceOrderEntry[];
  projectOrders: ProjectOrderEntry[];
}

export async function getSidebarOrderAction(
  companyId: string,
): Promise<SidebarOrderData | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/sidebar-order/${companyId}`,
      {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
