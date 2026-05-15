import { notFound } from 'next/navigation';
import { getPublicTaskAction } from '@/actions/projeto/get-public-task.action';
import { PublicTaskView } from './public-task-view';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PublicTaskPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getPublicTaskAction(token);

  if (result.notFound) notFound();

  if (result.error || !result.task) {
    return (
      <div className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
        {result.error ?? 'Não foi possível carregar a task.'}
      </div>
    );
  }

  return <PublicTaskView token={token} initialTask={result.task} />;
}
