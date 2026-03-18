import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { EmpresaBroadcastForm } from '@/components/empresa/broadcast/empresa-broadcast-form';

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function ComunicadoPage({ params }: PageProps) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Verify the user is a company admin
  const companiesRes = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers,
    cache: 'no-store',
  });
  if (!companiesRes.ok) redirect('/dashboard');

  const companies: Array<{ companyId: string; role: string }> = await companiesRes.json();
  const company = companies.find((c) => c.companyId === companyId);
  if (!company || company.role !== 'admin') redirect(`/empresa/${companyId}/inicio`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunicados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envie mensagens para todos os membros da empresa ou para workspaces específicos.
        </p>
      </div>
      <EmpresaBroadcastForm companyId={companyId} />
    </div>
  );
}
