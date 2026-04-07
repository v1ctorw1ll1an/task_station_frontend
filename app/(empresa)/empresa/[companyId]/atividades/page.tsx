import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCompanyActiveSessionsAction } from '@/actions/empresa/get-company-active-sessions.action';
import { EmpresaAtividades } from '@/components/empresa/atividades/empresa-atividades';

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function EmpresaAtividadesPage({ params }: PageProps) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const { sessions, forbidden, error } = await getCompanyActiveSessionsAction(companyId);

  if (forbidden) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Atividades em execução</h1>
          <p className="text-sm text-muted-foreground mt-1">Sessões ativas de todos os membros da empresa.</p>
        </div>
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-destructive">
          Acesso restrito a administradores da empresa.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atividades em execução</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sessões de trabalho ativas de todos os membros da empresa, em tempo real.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-muted-foreground">
          {error}
        </div>
      ) : (
        <EmpresaAtividades
          initialSessions={sessions}
          companyId={companyId}
          token={session.token}
        />
      )}
    </div>
  );
}
