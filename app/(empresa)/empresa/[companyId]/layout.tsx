import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { EmpresaUserMenu } from '@/components/empresa/user-menu';
import { SidebarWorkspace } from '@/components/navigation/workspace-nav-item';

interface EmpresaLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}

export default async function EmpresaLayout({ children, params }: EmpresaLayoutProps) {
  const { companyId } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.user.mustResetPassword) redirect('/first-access');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Verify company access + get role
  const companiesRes = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers,
    cache: 'no-store',
  });
  if (!companiesRes.ok) redirect('/dashboard');

  const companies: Array<{ companyId: string; legalName: string; role: string }> =
    await companiesRes.json();

  const company = companies.find((c) => c.companyId === companyId);
  if (!company) redirect('/dashboard');

  const isCompanyAdmin = company.role === 'admin';

  // Fetch workspace list for sidebar tree
  let workspaces: SidebarWorkspace[] = [];
  if (isCompanyAdmin) {
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
    const myWsRes = await fetch(`${apiUrl}/api/v1/me/workspaces`, {
      headers,
      cache: 'no-store',
    });
    if (myWsRes.ok) {
      const data: Array<{ workspaceId: string; workspaceName: string; companyId: string; role: string }> =
        await myWsRes.json();
      workspaces = data
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
        companyName={company.legalName}
        isCompanyAdmin={isCompanyAdmin}
        isSuperuser={session.user.isSuperuser}
        workspaces={workspaces}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Painel da Empresa
          </span>
          <EmpresaUserMenu email={session.user.email} isSuperuser={session.user.isSuperuser} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
