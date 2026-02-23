import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { WorkspaceMembrosTable } from '@/components/workspace/membros/membros-table';
import { AddMembroForm } from '@/components/workspace/membros/add-membro-form';

interface PageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ search?: string; isActive?: string; page?: string; wsName?: string }>;
}

export default async function MembrosPage({ params, searchParams }: PageProps) {
  const { workspaceId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const limit = 20;

  const query = new URLSearchParams();
  if (sp.search) query.set('search', sp.search);
  if (sp.isActive !== undefined && sp.isActive !== 'all') {
    query.set('isActive', sp.isActive);
  }
  query.set('page', String(page));
  query.set('limit', String(limit));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(
    `${apiUrl}/api/v1/workspace/${workspaceId}/membros?${query.toString()}`,
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
          <h1 className="text-2xl font-bold">Membros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os membros e administradores deste workspace.
          </p>
        </div>
        <AddMembroForm workspaceId={workspaceId} />
      </div>

      <WorkspaceMembrosTable
        data={data}
        total={total}
        page={page}
        limit={limit}
        workspaceId={workspaceId}
        currentUserId={session.user.id}
      />
    </div>
  );
}
