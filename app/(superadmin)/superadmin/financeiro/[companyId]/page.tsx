import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { CompanyBillingPanel } from '@/components/superadmin/financeiro/company-billing-panel';

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CompanyFinanceiroPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { companyId } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/superadmin/financeiro/empresas/${companyId}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  const backLink = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
      <Link href="/superadmin/financeiro">
        <ChevronLeft className="h-4 w-4" />
        Financeiro
      </Link>
    </Button>
  );

  if (!res.ok) {
    return (
      <div className="space-y-4">
        {backLink}
        <p className="text-muted-foreground">Empresa não encontrada ou sem assinatura.</p>
      </div>
    );
  }

  const detail = await res.json();

  return (
    <div className="space-y-6">
      <div>
        {backLink}
        <h1 className="text-2xl font-bold">{detail.company?.legalName ?? 'Empresa'}</h1>
        {detail.company?.taxId && (
          <p className="text-sm font-mono text-muted-foreground mt-1">{detail.company.taxId}</p>
        )}
      </div>

      <CompanyBillingPanel companyId={companyId} detail={detail} />
    </div>
  );
}
