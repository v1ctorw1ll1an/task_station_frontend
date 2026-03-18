import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { KanbanBoard } from '@/components/workspace/kanban/kanban-board-client';
import { MemberAvatarStack } from '@/components/workspace/kanban/member-avatar-stack';
import { ProjectDescriptionLine } from '@/components/workspace/kanban/project-description-line';

interface PageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function KanbanPage({ params }: PageProps) {
  const { workspaceId, projectId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Buscar kanban + admin probe + membros + labels + info do projeto em paralelo
  const [kanbanRes, adminRes, membrosRes, labelsRes, projetoRes] = await Promise.all([
    fetch(`${apiUrl}/api/v1/projetos/${projectId}/kanban`, { headers, cache: 'no-store' }),
    fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/membros?limit=1&page=1`, { headers, cache: 'no-store' }),
    fetch(`${apiUrl}/api/v1/projetos/${projectId}/membros`, { headers, cache: 'no-store' }),
    fetch(`${apiUrl}/api/v1/projetos/${projectId}/labels`, { headers, cache: 'no-store' }),
    fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/projetos/${projectId}`, { headers, cache: 'no-store' }),
  ]);

  if (!kanbanRes.ok) {
    redirect(`/workspace/${workspaceId}/projetos`);
  }

  const kanbanData = await kanbanRes.json();
  const isAdmin = adminRes.ok;
  const membros: { id: string; name: string; email: string; photoUrl: string | null }[] = membrosRes.ok
    ? await membrosRes.json()
    : [];
  const labels: { id: string; name: string; color: string; projectId: string }[] = labelsRes.ok
    ? await labelsRes.json()
    : [];
  const projeto: { id: string; name: string; description: string | null } | null = projetoRes.ok
    ? await projetoRes.json()
    : null;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <h1
            className="text-2xl font-bold truncate max-w-[50%]"
            title={projeto?.name ?? 'Kanban'}
          >
            {projeto?.name ?? 'Kanban'}
          </h1>
          {membros.length > 0 && <MemberAvatarStack members={membros} />}
        </div>
        {projeto?.description && (
          <ProjectDescriptionLine description={projeto.description} />
        )}
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard
          data={kanbanData}
          projectId={projectId}
          workspaceId={workspaceId}
          isAdmin={isAdmin}
          membros={membros}
          labels={labels}
          currentUserId={session.user.id}
          token={session.token}
        />
      </div>
    </div>
  );
}
