'use client';

import { useEffect, useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, UserMinus, PowerOff, Trash2 } from 'lucide-react';
import { updateCompanyAction, UpdateCompanyActionState } from '@/actions/superadmin/update-company.action';
import { deactivateCompanyAction } from '@/actions/superadmin/deactivate-company.action';
import { deleteCompanyAction } from '@/actions/superadmin/delete-company.action';
import { deactivateMembershipAction } from '@/actions/superadmin/deactivate-membership.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface CompanyDetailProps {
  company: {
    id: string;
    legalName: string;
    taxId: string;
    isActive: boolean;
    workspacesCount: number;
    projectsCount: number;
  };
  admins: Admin[];
}

const initialState: UpdateCompanyActionState = {};

export function CompanyDetail({ company, admins }: CompanyDetailProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateCompanyAction, initialState);
  const [dangerPending, startDanger] = useTransition();
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      router.refresh();
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success, router]);

  function handleDeactivate() {
    startDanger(async () => {
      await deactivateCompanyAction(company.id);
      router.refresh();
    });
  }

  function handleDelete() {
    startDanger(async () => {
      await deleteCompanyAction(company.id);
      router.push('/superadmin/empresas');
    });
  }

  async function handleDeactivateMembership(membershipId: string) {
    setRemovingId(membershipId);
    setMembershipError(null);
    const result = await deactivateMembershipAction(company.id, membershipId);
    if (result.error) {
      setMembershipError(result.error);
    } else {
      router.refresh();
    }
    setRemovingId(null);
  }

  return (
    <div className="space-y-8">
      {/* Dados da empresa */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={company.id} />

        <div className="space-y-2">
          <Label htmlFor="legalName">Razão social</Label>
          <Input
            id="legalName"
            name="legalName"
            defaultValue={company.legalName}
            placeholder="Razão social da empresa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">CNPJ</Label>
          <Input
            id="taxId"
            name="taxId"
            defaultValue={company.taxId}
            placeholder="00000000000000"
            maxLength={14}
          />
          <p className="text-xs text-muted-foreground">
            Somente números, sem pontuação.
          </p>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {showSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Dados atualizados com sucesso.
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>

      <Separator />

      {/* Métricas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Visão geral</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold">{company.workspacesCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {company.workspacesCount === 1 ? 'Workspace' : 'Workspaces'}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold">{company.projectsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {company.projectsCount === 1 ? 'Projeto' : 'Projetos'}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Administradores */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Administradores</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Usuários com acesso de administração nesta empresa.
          </p>
        </div>

        {membershipError && (
          <p className="text-sm text-destructive">{membershipError}</p>
        )}

        {admins.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Nenhum administrador cadastrado.
          </p>
        ) : (
          <div className="rounded-md border divide-y">
            {admins.map((admin) => (
              <div key={admin.membershipId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{admin.user.name}</p>
                  <p className="text-xs text-muted-foreground">{admin.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Vínculo desde {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.user.isActive ? 'default' : 'secondary'} className="text-xs">
                    {admin.user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {admin.role === 'admin' ? 'Administrador' : admin.role}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removingId === admin.membershipId}
                        title="Inativar acesso à empresa"
                      >
                        <UserMinus className="h-4 w-4 text-orange-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Inativar acesso de administrador?</AlertDialogTitle>
                        <AlertDialogDescription>
                          <strong>{admin.user.name}</strong> perderá o acesso de administração
                          nesta empresa. Esta ação não pode ser desfeita por aqui — um novo
                          cadastro de membro seria necessário para restabelecer o acesso.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeactivateMembership(admin.membershipId)}
                        >
                          Inativar acesso
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Zona de perigo */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-destructive">Zona de perigo</h3>

        {company.isActive && (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium">Inativar empresa</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A empresa ficará inativa mas não será excluída. Dados são preservados.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={dangerPending}>
                  <PowerOff className="h-4 w-4 mr-1 text-orange-500" />
                  Inativar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Inativar empresa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A empresa será marcada como inativa. Esta ação pode ser revertida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivate}>Inativar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
          <div>
            <p className="text-sm font-medium">Excluir empresa</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A empresa será excluída permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={dangerPending}>
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir empresa permanentemente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos os dados vinculados a esta empresa serão removidos. Esta ação
                  não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
