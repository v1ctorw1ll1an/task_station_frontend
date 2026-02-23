import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ProjetosTable } from '@/components/workspace/projetos/projetos-table';
import { CreateProjetoForm } from '@/components/workspace/projetos/create-projeto-form';

interface PageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ isActive?: string; page?: string }>;
}

export default async function ProjetosPage({ params, searchParams }: PageProps) {
  const { workspaceId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const limit = 20;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Verificar se o usuário é admin do workspace
  const adminRes = await fetch(
    `${apiUrl}/api/v1/workspace/${workspaceId}/membros?limit=1&page=1`,
    { headers, cache: 'no-store' },
  );
  const isAdmin = adminRes.ok;

  const query = new URLSearchParams();
  if (isAdmin && sp.isActive !== undefined && sp.isActive !== 'all') {
    query.set('isActive', sp.isActive);
  }
  query.set('page', String(page));
  query.set('limit', String(limit));

  const res = await fetch(
    `${apiUrl}/api/v1/workspace/${workspaceId}/projetos?${query.toString()}`,
    { headers, cache: 'no-store' },
  );

  const { data, total } = res.ok ? await res.json() : { data: [], total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? 'Gerencie os projetos deste workspace.' : 'Projetos do workspace.'}
          </p>
        </div>
        {isAdmin && <CreateProjetoForm workspaceId={workspaceId} />}
      </div>

      <ProjetosTable
        data={data}
        total={total}
        page={page}
        limit={limit}
        workspaceId={workspaceId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
