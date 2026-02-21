import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CompanyDetail } from '@/components/superadmin/empresas/company-detail';

interface Admin {
  membershipId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
}

interface CompanyDetailData {
  id: string;
  legalName: string;
  taxId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  admins: Admin[];
  workspacesCount: number;
  projectsCount: number;
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/superadmin/empresas/${id}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  if (res.status === 404) notFound();
  if (!res.ok) redirect('/superadmin/empresas');

  const company: CompanyDetailData = await res.json();

  // Formatar CNPJ para exibição: 00.000.000/0000-00
  const taxIdFormatted = company.taxId.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href="/superadmin/empresas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para empresas
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{company.legalName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">CNPJ: {taxIdFormatted}</p>
          </div>
          <Badge variant={company.isActive ? 'default' : 'secondary'} className="mt-1">
            {company.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Cadastrada em {new Date(company.createdAt).toLocaleDateString('pt-BR')} por{' '}
          {company.createdBy.name}
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Dados da empresa</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edite a razão social ou o CNPJ. Campos devem ser preenchidos corretamente.
          </p>
        </div>

        <CompanyDetail
          company={{
            id: company.id,
            legalName: company.legalName,
            taxId: company.taxId,
            isActive: company.isActive,
            workspacesCount: company.workspacesCount,
            projectsCount: company.projectsCount,
          }}
          admins={company.admins}
        />
      </div>
    </div>
  );
}
