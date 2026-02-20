import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { SuperadminSidebar } from '@/components/superadmin/sidebar';
import { logoutAction } from '@/actions/logout.action';
import { Button } from '@/components/ui/button';

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.user.isSuperuser) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen">
      <SuperadminSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-6">
          <span className="text-sm text-muted-foreground">
            Logado como <strong>{session.user.email}</strong>
          </span>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit">
              Sair
            </Button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
