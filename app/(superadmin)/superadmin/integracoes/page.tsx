import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getGoogleSyncPanelAction } from '@/actions/superadmin/google-sync.action';
import { GoogleSyncPanel } from '@/components/superadmin/integracoes/google-sync-panel';

export default async function IntegracoesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { data, error } = await getGoogleSyncPanelAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Controle global das integrações para todos os usuários.
        </p>
      </div>
      {data ? (
        <GoogleSyncPanel initial={data} />
      ) : (
        <p className="text-sm text-destructive">{error ?? 'Erro ao carregar a integração'}</p>
      )}
    </div>
  );
}
