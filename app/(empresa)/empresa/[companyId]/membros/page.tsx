import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { MembrosTable } from '@/components/empresa/membros/membros-table';

interface PageProps {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ search?: string; isActive?: string; page?: string }>;
}

export default async function MembrosPage({ params, searchParams }: PageProps) {
  const { companyId } = await params;
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
    `${apiUrl}/api/v1/empresa/${companyId}/membros?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  const { data, total } = res.ok ? await res.json() : { data: [], total: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Membros</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os membros e administradores da empresa.
        </p>
      </div>

      <MembrosTable
        data={data}
        total={total}
        page={page}
        limit={limit}
        companyId={companyId}
        currentUserId={session.user.id}
      />
    </div>
  );
}
