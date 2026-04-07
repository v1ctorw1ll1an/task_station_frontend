import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { NotificationSocketProvider } from '@/components/notifications/notification-socket-provider';
import { TrackingWidget } from '@/components/workspace/task-tracking/tracking-widget';
import { getMyActiveSessionsAction } from '@/actions/task-session/get-my-active-sessions.action';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.mustResetPassword) {
    redirect('/first-access');
  }

  const mySessions = await getMyActiveSessionsAction();

  return (
    <>
      {session.token && <NotificationSocketProvider token={session.token} />}
      {children}
      <TrackingWidget initialSessions={mySessions} />
    </>
  );
}
