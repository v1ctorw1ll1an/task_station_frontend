'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Power, PowerOff, Trash2 } from 'lucide-react';
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
import { activateProjetoAction } from '@/actions/workspace/activate-projeto.action';
import { deactivateProjetoAction } from '@/actions/workspace/deactivate-projeto.action';
import { deleteProjetoAction } from '@/actions/workspace/delete-projeto.action';
import { EditProjetoDialog } from '@/components/workspace/kanban/edit-projeto-dialog';

interface Projeto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  icon?: string | null;
  iconColor?: string | null;
}

export function ProjetosTable({
  data,
  total,
  page,
  limit,
  workspaceId,
  isAdmin = false,
}: ProjetosTableProps) {
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

  function handleActivate(projectId: string) {
    setActionError(null);
    startAction(async () => {
      const result = await activateProjetoAction(workspaceId, projectId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleDeactivate(projectId: string) {
    setActionError(null);
    startAction(async () => {
      const result = await deactivateProjetoAction(workspaceId, projectId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleDelete(projectId: string) {
    setActionError(null);
    startAction(async () => {
      const result = await deleteProjetoAction(workspaceId, projectId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
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
      )}

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              {isAdmin && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((projeto) => (
                <TableRow key={projeto.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/workspace/${workspaceId}/projetos/${projeto.id}`}
                      className="hover:underline"
                    >
                      {projeto.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {projeto.description ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={projeto.isActive ? 'default' : 'secondary'}>
                      {projeto.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(projeto.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditProjetoDialog
                        projectId={projeto.id}
                        workspaceId={workspaceId}
                        currentName={projeto.name}
                        currentDescription={projeto.description}
                        currentIcon={projeto.icon}
                        currentIconColor={projeto.iconColor}
                      />

                      {projeto.isActive ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionPending}
                              title="Inativar projeto"
                            >
                              <PowerOff className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Inativar projeto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O projeto <strong>{projeto.name}</strong> ficará inativo. Esta ação
                                pode ser revertida.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeactivate(projeto.id)}>
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
                              title="Reativar projeto"
                            >
                              <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reativar projeto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O projeto <strong>{projeto.name}</strong> voltará a ficar ativo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleActivate(projeto.id)}>
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
                            title="Excluir projeto"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir projeto permanentemente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Todas as colunas e tasks do projeto{' '}
                              <strong>{projeto.name}</strong> serão removidas. Esta ação não pode
                              ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(projeto.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} projeto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
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
