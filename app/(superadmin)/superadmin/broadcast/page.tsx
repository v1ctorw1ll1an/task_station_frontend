import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { SuperadminBroadcastForm } from '@/components/superadmin/broadcast/superadmin-broadcast-form';

export default async function BroadcastPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunicados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envie mensagens para todos os usuários ou para empresas específicas.
        </p>
      </div>
      <SuperadminBroadcastForm />
    </div>
  );
}
