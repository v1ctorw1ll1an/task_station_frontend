import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { EmpresaSidebar } from '@/components/empresa/sidebar';
import { EmpresaUserMenu } from '@/components/empresa/user-menu';

interface EmpresaLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}

export default async function EmpresaLayout({ children, params }: EmpresaLayoutProps) {
  const { companyId } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.user.mustResetPassword) redirect('/first-access');

  // Verificar se o usuário tem acesso a esta empresa (qualquer role)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  if (!res.ok) redirect('/dashboard');

  const companies: Array<{ companyId: string; legalName: string; role: string }> =
    await res.json();

  const company = companies.find((c) => c.companyId === companyId);
  if (!company) redirect('/dashboard');

  return (
    <div className="flex min-h-screen">
      <EmpresaSidebar companyId={companyId} companyName={company.legalName} role={company.role} />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-6">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Painel da Empresa
          </span>
          <EmpresaUserMenu email={session.user.email} isSuperuser={session.user.isSuperuser} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
