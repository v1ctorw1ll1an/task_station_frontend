'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, Users, LayoutList, ExternalLink, Trash2 } from 'lucide-react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  updateWorkspaceAction,
  UpdateWorkspaceActionState,
} from '@/actions/empresa/update-workspace.action';
import { deleteWorkspaceAction } from '@/actions/empresa/delete-workspace.action';
import type { SidebarWorkspace } from './workspace-nav-item';

interface WorkspaceSettingsDialogProps {
  workspace: SidebarWorkspace;
  /**
   * Admin do workspace (ou da empresa). Quem não é continua abrindo o diálogo — a
   * Visão geral mora aqui e não é tela restrita —, mas sem renomear nem gerenciar
   * membros. Padrão `false`: quem não informa a permissão não ganha a permissão.
   */
  isAdmin?: boolean;
  /** Só admins da empresa podem excluir workspaces (CompanyAdminGuard no backend). */
  canDelete?: boolean;
}

const initialState: UpdateWorkspaceActionState = {};

export function WorkspaceSettingsDialog({
  workspace,
  isAdmin = false,
  canDelete = false,
}: WorkspaceSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [state, formAction, isPending] = useActionState(updateWorkspaceAction, initialState);
  const [, startClose] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      startClose(() => {
        setOpen(false);
        router.refresh();
      });
    }
  }, [state.success, router]);

  function handleDelete() {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteWorkspaceAction(workspace.companyId, workspace.workspaceId);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setOpen(false);
      // Se o usuário está dentro do workspace excluído, sai dele.
      if (pathname.startsWith(`/workspace/${workspace.workspaceId}`)) {
        router.push('/dashboard');
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Configurações do workspace"
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
          suppressHydrationWarning
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="truncate">
            Configurações — {workspace.workspaceName}
          </DialogTitle>
        </DialogHeader>

        {isAdmin && (
          <>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="companyId" value={workspace.companyId} />
              <input type="hidden" name="workspaceId" value={workspace.workspaceId} />

              <div className="space-y-2">
                <Label htmlFor="ws-name">Nome</Label>
                <Input
                  id="ws-name"
                  name="name"
                  defaultValue={workspace.workspaceName}
                  placeholder="Nome do workspace"
                  autoFocus
                />
              </div>

              {state.error && <p className="text-sm text-destructive">{state.error}</p>}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>

            <Separator />
          </>
        )}

        <div className="space-y-1">
          <Link
            href={`/workspace/${workspace.workspaceId}/visao-geral`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <LayoutList className="h-4 w-4" />
              Visão geral
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-50" />
          </Link>

          {isAdmin && (
            <Link
              href={`/workspace/${workspace.workspaceId}/membros`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gerenciar membros
              </span>
              <ExternalLink className="h-3.5 w-3.5 opacity-50" />
            </Link>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Excluindo...' : 'Excluir workspace'}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir workspace?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O workspace <strong>{workspace.workspaceName}</strong> e todos os seus projetos
                    e tasks serão removidos. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
