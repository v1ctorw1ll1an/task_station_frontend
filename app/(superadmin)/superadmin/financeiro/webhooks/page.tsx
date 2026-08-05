import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { WebhooksTable } from '@/components/superadmin/financeiro/webhooks-table';

interface PageProps {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}

export default async function WebhooksPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = 30;

  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.type) query.set('type', params.type);
  query.set('page', String(page));
  query.set('limit', String(limit));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/superadmin/financeiro/webhooks?${query.toString()}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });
  const { data, total } = res.ok ? await res.json() : { data: [], total: 0 };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
          <Link href="/superadmin/financeiro">
            <ChevronLeft className="h-4 w-4" />
            Financeiro
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Log de webhooks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Eventos recebidos do Asaas e como foram processados.
        </p>
      </div>

      <WebhooksTable data={data} total={total} page={page} limit={limit} />
    </div>
  );
}
