'use client';

import { useState, useTransition } from 'react';
import { Settings2, Building2, LayoutGrid, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { getMemberRolesAction, MemberRolesResult } from '@/actions/empresa/get-member-roles.action';
import { promoteAdminAction } from '@/actions/empresa/promote-admin.action';
import { revokeAdminAction } from '@/actions/empresa/revoke-admin.action';
import { promoteWorkspaceAdminAction } from '@/actions/empresa/promote-workspace-admin.action';
import { revokeWorkspaceAdminAction } from '@/actions/empresa/revoke-workspace-admin.action';

interface RolesModalProps {
  companyId: string;
  userId: string;
  userName: string;
  onChanged: () => void;
}

export function RolesModal({ companyId, userId, userName, onChanged }: RolesModalProps) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<MemberRolesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmPromoteAdmin, setConfirmPromoteAdmin] = useState(false);

  async function loadRoles() {
    setLoading(true);
    setError(null);
    const result = await getMemberRolesAction(companyId, userId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setRoles(result.data);
    }
  }

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      void loadRoles();
    } else {
      setRoles(null);
      setError(null);
    }
  }

  function handleToggleCompanyAdmin(isAdmin: boolean) {
    setError(null);
    startTransition(async () => {
      const result = isAdmin
        ? await promoteAdminAction(companyId, userId)
        : await revokeAdminAction(companyId, userId);
      if (result?.error) {
        setError(result.error);
      } else {
        onChanged();
        await loadRoles();
      }
    });
  }

  function handleToggleWorkspaceAdmin(workspaceId: string, currentRole: string | null) {
    setError(null);
    const isCurrentlyAdmin = currentRole === 'workspace_admin';
    startTransition(async () => {
      const result = isCurrentlyAdmin
        ? await revokeWorkspaceAdminAction(companyId, workspaceId, userId)
        : await promoteWorkspaceAdminAction(companyId, workspaceId, userId);
      if (result?.error) {
        setError(result.error);
      } else {
        onChanged();
        await loadRoles();
      }
    });
  }

  const isCompanyAdmin = roles?.companyRole === 'admin';

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Gerenciar papéis">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Papéis adicionais de {userName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-4">{error}</p>
        ) : roles ? (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground -mt-1">
              {userName} já é membro desta empresa. Conceda ou revogue papéis adicionais de
              administração abaixo.
            </p>

            {/* ── Admin da empresa ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Empresa
              </div>
              <div className="flex items-center justify-between rounded-md border px-4 py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`h-4 w-4 ${isCompanyAdmin ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">Admin da empresa</p>
                    <p className="text-xs text-muted-foreground">
                      Acesso total à empresa, workspaces e membros
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isCompanyAdmin}
                  disabled={isPending}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setConfirmPromoteAdmin(true);
                    } else {
                      handleToggleCompanyAdmin(false);
                    }
                  }}
                />
              </div>
            </div>

            <Separator />

            {/* ── Admin por workspace ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                Workspaces
              </div>

              {roles.workspaceRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Esta empresa ainda não possui workspaces.
                </p>
              ) : (
                <>
                  <div className="rounded-md border divide-y">
                    {roles.workspaceRoles.map((ws) => {
                      const isWsAdmin = ws.role === 'workspace_admin';
                      return (
                        <div
                          key={ws.workspaceId}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-medium truncate">{ws.workspaceName}</p>
                            {!ws.isActive && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {isWsAdmin ? 'Admin' : '—'}
                            </span>
                            <Switch
                              checked={isWsAdmin}
                              disabled={isPending || isCompanyAdmin}
                              title={
                                isCompanyAdmin
                                  ? 'Admin da empresa já tem acesso total a todos os workspaces'
                                  : undefined
                              }
                              onCheckedChange={() =>
                                handleToggleWorkspaceAdmin(ws.workspaceId, ws.role)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {isCompanyAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Admin da empresa já tem acesso total a todos os workspaces. Os toggles ficam
                      desativados enquanto este papel estiver ativo.
                    </p>
                  )}
                </>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : null}
      </DialogContent>

      {/* Confirmação antes de promover a admin da empresa */}
      <AlertDialog open={confirmPromoteAdmin} onOpenChange={setConfirmPromoteAdmin}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Promover {userName} a administrador?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Ao promover <strong className="text-foreground">{userName}</strong> a{' '}
                  <strong className="text-foreground">administrador da empresa</strong>, ele terá:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Acesso total a todos os workspaces e membros da empresa</li>
                  <li>Capacidade de adicionar, remover e alterar qualquer membro</li>
                  <li>Capacidade de criar, editar e excluir workspaces</li>
                  <li>Os mesmos privilégios que você possui atualmente</li>
                </ul>
                <p className="font-medium text-foreground">
                  Você não terá mais controle sobre as ações de {userName} como administrador.
                  Esta ação só pode ser revertida pelo superadmin da plataforma.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmPromoteAdmin(false);
                handleToggleCompanyAdmin(true);
              }}
            >
              Entendi, promover mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
