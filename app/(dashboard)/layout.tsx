import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.mustResetPassword) {
    redirect('/first-access');
  }

  return <>{children}</>;
}
