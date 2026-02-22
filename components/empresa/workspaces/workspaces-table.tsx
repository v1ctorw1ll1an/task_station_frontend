'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
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
}: {
  workspace: Workspace;
  companyId: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateWorkspaceAction, initialUpdateState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Editar workspace">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
                  <TableCell className="font-medium">{ws.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ws.description ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ws.isActive ? 'default' : 'secondary'}>
                      {ws.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ws.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditWorkspaceDialog workspace={ws} companyId={companyId} />

                      {ws.isActive ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionPending}
                              title="Inativar workspace"
                            >
                              <PowerOff className="h-4 w-4 text-orange-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Inativar workspace?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O workspace <strong>{ws.name}</strong> ficará inativo. Membros não
                                conseguirão acessá-lo. Esta ação pode ser revertida.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeactivate(ws.id)}>
                                Inativar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionPending}
                              title="Reativar workspace"
                            >
                              <Power className="h-4 w-4 text-green-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reativar workspace?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O workspace <strong>{ws.name}</strong> voltará a ficar ativo e seus
                                membros poderão acessá-lo novamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleActivate(ws.id)}>
                                Reativar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionPending}
                            title="Excluir workspace"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
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
                              onClick={() => handleDelete(ws.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
