import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { WorkspaceSidebar } from '@/components/workspace/sidebar';
import { EmpresaUserMenu } from '@/components/empresa/user-menu';

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

  // Verificar se o usuário tem acesso a este workspace (membro ou admin)
  const accessRes = await fetch(
    `${apiUrl}/api/v1/workspace/${workspaceId}/projetos?limit=1&page=1`,
    { headers, cache: 'no-store' },
  );

  if (!accessRes.ok) redirect('/dashboard');

  // Verificar se o usuário é admin do workspace (acesso ao endpoint de membros requer WorkspaceAdminGuard)
  const adminRes = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/membros?limit=1&page=1`, {
    headers,
    cache: 'no-store',
  });
  const isAdmin = adminRes.ok;

  const workspaceName = 'Workspace';

  return (
    <div className="flex min-h-screen">
      <WorkspaceSidebar workspaceId={workspaceId} workspaceName={workspaceName} isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-6">
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
