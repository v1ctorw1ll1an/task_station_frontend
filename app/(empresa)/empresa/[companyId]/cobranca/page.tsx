import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { CobrancaPanel } from '@/components/empresa/cobranca/cobranca-panel';
import { RetornoDoCheckout } from '@/components/empresa/cobranca/retorno-do-checkout';
import { suporteConfig } from '@/lib/suporte';

interface PageProps {
  params: Promise<{ companyId: string }>;
  /** `?checkout=sucesso|cancelado|expirado` — a volta da página de pagamento do Asaas. */
  searchParams: Promise<{ checkout?: string }>;
}

const RETORNOS = ['sucesso', 'cancelado', 'expirado'] as const;

export default async function CobrancaPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { companyId } = await params;
  const { checkout } = await searchParams;
  const retorno = RETORNOS.find((r) => r === checkout);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const authHeader = { Authorization: `Bearer ${session.token}` };

  // Só admin da empresa (ou superusuário) acessa a cobrança (R2).
  const companiesRes = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers: authHeader,
    cache: 'no-store',
  });
  const companies = companiesRes.ok ? await companiesRes.json() : [];
  const company = companies.find((c: { companyId: string }) => c.companyId === companyId);
  const isAdmin = session.user.isSuperuser || company?.role === 'admin';
  if (!isAdmin) redirect(`/empresa/${companyId}/inicio`);

  const [statusRes, histRes] = await Promise.all([
    fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}`, { headers: authHeader, cache: 'no-store' }),
    fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}/historico?limit=50`, {
      headers: authHeader,
      cache: 'no-store',
    }),
  ]);

  if (!statusRes.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Planos</h1>
        <p className="text-muted-foreground">Não foi possível carregar as informações do plano.</p>
      </div>
    );
  }

  const status = await statusRes.json();
  const { data: charges } = histRes.ok ? await histRes.json() : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie o plano, os usuários e o histórico de pagamentos da empresa.
        </p>
      </div>

      {retorno && <RetornoDoCheckout companyId={companyId} resultado={retorno} />}

      <CobrancaPanel
        companyId={companyId}
        status={status}
        charges={charges}
        suporte={suporteConfig()}
      />
    </div>
  );
}
