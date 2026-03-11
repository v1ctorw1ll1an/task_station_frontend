'use client';

import { useEffect, useActionState, useTransition, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Trash2, X } from 'lucide-react';
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
import {
  getTaskHistoryAction,
  type TaskHistoryEntry,
} from '@/actions/projeto/get-task-history.action';
import type { KanbanTask } from './kanban-card';
import type { WorkspaceMember, ProjectLabel } from './kanban-board';

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  priority: 'Prioridade',
  startDate: 'Data início',
  dueDate: 'Prazo',
  assignees: 'Responsáveis',
  labels: 'Labels',
  column: 'Coluna',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

function formatHistoryValue(field: string, value: string | null): string {
  if (value === null || value === '') return '(vazio)';
  if (field === 'priority') return PRIORITY_LABELS[value] ?? value;
  if (field === 'startDate' || field === 'dueDate') {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  return value;
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TaskDetailDialogProps {
  task: KanbanTask | null;
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  membros: WorkspaceMember[];
  labels: ProjectLabel[];
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

function TaskHistorySection({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTaskHistoryAction(projectId, taskId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [projectId, taskId]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Histórico de alterações</h3>
      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : history.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma alteração registrada.</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {history.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium mt-0.5">
                {getInitials(entry.user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-medium">{entry.user.name}</span>
                {' alterou '}
                <span className="font-medium">
                  {FIELD_LABELS[entry.field] ?? entry.field}
                </span>
                {': '}
                {entry.oldValue !== null ? (
                  <>
                    <span className="line-through text-muted-foreground">
                      {formatHistoryValue(entry.field, entry.oldValue)}
                    </span>
                    {' → '}
                    <span>{formatHistoryValue(entry.field, entry.newValue)}</span>
                  </>
                ) : (
                  <span>{formatHistoryValue(entry.field, entry.newValue)}</span>
                )}
                <div className="text-muted-foreground mt-0.5">{formatHistoryDate(entry.changedAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskDetailDialog({
  task,
  projectId,
  workspaceId,
  isAdmin,
  membros,
  labels,
  onClose,
}: TaskDetailDialogProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateTaskAction, initialState);
  const [deletePending, startDelete] = useTransition();
  const onCloseRef = useRef(onClose);

  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    task?.taskAssignees.map((ta) => ta.user.id) ?? [],
  );
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);

  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    task?.taskLabels.map((tl) => tl.label.id) ?? [],
  );

  useEffect(() => {
    setSelectedAssigneeIds(task?.taskAssignees.map((ta) => ta.user.id) ?? []);
    setMemberSearch('');
    setMemberDropdownOpen(false);
    setSelectedLabelIds(task?.taskLabels.map((tl) => tl.label.id) ?? []);
  }, [task?.id]);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (state.success) {
      onCloseRef.current();
      router.refresh();
    }
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

  function toggleAssignee(id: string) {
    setSelectedAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (!task) return null;

  const filteredMembros = membros.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  const selectedMembers = membros.filter((m) => selectedAssigneeIds.includes(m.id));

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da task</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="taskId" value={task.id} />
          {selectedAssigneeIds.map((id) => (
            <input key={id} type="hidden" name="assigneeIds[]" value={id} />
          ))}

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
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      Baixa
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      Média
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      Alta
                    </span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      Urgente
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsáveis</Label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMemberDropdownOpen((v) => !v)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {selectedMembers.length > 0 ? (
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="flex -space-x-1 shrink-0">
                        {selectedMembers.slice(0, 3).map((m) => (
                          <span
                            key={m.id}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background"
                          >
                            {getInitials(m.name)}
                          </span>
                        ))}
                      </span>
                      <span className="truncate text-xs ml-1">
                        {selectedMembers.length === 1
                          ? selectedMembers[0].name
                          : `${selectedMembers.length} responsáveis`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sem responsável</span>
                  )}
                  <span className="text-muted-foreground text-xs shrink-0 ml-1">▾</span>
                </button>

                {memberDropdownOpen && (
                  <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md">
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
                      {selectedAssigneeIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssigneeIds([]);
                            setMemberSearch('');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remover todos
                        </button>
                      )}

                      {filteredMembros.length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Nenhum membro encontrado
                        </p>
                      )}

                      {filteredMembros.map((member) => {
                        const isSelected = selectedAssigneeIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleAssignee(member.id)}
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
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs"
                        onClick={() => setMemberDropdownOpen(false)}
                      >
                        Fechar
                      </Button>
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

          {selectedLabelIds.map((id) => (
            <input key={id} type="hidden" name="labelIds[]" value={id} />
          ))}

          {labels.length > 0 && (
            <div className="space-y-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() =>
                        setSelectedLabelIds((prev) =>
                          isSelected ? prev.filter((id) => id !== label.id) : [...prev, label.id],
                        )
                      }
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-opacity ${isSelected ? 'opacity-100 ring-2' : 'opacity-50'}`}
                      style={{
                        backgroundColor: label.color + '22',
                        color: label.color,
                        border: `1px solid ${label.color}55`,
                        ringColor: label.color,
                      }}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Reporter: {task.reporter.name}
          </p>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="border-t pt-4">
            <TaskHistorySection projectId={projectId} taskId={task.id} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
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
