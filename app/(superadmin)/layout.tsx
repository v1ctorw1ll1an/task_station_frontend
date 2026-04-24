import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { SuperadminSidebar } from '@/components/superadmin/sidebar';
import { SidebarShell } from '@/components/navigation/sidebar-shell';
import { UserMenu } from '@/components/superadmin/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationSocketProvider } from '@/components/notifications/notification-socket-provider';
import { StickyNotesButtonClient, StickyNotesManagerClient } from '@/components/sticky-notes/sticky-notes-client';
import { fetchStickyNotesAction } from '@/actions/sticky-notes/fetch-sticky-notes.action';

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
  const initialNotes = await fetchStickyNotesAction();

  return (
    <>
      {session.token && <NotificationSocketProvider token={session.token} />}
      <SidebarShell
        sidebar={<SuperadminSidebar />}
        headerLeft={
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium truncate block">
            Painel do Superusuário
          </span>
        }
        headerRight={
          <>
            <div className="hidden sm:flex"><ThemeToggle /></div>
            <StickyNotesButtonClient />
            <UserMenu email={session.user.email} hasCompanies={companies.length > 0} />
          </>
        }
      >
        {children}
        <StickyNotesManagerClient initialNotes={initialNotes} />
      </SidebarShell>
    </>
  );
}
