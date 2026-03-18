import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { NotificationSocketProvider } from '@/components/notifications/notification-socket-provider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.mustResetPassword) {
    redirect('/first-access');
  }

  return (
    <>
      {session.token && <NotificationSocketProvider token={session.token} />}
      {children}
    </>
  );
}
