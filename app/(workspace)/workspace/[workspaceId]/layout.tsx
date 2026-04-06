import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SidebarShell } from '@/components/navigation/sidebar-shell';
import { EmpresaUserMenu } from '@/components/empresa/user-menu';
import { SidebarWorkspace } from '@/components/navigation/workspace-nav-item';
import { NotificationBellClient } from '@/components/notifications/notification-bell-client';
import { ThemeToggle } from '@/components/theme-toggle';
import { fetchAndApplySidebarOrder } from '@/lib/sidebar-order';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspaceId } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.user.mustResetPassword) redirect('/first-access');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Resolve workspace info (works for both workspace members and company admins)
  const wsInfoRes = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}`, {
    headers,
    cache: 'no-store',
  });
  if (!wsInfoRes.ok) redirect('/dashboard');
  const wsInfo: { id: string; companyId: string; isActive: boolean } = await wsInfoRes.json();
  const companyId = wsInfo.companyId;

  let companyName = '';
  let isCompanyAdmin = false;
  let workspaces: SidebarWorkspace[] = [];

  const companiesRes = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers,
    cache: 'no-store',
  });
  if (companiesRes.ok) {
    const companies: Array<{ companyId: string; legalName: string; role: string }> =
      await companiesRes.json();
    const company = companies.find((c) => c.companyId === companyId);
    if (company) {
      companyName = company.legalName;
      isCompanyAdmin = company.role === 'admin';
    }
  }

  if (isCompanyAdmin) {
    // Company admins see all workspaces
    const wsRes = await fetch(
      `${apiUrl}/api/v1/empresa/${companyId}/workspaces?limit=100&page=1`,
      { headers, cache: 'no-store' },
    );
    if (wsRes.ok) {
      const data = await wsRes.json();
      workspaces = (data.data ?? []).map(
        (ws: { id: string; name: string; isActive: boolean }) => ({
          workspaceId: ws.id,
          workspaceName: ws.name,
          companyId,
          role: 'admin',
        }),
      );
    }
  } else {
    // Regular members only see workspaces they belong to
    const myWsRes = await fetch(`${apiUrl}/api/v1/me/workspaces`, {
      headers,
      cache: 'no-store',
    });
    if (myWsRes.ok) {
      const myWorkspaces: Array<{
        workspaceId: string;
        workspaceName: string;
        companyId: string;
        role: string;
      }> = await myWsRes.json();
      workspaces = myWorkspaces
        .filter((ws) => ws.companyId === companyId)
        .map((ws) => ({
          workspaceId: ws.workspaceId,
          workspaceName: ws.workspaceName,
          companyId,
          role: ws.role,
        }));
    }
  }

  // Pre-order workspaces and get project orders from server (eliminates flash)
  const { workspaces: orderedWorkspaces, projectOrders } =
    await fetchAndApplySidebarOrder(session.token, companyId, workspaces);

  return (
    <SidebarShell
      variant="full-height"
      sidebar={
        <AppSidebar
          companyId={companyId}
          companyName={companyName || 'Empresa'}
          isCompanyAdmin={isCompanyAdmin}
          workspaces={orderedWorkspaces}
          userEmail={session.user.email}
          initialProjectOrders={projectOrders}
        />
      }
      headerLeft={
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Painel do Workspace
        </span>
      }
      headerRight={
        <>
          <ThemeToggle />
          <NotificationBellClient token={session.token} />
          <EmpresaUserMenu email={session.user.email} isSuperuser={session.user.isSuperuser} />
        </>
      }
    >
      {children}
    </SidebarShell>
  );
}
