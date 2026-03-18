import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getMyTasksAction } from '@/actions/me/get-my-tasks.action';
import { getNotificationsAction } from '@/actions/notificacao/get-notifications.action';
import { getProfileAction } from '@/actions/perfil/get-profile.action';
import { HomeGreeting } from '@/components/home/home-greeting';
import { TasksDueSoon } from '@/components/home/tasks-due-soon';
import { NotificationFeed } from '@/components/home/notification-feed';

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function InicioPage({ params }: PageProps) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const [tasksResult, notificationsResult, profileResult] = await Promise.all([
    getMyTasksAction(companyId, 1, 10, 'today'),
    getNotificationsAction(1, 10),
    getProfileAction(),
  ]);

  const userName = profileResult.data?.name ?? 'Usuário';

  return (
    <div className="space-y-6">
      <HomeGreeting userName={userName} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TasksDueSoon
            companyId={companyId}
            initialData={tasksResult.data}
            initialTotal={tasksResult.total}
          />
        </div>
        <div>
          <NotificationFeed initialData={notificationsResult.data ?? []} />
        </div>
      </div>
    </div>
  );
}
