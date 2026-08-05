import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Webhook } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { SubscriptionsTable } from '@/components/superadmin/financeiro/subscriptions-table';
import {
  RevenueCards,
  type RevenueSummary,
} from '@/components/superadmin/financeiro/revenue-cards';

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = 20;

  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  query.set('page', String(page));
  query.set('limit', String(limit));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };
  const [res, resumoRes] = await Promise.all([
    fetch(`${apiUrl}/api/v1/superadmin/financeiro/assinaturas?${query.toString()}`, {
      headers,
      cache: 'no-store',
    }),
    fetch(`${apiUrl}/api/v1/superadmin/financeiro/resumo`, { headers, cache: 'no-store' }),
  ]);
  const { data, total } = res.ok ? await res.json() : { data: [], total: 0 };
  // O resumo é complementar: se falhar, a lista continua servindo.
  const resumo: RevenueSummary | null = resumoRes.ok ? await resumoRes.json() : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assinaturas, cobranças e webhooks de todas as empresas.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/superadmin/financeiro/webhooks">
            <Webhook className="h-4 w-4 mr-1" />
            Log de webhooks
          </Link>
        </Button>
      </div>

      <RevenueCards resumo={resumo} />

      <SubscriptionsTable data={data} total={total} page={page} limit={limit} />
    </div>
  );
}
