import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserDetailForm } from '@/components/superadmin/usuarios/user-detail-form';
import { UserCredentialActions } from '@/components/superadmin/usuarios/user-credential-actions';
import { UserCompanyMemberships } from '@/components/superadmin/usuarios/user-company-memberships';

interface Membership {
  id: string;
  role: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  company: {
    id: string;
    legalName: string;
    taxId: string;
    isActive: boolean;
  } | null;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  isSuperuser: boolean;
  mustResetPassword: boolean;
  createdAt: string;
  updatedAt: string;
  memberships: Membership[];
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/superadmin/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  if (res.status === 404) notFound();
  if (!res.ok) redirect('/superadmin/usuarios');

  const user: UserDetail = await res.json();
  const isSelf = session.user.id === user.id;

  const companyMemberships = user.memberships.filter((m) => m.company !== null);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href="/superadmin/usuarios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para usuários
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={user.isActive ? 'default' : 'secondary'}>
              {user.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
            {user.isSuperuser && <Badge variant="outline">Superusuário</Badge>}
            {user.mustResetPassword && (
              <Badge variant="secondary">Deve redefinir senha</Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Cadastrado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <Separator />

      {/* Formulário de edição — somente para outros usuários */}
      {isSelf ? (
        <p className="text-sm text-muted-foreground">
          Para editar seu próprio perfil, acesse{' '}
          <Link href="/superadmin/perfil" className="underline underline-offset-4">
            Meu perfil
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Dados pessoais</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edite os dados do usuário. Campos em branco não serão alterados.
            </p>
          </div>
          <UserDetailForm
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              isActive: user.isActive,
              isSelf,
            }}
          />
        </div>
      )}

      <Separator />

      {/* Credenciais — apenas para outros usuários */}
      {!isSelf && (
        <>
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Credenciais de acesso</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Invalide as credenciais do usuário para forçar um novo acesso via magic link. Use
                também para obter o link de primeiro acesso de usuários recém-criados.
              </p>
            </div>
            <UserCredentialActions
              userId={user.id}
              mustResetPassword={user.mustResetPassword}
            />
          </div>

          <Separator />
        </>
      )}

      {/* Empresas vinculadas */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Empresas vinculadas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Empresas das quais este usuário é membro. Administradores podem ter o papel revogado
            pelo superadmin.
          </p>
        </div>
        <UserCompanyMemberships userId={user.id} memberships={companyMemberships} />
      </div>
    </div>
  );
}
