'use server';
import { getSession } from '@/lib/auth';

export interface CompanyItem {
  id: string;
  legalName: string;
}

export async function fetchCompaniesAction(
  page: number,
  search?: string,
): Promise<{ data: CompanyItem[]; total: number }> {
  const session = await getSession();
  if (!session) return { data: [], total: 0 };

  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) params.set('search', search);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/superadmin/empresas?${params}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) return { data: [], total: 0 };
  const json = await res.json() as { data: CompanyItem[]; total: number };
  return { data: json.data ?? [], total: json.total ?? 0 };
}
