import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.mustResetPassword) redirect('/first-access');

  // Verificar última empresa salva
  const cookieStore = await cookies();
  const lastCompanyId = cookieStore.get('last_company_id')?.value;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  const companies: Array<{ companyId: string; legalName: string; role: string }> = res.ok
    ? await res.json()
    : [];

  // Superusuário sem nenhuma empresa vinculada → painel exclusivo de superadmin
  if (session.user.isSuperuser && companies.length === 0) {
    redirect('/superadmin/empresas');
  }

  // Tem última empresa salva e ela ainda está na lista → redirecionar direto
  if (lastCompanyId && companies.some((c) => c.companyId === lastCompanyId)) {
    redirect(`/empresa/${lastCompanyId}/workspaces`);
  }

  // 1 empresa → redirecionar direto
  if (companies.length === 1) {
    redirect(`/empresa/${companies[0].companyId}/workspaces`);
  }

  // Múltiplas empresas ou nenhuma → seletor (seletor cuida da mensagem de sem acesso)
  redirect('/empresa/selecionar');
}
