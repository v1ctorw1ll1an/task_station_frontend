import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { KanbanBoard } from '@/components/workspace/kanban/kanban-board';

interface PageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function KanbanPage({ params }: PageProps) {
  const { workspaceId, projectId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Buscar kanban + admin probe + membros em paralelo
  const [kanbanRes, adminRes, membrosRes] = await Promise.all([
    fetch(`${apiUrl}/api/v1/projetos/${projectId}/kanban`, {
      headers,
      cache: 'no-store',
    }),
    fetch(`${apiUrl}/api/v1/workspace/${workspaceId}/membros?limit=1&page=1`, {
      headers,
      cache: 'no-store',
    }),
    fetch(`${apiUrl}/api/v1/projetos/${projectId}/membros`, {
      headers,
      cache: 'no-store',
    }),
  ]);

  if (!kanbanRes.ok) {
    redirect(`/workspace/${workspaceId}/projetos`);
  }

  const kanbanData = await kanbanRes.json();
  const isAdmin = adminRes.ok;
  const membros: { id: string; name: string; email: string }[] = membrosRes.ok
    ? await membrosRes.json()
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Kanban</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as tasks do projeto.
        </p>
      </div>

      <KanbanBoard
        data={kanbanData}
        projectId={projectId}
        workspaceId={workspaceId}
        isAdmin={isAdmin}
        membros={membros}
      />
    </div>
  );
}
