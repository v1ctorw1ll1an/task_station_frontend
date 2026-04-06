'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Filter,
  MoreVertical,
  Palette,
  Pencil,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { updateColunaColorAction } from '@/actions/projeto/update-coluna-color.action';
import { updateColunaDoneAction } from '@/actions/projeto/update-coluna-done.action';
import { deleteColunaAction } from '@/actions/projeto/delete-coluna.action';
import { COLUMN_COLORS } from '@/lib/column-colors';
import type { KanbanColumn } from './kanban-board';
import type { ProjectLabel } from '@/actions/projeto/get-labels.action';
import type { KanbanSortState } from './kanban-column';

interface ColumnOptionsMenuProps {
  column: KanbanColumn;
  allColumns: KanbanColumn[];
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  labels: ProjectLabel[];
  sortState: KanbanSortState;
  filterLabelIds: string[];
  hasActiveFilters: boolean;
  onSortChange: (sort: KanbanSortState) => void;
  onFilterLabelToggle: (labelId: string) => void;
  onClearFilters: () => void;
}

const initialRenameState: UpdateColunaActionState = {};

export function ColumnOptionsMenu({
  column,
  allColumns,
  projectId,
  workspaceId,
  isAdmin,
  labels,
  sortState,
  filterLabelIds,
  hasActiveFilters,
  onSortChange,
  onFilterLabelToggle,
  onClearFilters,
}: ColumnOptionsMenuProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(column.color ?? null);
  const [colorPending, startColor] = useTransition();
  const [colorError, setColorError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDelete] = useTransition();
  const [donePending, startDone] = useTransition();

  const [renameState, renameFormAction, isRenamePending] = useActionState(
    updateColunaAction,
    initialRenameState,
  );

  useEffect(() => {
    if (renameState.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRenameOpen(false);
      router.refresh();
    }
  }, [renameState.success, router]);

  const hasTasks = column.tasks.length > 0;
  const otherColumns = allColumns.filter((c) => c.id !== column.id);

  function handleSaveColor() {
    setColorError(null);
    startColor(async () => {
      const result = await updateColunaColorAction(projectId, column.id, workspaceId, selectedColor);
      if (result.error) {
        setColorError(result.error);
      } else {
        setColorOpen(false);
        router.refresh();
      }
    });
  }

  function handleToggleDone() {
    startDone(async () => {
      await updateColunaDoneAction(projectId, column.id, workspaceId, !column.isDone);
      router.refresh();
    });
  }

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
          <Button
            variant="ghost"
            size="sm"
            className={['h-6 w-6 p-0', hasActiveFilters ? 'text-primary' : ''].filter(Boolean).join(' ')}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 overflow-y-auto"
          style={{ maxHeight: 'var(--radix-dropdown-menu-content-available-height)' }}
        >

          {/* Ordenação por data */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" />
            Ordenar por data
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onSortChange({ ...sortState, dueDate: sortState.dueDate === 'asc' ? null : 'asc' })}
          >
            <ArrowUp className="mr-2 h-3.5 w-3.5" />
            Mais próxima primeiro
            {sortState.dueDate === 'asc' && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSortChange({ ...sortState, dueDate: sortState.dueDate === 'desc' ? null : 'desc' })}
          >
            <ArrowDown className="mr-2 h-3.5 w-3.5" />
            Mais distante primeiro
            {sortState.dueDate === 'desc' && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Ordenação por urgência */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3" />
            Ordenar por urgência
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onSortChange({ ...sortState, priority: sortState.priority === 'desc' ? null : 'desc' })}
          >
            <ArrowUp className="mr-2 h-3.5 w-3.5" />
            Mais urgente primeiro
            {sortState.priority === 'desc' && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSortChange({ ...sortState, priority: sortState.priority === 'asc' ? null : 'asc' })}
          >
            <ArrowDown className="mr-2 h-3.5 w-3.5" />
            Menos urgente primeiro
            {sortState.priority === 'asc' && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>

          {/* Filtro por label */}
          {labels.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Filter className="h-3 w-3" />
                Filtrar por label
              </DropdownMenuLabel>
              {labels.map((label) => {
                const active = filterLabelIds.includes(label.id);
                return (
                  <DropdownMenuItem
                    key={label.id}
                    onClick={() => onFilterLabelToggle(label.id)}
                  >
                    <span
                      className="mr-2 h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="truncate">{label.name}</span>
                    {active && <Check className="ml-auto h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                );
              })}
            </>
          )}

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClearFilters} className="text-muted-foreground">
                <X className="mr-2 h-3.5 w-3.5" />
                Limpar filtros
              </DropdownMenuItem>
            </>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSelectedColor(column.color ?? null); setColorOpen(true); }}>
                <Palette className="mr-2 h-3.5 w-3.5" />
                Cor da coluna
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleDone} disabled={donePending}>
                {column.isDone ? (
                  <>
                    <Circle className="mr-2 h-3.5 w-3.5" />
                    Desmarcar como coluna de tasks concluídas
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-green-500" />
                    Definir como coluna de tasks concluídas
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Excluir coluna
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de cor da coluna */}
      <Dialog open={colorOpen} onOpenChange={setColorOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cor da coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setSelectedColor(c.value)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c.value,
                    borderColor: selectedColor === c.value ? 'white' : 'transparent',
                    boxShadow: selectedColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                  }}
                />
              ))}
            </div>

            {/* Preview */}
            {selectedColor && (
              <div
                className="rounded-md px-3 py-2 text-sm font-semibold border-l-4"
                style={{
                  backgroundColor: `${selectedColor}1A`,
                  borderLeftColor: selectedColor,
                  color: selectedColor,
                }}
              >
                {column.name}
              </div>
            )}

            {/* Remover cor */}
            {selectedColor && (
              <button
                type="button"
                onClick={() => setSelectedColor(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Remover cor
              </button>
            )}

            {colorError && <p className="text-sm text-destructive">{colorError}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setColorOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveColor} disabled={colorPending}>
                {colorPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
