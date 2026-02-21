import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.mustResetPassword) redirect('/first-access');
  if (session.user.isSuperuser) redirect('/superadmin/empresas');

  redirect('/empresa/selecionar');
}
