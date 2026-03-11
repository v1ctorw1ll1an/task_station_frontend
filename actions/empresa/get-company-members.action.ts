'use server';

import { getSession } from '@/lib/auth';

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
}

export async function getCompanyMembersAction(companyId: string): Promise<CompanyMember[]> {
  const session = await getSession();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/empresa/${companyId}/membros?limit=200&page=1`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).map(
      (m: { user: { id: string; name: string; email: string } }) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      }),
    );
  } catch {
    return [];
  }
}
