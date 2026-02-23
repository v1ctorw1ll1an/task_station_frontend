import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { WorkspacesTable } from '@/components/empresa/workspaces/workspaces-table';
import { CreateWorkspaceForm } from '@/components/empresa/workspaces/create-workspace-form';
import { WorkspacesMemberView } from '@/components/empresa/workspaces/workspaces-member-view';

interface PageProps {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ isActive?: string; page?: string }>;
}

export default async function WorkspacesPage({ params, searchParams }: PageProps) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Verificar se o usuário é admin da empresa (acesso ao endpoint de gestão)
  const adminCheckRes = await fetch(
    `${apiUrl}/api/v1/empresa/${companyId}/workspaces?limit=1&page=1`,
    { headers, cache: 'no-store' },
  );
  const isCompanyAdmin = adminCheckRes.ok;

  if (!isCompanyAdmin) {
    // Membros e workspace_admins: mostrar apenas seus workspaces nesta empresa
    const myWorkspacesRes = await fetch(`${apiUrl}/api/v1/me/workspaces`, {
      headers,
      cache: 'no-store',
    });

    const allWorkspaces: Array<{
      workspaceId: string;
      workspaceName: string;
      companyId: string;
      role: string;
    }> = myWorkspacesRes.ok ? await myWorkspacesRes.json() : [];

    const myWorkspacesInCompany = allWorkspaces.filter((ws) => ws.companyId === companyId);

    // Se tem apenas 1 workspace como workspace_admin, redirecionar direto para o painel admin
    if (myWorkspacesInCompany.length === 1 && myWorkspacesInCompany[0].role === 'workspace_admin') {
      redirect(`/workspace/${myWorkspacesInCompany[0].workspaceId}/projetos`);
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Workspaces desta empresa aos quais você pertence.
          </p>
        </div>
        <WorkspacesMemberView data={myWorkspacesInCompany} />
      </div>
    );
  }

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const limit = 20;

  const query = new URLSearchParams();
  if (sp.isActive !== undefined && sp.isActive !== 'all') {
    query.set('isActive', sp.isActive);
  }
  query.set('page', String(page));
  query.set('limit', String(limit));

  const res = await fetch(
    `${apiUrl}/api/v1/empresa/${companyId}/workspaces?${query.toString()}`,
    { headers, cache: 'no-store' },
  );

  const { data, total } = res.ok ? await res.json() : { data: [], total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os workspaces da sua empresa.
          </p>
        </div>
        <CreateWorkspaceForm companyId={companyId} />
      </div>

      <WorkspacesTable
        data={data}
        total={total}
        page={page}
        limit={limit}
        companyId={companyId}
      />
    </div>
  );
}
