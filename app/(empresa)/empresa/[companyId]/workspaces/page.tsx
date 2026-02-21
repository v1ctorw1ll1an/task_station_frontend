import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { WorkspacesTable } from '@/components/empresa/workspaces/workspaces-table';
import { CreateWorkspaceForm } from '@/components/empresa/workspaces/create-workspace-form';

interface PageProps {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ isActive?: string; page?: string }>;
}

export default async function WorkspacesPage({ params, searchParams }: PageProps) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const limit = 20;

  const query = new URLSearchParams();
  if (sp.isActive !== undefined && sp.isActive !== 'all') {
    query.set('isActive', sp.isActive);
  }
  query.set('page', String(page));
  query.set('limit', String(limit));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(
    `${apiUrl}/api/v1/empresa/${companyId}/workspaces?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
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
