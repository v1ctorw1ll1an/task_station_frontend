'use client';

import { useState, useTransition } from 'react';
import {
  Settings2,
  Building2,
  LayoutGrid,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  getMemberRolesAction,
  MemberRolesResult,
  WorkspaceRole,
} from '@/actions/empresa/get-member-roles.action';
import { promoteAdminAction } from '@/actions/empresa/promote-admin.action';
import { revokeAdminAction } from '@/actions/empresa/revoke-admin.action';
import {
  setWorkspaceMemberRoleAction,
  WorkspaceMemberRole,
} from '@/actions/empresa/set-workspace-member-role.action';
import {
  restrictProjectAction,
  unrestrictProjectAction,
} from '@/actions/empresa/restrict-project.action';
import {
  setProjectAdminAction,
  revokeProjectAdminAction,
} from '@/actions/empresa/set-project-admin.action';

interface RolesModalProps {
  companyId: string;
  userId: string;
  userName: string;
  onChanged: () => void;
}

function WorkspaceRoleRow({
  ws,
  isPending,
  isCompanyAdmin,
  onRoleChange,
  onProjectRestrict,
  onProjectAdmin,
}: {
  ws: WorkspaceRole;
  isPending: boolean;
  isCompanyAdmin: boolean;
  onRoleChange: (workspaceId: string, role: string | null) => void;
  onProjectRestrict: (workspaceId: string, projectId: string, isRestricted: boolean) => void;
  onProjectAdmin: (workspaceId: string, projectId: string, isAdmin: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const currentRole = ws.role as WorkspaceMemberRole;
  const hasAccess = currentRole !== null;
  const isWorkspaceAdmin = currentRole === 'workspace_admin';
  const hasProjects = ws.projects.length > 0;

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          {hasAccess && hasProjects ? (
            <button
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setExpanded((v) => !v)}
              disabled={isPending}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <p className="text-sm font-medium truncate">{ws.workspaceName}</p>
          {!ws.isActive && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Inativo
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {hasAccess ? 'Acesso' : 'Restrito'}
            </span>
            <Switch
              checked={hasAccess}
              disabled={isPending || isCompanyAdmin}
              onCheckedChange={(checked) =>
                onRoleChange(ws.workspaceId, checked ? 'member' : null)
              }
            />
          </div>

          {hasAccess && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Admin</span>
              <Switch
                checked={currentRole === 'workspace_admin'}
                disabled={isPending || isCompanyAdmin}
                onCheckedChange={(checked) =>
                  onRoleChange(ws.workspaceId, checked ? 'workspace_admin' : 'member')
                }
              />
            </div>
          )}
        </div>
      </div>

      {expanded && hasAccess && hasProjects && (
        <div className="divide-y border-t">
          {ws.projects.map((p) => (
            <div
              key={p.projectId}
              className="flex items-center justify-between px-4 py-2.5 pl-9"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span
                  className={`text-sm truncate ${p.isRestricted ? 'text-muted-foreground line-through' : ''}`}
                >
                  {p.projectName}
                </span>
                {!p.isActive && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Inativo
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {!isWorkspaceAdmin && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Admin</span>
                    <Switch
                      checked={p.isProjectAdmin}
                      disabled={isPending || p.isRestricted}
                      onCheckedChange={(checked) =>
                        onProjectAdmin(ws.workspaceId, p.projectId, checked)
                      }
                    />
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {p.isRestricted ? 'Restrito' : 'Acesso'}
                  </span>
                  <Switch
                    checked={!p.isRestricted}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      onProjectRestrict(ws.workspaceId, p.projectId, !checked)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RolesModal({ companyId, userId, userName, onChanged }: RolesModalProps) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<MemberRolesResult | null>(null);
  const [localRoles, setLocalRoles] = useState<MemberRolesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmPromoteAdmin, setConfirmPromoteAdmin] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  async function loadRoles() {
    setLoading(true);
    setError(null);
    const result = await getMemberRolesAction(companyId, userId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setRoles(result.data);
      setLocalRoles(structuredClone(result.data));
    }
  }

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      void loadRoles();
    } else {
      setRoles(null);
      setLocalRoles(null);
      setError(null);
    }
  }

  const hasChanges =
    localRoles !== null &&
    roles !== null &&
    JSON.stringify(localRoles) !== JSON.stringify(roles);

  // Local: company admin toggle
  function handleLocalCompanyAdminToggle(checked: boolean) {
    if (checked) {
      setConfirmPromoteAdmin(true);
    } else {
      setLocalRoles((prev) => (prev ? { ...prev, companyRole: null } : prev));
    }
  }

  function handleConfirmPromote() {
    setConfirmPromoteAdmin(false);
    setLocalRoles((prev) => (prev ? { ...prev, companyRole: 'admin' } : prev));
  }

  // Local: workspace role
  function handleLocalRoleChange(workspaceId: string, role: string | null) {
    setLocalRoles((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workspaceRoles: prev.workspaceRoles.map((ws) =>
          ws.workspaceId === workspaceId ? { ...ws, role } : ws,
        ),
      };
    });
  }

  // Local: project restriction (restricting also clears project admin)
  function handleLocalProjectRestrict(
    workspaceId: string,
    projectId: string,
    isRestricted: boolean,
  ) {
    setLocalRoles((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workspaceRoles: prev.workspaceRoles.map((ws) => {
          if (ws.workspaceId !== workspaceId) return ws;
          return {
            ...ws,
            projects: ws.projects.map((p) => {
              if (p.projectId !== projectId) return p;
              return { ...p, isRestricted, isProjectAdmin: isRestricted ? false : p.isProjectAdmin };
            }),
          };
        }),
      };
    });
  }

  // Local: project admin
  function handleLocalProjectAdmin(workspaceId: string, projectId: string, isAdmin: boolean) {
    setLocalRoles((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workspaceRoles: prev.workspaceRoles.map((ws) => {
          if (ws.workspaceId !== workspaceId) return ws;
          return {
            ...ws,
            projects: ws.projects.map((p) =>
              p.projectId === projectId ? { ...p, isProjectAdmin: isAdmin } : p,
            ),
          };
        }),
      };
    });
  }

  // Apply all diffs to the API
  function handleSave() {
    if (!roles || !localRoles) return;
    setError(null);
    startTransition(async () => {
      // Company admin
      const wasAdmin = roles.companyRole === 'admin';
      const isNowAdmin = localRoles.companyRole === 'admin';
      if (wasAdmin !== isNowAdmin) {
        const result = isNowAdmin
          ? await promoteAdminAction(companyId, userId)
          : await revokeAdminAction(companyId, userId);
        if (result?.error) {
          setError(result.error);
          await loadRoles();
          return;
        }
      }

      // Workspace roles
      for (const localWs of localRoles.workspaceRoles) {
        const origWs = roles.workspaceRoles.find((w) => w.workspaceId === localWs.workspaceId);
        if (!origWs || localWs.role === origWs.role) continue;
        const result = await setWorkspaceMemberRoleAction(
          companyId,
          localWs.workspaceId,
          userId,
          localWs.role as WorkspaceMemberRole,
        );
        if (result?.error) {
          setError(result.error);
          await loadRoles();
          return;
        }
      }

      // Project restrictions and admins
      for (const localWs of localRoles.workspaceRoles) {
        const origWs = roles.workspaceRoles.find((w) => w.workspaceId === localWs.workspaceId);
        if (!origWs) continue;
        for (const localP of localWs.projects) {
          const origP = origWs.projects.find((p) => p.projectId === localP.projectId);
          if (!origP) continue;

          if (localP.isRestricted !== origP.isRestricted) {
            const result = localP.isRestricted
              ? await restrictProjectAction(
                  companyId,
                  localWs.workspaceId,
                  localP.projectId,
                  userId,
                )
              : await unrestrictProjectAction(
                  companyId,
                  localWs.workspaceId,
                  localP.projectId,
                  userId,
                );
            if (result?.error) {
              setError(result.error);
              await loadRoles();
              return;
            }
          }

          if (localP.isProjectAdmin !== origP.isProjectAdmin) {
            const result = localP.isProjectAdmin
              ? await setProjectAdminAction(
                  companyId,
                  localWs.workspaceId,
                  localP.projectId,
                  userId,
                )
              : await revokeProjectAdminAction(
                  companyId,
                  localWs.workspaceId,
                  localP.projectId,
                  userId,
                );
            if (result?.error) {
              setError(result.error);
              await loadRoles();
              return;
            }
          }
        }
      }

      onChanged();
      await loadRoles();
    });
  }

  const isCompanyAdmin = localRoles?.companyRole === 'admin';

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Gerenciar papéis">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Papéis de {userName}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1 -mr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error && !roles ? (
            <p className="text-sm text-destructive py-4">{error}</p>
          ) : localRoles ? (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground -mt-1">
                Defina o papel de {userName} por workspace e controle o acesso a projetos
                específicos.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Empresa
                </div>
                <div className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className={`h-4 w-4 ${isCompanyAdmin ? 'text-primary' : 'text-muted-foreground'}`}
                    />
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
                    onCheckedChange={handleLocalCompanyAdminToggle}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  Workspaces e projetos
                </div>

                {localRoles.workspaceRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Esta empresa ainda não possui workspaces.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {isCompanyAdmin && (
                      <p className="text-xs text-muted-foreground">
                        Admin da empresa já tem acesso total a todos os workspaces. O dropdown fica
                        desativado enquanto este papel estiver ativo.
                      </p>
                    )}
                    {localRoles.workspaceRoles.map((ws) => (
                      <WorkspaceRoleRow
                        key={ws.workspaceId}
                        ws={ws}
                        isPending={isPending}
                        isCompanyAdmin={isCompanyAdmin}
                        onRoleChange={handleLocalRoleChange}
                        onProjectRestrict={handleLocalProjectRestrict}
                        onProjectAdmin={handleLocalProjectAdmin}
                      />
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">
                      ▸ Clique na seta de um workspace para gerenciar projetos.
                      <br />
                      Use o toggle de <strong>Acesso</strong> para liberar ou restringir um
                      workspace inteiro. Use os toggles de projeto para restringir projetos
                      individuais.
                    </p>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </div>
          ) : null}
        </div>

        {localRoles && !loading && (
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => handleOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={() => setConfirmSave(true)} disabled={!hasChanges || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

      {/* Confirmação: promover a admin */}
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
                  Esta ação só pode ser revertida pelo superadmin da plataforma.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmPromote}
            >
              Entendi, promover mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação: salvar alterações */}
      <AlertDialog open={confirmSave} onOpenChange={setConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações de papéis de <strong>{userName}</strong> serão aplicadas imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmSave(false);
                handleSave();
              }}
            >
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
