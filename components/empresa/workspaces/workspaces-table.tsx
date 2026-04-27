'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect, startTransition } from 'react';
import { activateWorkspaceAction } from '@/actions/empresa/activate-workspace.action';
import { deactivateWorkspaceAction } from '@/actions/empresa/deactivate-workspace.action';
import { deleteWorkspaceAction } from '@/actions/empresa/delete-workspace.action';
import {
  updateWorkspaceAction,
  UpdateWorkspaceActionState,
} from '@/actions/empresa/update-workspace.action';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface WorkspacesTableProps {
  data: Workspace[];
  total: number;
  page: number;
  limit: number;
  companyId: string;
}

const initialUpdateState: UpdateWorkspaceActionState = {};

function EditWorkspaceDialog({
  workspace,
  companyId,
  open,
  onOpenChange,
}: {
  workspace: Workspace;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateWorkspaceAction, initialUpdateState);

  useEffect(() => {
    if (state.success) {
      startTransition(() => {
        onOpenChange(false);
        router.refresh();
      });
    }
  }, [state.success, router, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar workspace</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="workspaceId" value={workspace.id} />

          <div className="space-y-2">
            <Label htmlFor={`name-${workspace.id}`}>Nome</Label>
            <Input
              id={`name-${workspace.id}`}
              name="name"
              defaultValue={workspace.name}
              placeholder="Nome do workspace"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`desc-${workspace.id}`}>Descrição</Label>
            <Input
              id={`desc-${workspace.id}`}
              name="description"
              defaultValue={workspace.description ?? ''}
              placeholder="Descrição (opcional)"
            />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface WorkspaceRowActionsProps {
  workspace: Workspace;
  companyId: string;
  actionPending: boolean;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

function WorkspaceRowActions({
  workspace: ws,
  companyId,
  actionPending,
  onActivate,
  onDeactivate,
  onDelete,
}: WorkspaceRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      {/* Desktop: fileira inline */}
      <div className="hidden md:flex items-center justify-end gap-1">
        <Link href={`/workspace/${ws.id}/projetos`}>
          <Button variant="outline" size="sm" title="Acessar workspace">
            Acessar
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          title="Editar workspace"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={actionPending}
          title={ws.isActive ? 'Inativar workspace' : 'Reativar workspace'}
          onClick={() => setToggleOpen(true)}
        >
          {ws.isActive ? (
            <PowerOff className="h-4 w-4 text-orange-500 dark:text-orange-400" />
          ) : (
            <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={actionPending}
          title="Excluir workspace"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Mobile: dropdown 3 pontos */}
      <div className="md:hidden flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ações">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/workspace/${ws.id}/projetos`}>
                <ArrowRight className="mr-2 h-4 w-4" /> Acessar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setToggleOpen(true)}
              disabled={actionPending}
            >
              {ws.isActive ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4 text-orange-500 dark:text-orange-400" />
                  Inativar
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                  Reativar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              disabled={actionPending}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs controlados (compartilhados entre desktop e mobile) */}
      <EditWorkspaceDialog
        workspace={ws}
        companyId={companyId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <AlertDialogContent>
          {ws.isActive ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Inativar workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  O workspace <strong>{ws.name}</strong> ficará inativo. Membros não
                  conseguirão acessá-lo. Esta ação pode ser revertida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeactivate(ws.id)}>
                  Inativar
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Reativar workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  O workspace <strong>{ws.name}</strong> voltará a ficar ativo e seus
                  membros poderão acessá-lo novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onActivate(ws.id)}>
                  Reativar
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir workspace permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os projetos e tasks do workspace <strong>{ws.name}</strong>{' '}
              serão inacessíveis. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(ws.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function WorkspacesTable({
  data,
  total,
  page,
  limit,
  companyId,
}: WorkspacesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [actionPending, startAction] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const totalPages = Math.ceil(total / limit);

  function handleActivate(workspaceId: string) {
    setActionError(null);
    startAction(async () => {
      const result = await activateWorkspaceAction(companyId, workspaceId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleDeactivate(workspaceId: string) {
    setActionError(null);
    startAction(async () => {
      const result = await deactivateWorkspaceAction(companyId, workspaceId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleDelete(workspaceId: string) {
    setActionError(null);
    startAction(async () => {
      const result = await deleteWorkspaceAction(companyId, workspaceId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          defaultValue={searchParams.get('isActive') ?? 'all'}
          onValueChange={(val) =>
            updateParams({ isActive: val === 'all' ? undefined : val, page: '1' })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativo</SelectItem>
            <SelectItem value="false">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="rounded-md border overflow-hidden">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%] md:w-[20%]">Nome</TableHead>
              <TableHead className="hidden md:table-cell md:w-[35%]">Descrição</TableHead>
              <TableHead className="w-[25%] md:w-[10%]">Status</TableHead>
              <TableHead className="hidden md:table-cell md:w-[12%]">Criado em</TableHead>
              <TableHead className="w-[15%] md:w-[23%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum workspace encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((ws) => (
                <TableRow key={ws.id}>
                  <TableCell className="font-medium align-top">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="truncate">{ws.name}</span>
                      {ws.description && (
                        <span className="md:hidden text-xs font-normal text-muted-foreground line-clamp-2 break-words">
                          {ws.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {ws.description ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate cursor-default">
                              {ws.description}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-sm whitespace-normal break-words"
                          >
                            {ws.description}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ws.isActive ? 'default' : 'secondary'}>
                      {ws.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(ws.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <WorkspaceRowActions
                      workspace={ws}
                      companyId={companyId}
                      actionPending={actionPending}
                      onActivate={handleActivate}
                      onDeactivate={handleDeactivate}
                      onDelete={handleDelete}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} workspace{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
