import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { getSession } from '@/lib/auth';
import { getMyTasksAction } from '@/actions/me/get-my-tasks.action';
import { Agenda } from '@/components/home/agenda/agenda';

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function InicioPage({ params }: PageProps) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const today = format(new Date(), 'yyyy-MM-dd');
  const tasksResult = await getMyTasksAction(companyId, 1, 50, 'custom', today, today);

  return <Agenda companyId={companyId} initialTasks={tasksResult.data} />;
}
