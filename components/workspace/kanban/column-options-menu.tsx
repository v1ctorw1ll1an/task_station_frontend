'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateColunaAction, UpdateColunaActionState } from '@/actions/projeto/update-coluna.action';
import { deleteColunaAction } from '@/actions/projeto/delete-coluna.action';
import type { KanbanColumn } from './kanban-board';

interface ColumnOptionsMenuProps {
  column: KanbanColumn;
  allColumns: KanbanColumn[];
  projectId: string;
  workspaceId: string;
}

const initialRenameState: UpdateColunaActionState = {};

export function ColumnOptionsMenu({
  column,
  allColumns,
  projectId,
  workspaceId,
}: ColumnOptionsMenuProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDelete] = useTransition();

  const [renameState, renameFormAction, isRenamePending] = useActionState(
    updateColunaAction,
    initialRenameState,
  );

  useEffect(() => {
    if (renameState.success) {
      setRenameOpen(false);
      router.refresh();
    }
  }, [renameState.success, router]);

  const hasTasks = column.tasks.length > 0;
  const otherColumns = allColumns.filter((c) => c.id !== column.id);

  function handleDelete() {
    if (hasTasks && !targetColumnId) {
      setDeleteError('Selecione uma coluna de destino para as tasks existentes');
      return;
    }
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteColunaAction(
        projectId,
        column.id,
        workspaceId,
        hasTasks ? targetColumnId : undefined,
      );
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setDeleteOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Excluir coluna
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de renomear */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear coluna</DialogTitle>
          </DialogHeader>
          <form action={renameFormAction} className="space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="columnId" value={column.id} />
            <div className="space-y-2">
              <Label htmlFor="rename-col">Nome</Label>
              <Input
                id="rename-col"
                name="name"
                defaultValue={column.name}
                placeholder="Nome da coluna"
                autoFocus
              />
            </div>
            {renameState.error && (
              <p className="text-sm text-destructive">{renameState.error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isRenamePending}>
                {isRenamePending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de exclusão */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna &quot;{column.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasTasks
                ? `Esta coluna possui ${column.tasks.length} task(s). Selecione uma coluna de destino.`
                : 'A coluna será removida permanentemente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {hasTasks && (
            <div className="space-y-2 px-1">
              <Label>Mover tasks para</Label>
              <Select value={targetColumnId} onValueChange={setTargetColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma coluna" />
                </SelectTrigger>
                <SelectContent>
                  {otherColumns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
