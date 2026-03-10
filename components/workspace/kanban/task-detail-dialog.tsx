'use client';

import { useEffect, useActionState, useTransition, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Trash2, X } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateTaskAction, UpdateTaskActionState } from '@/actions/projeto/update-task.action';
import { deleteTaskAction } from '@/actions/projeto/delete-task.action';
import type { KanbanTask } from './kanban-card';
import type { WorkspaceMember } from './kanban-board';

interface TaskDetailDialogProps {
  task: KanbanTask | null;
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  membros: WorkspaceMember[];
  onClose: () => void;
}

const initialState: UpdateTaskActionState = {};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function TaskDetailDialog({
  task,
  projectId,
  workspaceId,
  isAdmin,
  membros,
  onClose,
}: TaskDetailDialogProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateTaskAction, initialState);
  const [deletePending, startDelete] = useTransition();
  const onCloseRef = useRef(onClose);

  // Estado local para o responsável selecionado (controlado fora do form)
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(
    task?.assignee?.id ?? '',
  );
  // Estado para filtro de busca no dropdown
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);

  // Sincronizar assignee quando task muda
  useEffect(() => {
    setSelectedAssigneeId(task?.assignee?.id ?? '');
    setMemberSearch('');
    setMemberDropdownOpen(false);
  }, [task?.id, task?.assignee?.id]);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (state.success) {
      onCloseRef.current();
      router.refresh();
    }
    // router é estável; state.success é o único gatilho real
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function handleDelete() {
    if (!task) return;
    startDelete(async () => {
      const result = await deleteTaskAction(projectId, task.id, workspaceId);
      if (!result.error) {
        onClose();
        router.refresh();
      }
    });
  }

  if (!task) return null;

  const selectedMember = membros.find((m) => m.id === selectedAssigneeId);
  const filteredMembros = membros.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes da task</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="taskId" value={task.id} />
          {/* Campo oculto com o responsável selecionado */}
          <input type="hidden" name="assigneeId" value={selectedAssigneeId} />

          <div className="space-y-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              name="title"
              defaultValue={task.title}
              placeholder="Título da task"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição</Label>
            <textarea
              id="task-description"
              name="description"
              defaultValue={task.description ?? ''}
              placeholder="Descrição (opcional)"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Prioridade</Label>
              <Select name="priority" defaultValue={task.priority}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>

              {/* Trigger do dropdown de membros */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMemberDropdownOpen((v) => !v)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {selectedMember ? (
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium flex-shrink-0">
                        {getInitials(selectedMember.name)}
                      </span>
                      <span className="truncate">{selectedMember.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sem responsável</span>
                  )}
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </button>

                {memberDropdownOpen && (
                  <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md">
                    {/* Campo de busca */}
                    <div className="p-2 border-b">
                      <Input
                        autoFocus
                        placeholder="Buscar membro..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto py-1">
                      {/* Opção de remover responsável */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssigneeId('');
                          setMemberDropdownOpen(false);
                          setMemberSearch('');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                        Sem responsável
                        {!selectedAssigneeId && <Check className="h-3.5 w-3.5 ml-auto" />}
                      </button>

                      {filteredMembros.length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Nenhum membro encontrado
                        </p>
                      )}

                      {filteredMembros.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            setSelectedAssigneeId(member.id);
                            setMemberDropdownOpen(false);
                            setMemberSearch('');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium flex-shrink-0">
                            {getInitials(member.name)}
                          </span>
                          <span className="flex flex-col items-start min-w-0">
                            <span className="truncate font-medium">{member.name}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {member.email}
                            </span>
                          </span>
                          {selectedAssigneeId === member.id && (
                            <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-start">Data início</Label>
              <Input
                id="task-start"
                name="startDate"
                type="date"
                defaultValue={task.startDate ? task.startDate.split('T')[0] : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due">Prazo</Label>
              <Input
                id="task-due"
                name="dueDate"
                type="date"
                defaultValue={task.dueDate ? task.dueDate.split('T')[0] : ''}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Reporter: {task.reporter.name}
          </p>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center justify-between pt-2">
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deletePending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A task <strong>{task.title}</strong> será removida permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
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

            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
