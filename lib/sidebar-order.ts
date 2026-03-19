import { SidebarWorkspace } from '@/components/navigation/workspace-nav-item';
import { ProjectOrderEntry, SidebarOrderData } from '@/actions/me/get-sidebar-order.action';

export type { ProjectOrderEntry };

function applyWorkspaceOrder(
  workspaces: SidebarWorkspace[],
  ids: string[],
): SidebarWorkspace[] {
  const posMap = new Map(ids.map((id, i) => [id, i]));
  return [...workspaces].sort((a, b) => {
    const pa = posMap.get(a.workspaceId) ?? Infinity;
    const pb = posMap.get(b.workspaceId) ?? Infinity;
    return pa - pb;
  });
}

export async function fetchAndApplySidebarOrder(
  token: string,
  companyId: string,
  workspaces: SidebarWorkspace[],
): Promise<{ workspaces: SidebarWorkspace[]; projectOrders: ProjectOrderEntry[] }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/sidebar-order/${companyId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return { workspaces, projectOrders: [] };

    const data: SidebarOrderData = await res.json();

    const wsIds = data.workspaceOrders
      .sort((a, b) => a.position - b.position)
      .map((o) => o.workspaceId);

    const orderedWorkspaces = wsIds.length > 0 ? applyWorkspaceOrder(workspaces, wsIds) : workspaces;

    return { workspaces: orderedWorkspaces, projectOrders: data.projectOrders };
  } catch {
    return { workspaces, projectOrders: [] };
  }
}
