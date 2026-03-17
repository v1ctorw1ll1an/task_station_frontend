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
  const headers = { Authorization: `Bearer ${session.token}` };

  const [membrosRes, wsInfoRes] = await Promise.all([
    fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/membros?${query.toString()}`, {
      headers,
      cache: 'no-store',
    }),
    fetch(`${apiUrl}/api/v1/workspace/${workspaceId}`, { headers, cache: 'no-store' }),
  ]);

  const { data, total } = membrosRes.ok ? await membrosRes.json() : { data: [], total: 0 };
  const wsInfo: { companyId: string } | null = wsInfoRes.ok ? await wsInfoRes.json() : null;

  // Only company admins (or superusers) can add members — fetch accordingly
  type CompanyMember = { id: string; name: string; email: string; photoUrl: string | null };
  let availableMembers: CompanyMember[] = [];
  let canAddMembers = session.user.isSuperuser;

  if (wsInfo) {
    const myCompaniesRes = await fetch(`${apiUrl}/api/v1/me/empresas`, {
      headers,
      cache: 'no-store',
    });
    if (myCompaniesRes.ok) {
      const companies: Array<{ companyId: string; role: string }> = await myCompaniesRes.json();
      if (companies.find((c) => c.companyId === wsInfo.companyId && c.role === 'admin')) {
        canAddMembers = true;
      }
    }

    if (canAddMembers) {
      const cmRes = await fetch(
        `${apiUrl}/api/v1/empresa/${wsInfo.companyId}/membros?limit=200&page=1`,
        { headers, cache: 'no-store' },
      );
      if (cmRes.ok) {
        const cmData = await cmRes.json();
        const existingIds = new Set<string>(
          (data as Array<{ user: { id: string } }>).map((m) => m.user.id),
        );
        availableMembers = (cmData.data ?? [])
          .map((m: { user: { id: string; name: string; email: string; photoUrl: string | null } }) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            photoUrl: m.user.photoUrl ?? null,
          }))
          .filter((m: CompanyMember) => !existingIds.has(m.id));
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os membros e administradores deste workspace.
          </p>
        </div>
        {canAddMembers && (
          <AddMembroForm workspaceId={workspaceId} availableMembers={availableMembers} />
        )}
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
