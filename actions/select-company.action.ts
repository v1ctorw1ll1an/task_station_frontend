'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function selectCompanyAction(companyId: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set('last_company_id', companyId, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });

  redirect(`/empresa/${companyId}/workspaces`);
}
