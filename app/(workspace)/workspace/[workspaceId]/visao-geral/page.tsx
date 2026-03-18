import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getWorkspaceOverviewAction } from '@/actions/workspace/get-workspace-overview.action';
import { WorkspaceOverview } from '@/components/workspace/overview/workspace-overview';

interface PageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function VisaoGeralPage({ params }: PageProps) {
  const { workspaceId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const { data: projects, error } = await getWorkspaceOverviewAction(workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todas as tasks dos projetos ativos deste workspace.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-destructive">
          {error}
        </div>
      ) : (
        <WorkspaceOverview projects={projects} workspaceId={workspaceId} />
      )}
    </div>
  );
}
