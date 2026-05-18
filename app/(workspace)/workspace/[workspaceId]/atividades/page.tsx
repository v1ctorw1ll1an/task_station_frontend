import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getWorkspaceActiveSessionsAction } from '@/actions/workspace/get-workspace-active-sessions.action';
import { getWorkspaceMembersAction } from '@/actions/workspace/get-workspace-members.action';
import { WorkspaceAtividades } from '@/components/workspace/atividades/workspace-atividades';

interface PageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function AtividadesPage({ params }: PageProps) {
  const { workspaceId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const [{ sessions, forbidden, error }, allMembers] = await Promise.all([
    getWorkspaceActiveSessionsAction(workspaceId),
    getWorkspaceMembersAction(workspaceId),
  ]);

  if (forbidden) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Atividades</h1>
          <p className="text-sm text-muted-foreground mt-1">Sessões de trabalho ativas dos membros.</p>
        </div>
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-destructive">
          Acesso restrito a administradores do workspace.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atividades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sessões de trabalho ativas dos membros em tempo real.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-muted-foreground">
          {error}
        </div>
      ) : (
        <WorkspaceAtividades
          initialSessions={sessions}
          allMembers={allMembers}
          workspaceId={workspaceId}
          currentUserId={session.user.id}
          token={session.token}
        />
      )}
    </div>
  );
}
