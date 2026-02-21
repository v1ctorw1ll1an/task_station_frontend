import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { UsersTable } from '@/components/superadmin/usuarios/users-table';

interface PageProps {
  searchParams: Promise<{ search?: string; isActive?: string; page?: string }>;
}

export default async function UsuariosPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = 20;

  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.isActive !== undefined && params.isActive !== 'all') {
    query.set('isActive', params.isActive);
  }
  query.set('page', String(page));
  query.set('limit', String(limit));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/superadmin/usuarios?${query.toString()}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  const { data, total } = res.ok
    ? await res.json()
    : { data: [], total: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os usuários cadastrados na plataforma.
        </p>
      </div>

      <UsersTable
        data={data}
        total={total}
        page={page}
        limit={limit}
      />
    </div>
  );
}
