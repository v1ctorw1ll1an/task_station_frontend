import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Building2 } from 'lucide-react';
import { logoutAction } from '@/actions/logout.action';
import { selectCompanyAction } from '@/actions/select-company.action';
import { Button } from '@/components/ui/button';

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  workspace_admin: 'Admin de Workspace',
  member: 'Membro',
};

export default async function SelecionarEmpresaPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.mustResetPassword) redirect('/first-access');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Erro ao carregar empresas.</p>
      </div>
    );
  }

  const companies: Array<{ companyId: string; legalName: string; role: string }> =
    await res.json();

  // Sem empresa vinculada
  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-semibold">Sem acesso</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Você não está vinculado a nenhuma empresa. Entre em contato com o administrador da
            plataforma.
          </p>
          <form action={logoutAction}>
            <Button variant="outline" type="submit">Sair</Button>
          </form>
        </div>
      </div>
    );
  }

  // Seletor de empresa
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Selecione a empresa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha com qual empresa deseja trabalhar.
          </p>
        </div>

        <div className="space-y-2">
          {companies.map((company) => (
            <form key={company.companyId} action={selectCompanyAction.bind(null, company.companyId)}>
              <button
                type="submit"
                className="w-full flex items-center justify-between rounded-lg border p-4 hover:bg-muted transition-colors group text-left"
              >
                <div>
                  <p className="font-medium text-sm">{company.legalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[company.role] ?? company.role}
                  </p>
                </div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  →
                </span>
              </button>
            </form>
          ))}
        </div>

        <div className="text-center">
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
