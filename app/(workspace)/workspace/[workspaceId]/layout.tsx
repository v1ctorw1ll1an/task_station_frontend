import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { EmpresaUserMenu } from '@/components/empresa/user-menu';
import { SidebarWorkspace } from '@/components/navigation/workspace-nav-item';

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
          role: ws.role,
        }));
    }
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        companyId={companyId}
        companyName={companyName || 'Empresa'}
        isCompanyAdmin={isCompanyAdmin}
        isSuperuser={session.user.isSuperuser}
        workspaces={workspaces}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Painel do Workspace
          </span>
          <EmpresaUserMenu email={session.user.email} isSuperuser={session.user.isSuperuser} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
