import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { SuperadminSidebar } from '@/components/superadmin/sidebar';
import { UserMenu } from '@/components/superadmin/user-menu';

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.user.isSuperuser) {
    redirect('/dashboard');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });
  const companies: unknown[] = res.ok ? await res.json() : [];

  return (
    <div className="flex min-h-screen">
      <SuperadminSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-6">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Painel do Superusuário
          </span>
          <UserMenu email={session.user.email} hasCompanies={companies.length > 0} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
