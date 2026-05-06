'use client';

import { useState, useTransition, useMemo } from 'react';
import { CalendarDays, Loader2, RotateCcw, Search, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getDeletedTasksAction, type DeletedTask } from '@/actions/projeto/get-deleted-tasks.action';
import { restoreTaskAction } from '@/actions/projeto/restore-task.action';
import { useRouter } from 'next/navigation';
import { usePrivacyStore } from '@/lib/stores/privacy-store';

const PRIORITY_LABELS: Record<DeletedTask['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const PRIORITY_CLASSES: Record<DeletedTask['priority'], string> = {
  low: 'text-slate-500 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
  medium: 'text-blue-600 bg-blue-50 border border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
  high: 'text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
  urgent: 'text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
};

interface TrashDialogProps {
  projectId: string;
  workspaceId: string;
}

export function TrashDialog({ projectId, workspaceId }: TrashDialogProps) {
  const router = useRouter();
  const isPrivacyMode = usePrivacyStore((s) => s.isPrivacyMode);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<DeletedTask[]>([]);
  const [search, setSearch] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startRestore] = useTransition();

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setSearch('');
      setError(null);
      setLoading(true);
      const result = await getDeletedTasksAction(projectId);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        setTasks(result.data ?? []);
      }
    }
  }

  function handleRestore(taskId: string) {
    setRestoringId(taskId);
    startRestore(async () => {
      const result = await restoreTaskAction(projectId, taskId, workspaceId);
      setRestoringId(null);
      if (result.error) {
        setError(result.error);
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        router.refresh();
      }
    });
  }

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q),
    );
  }, [tasks, search]);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" />
          Lixeira
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Lixeira
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Carregando...
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Trash2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {search ? 'Nenhuma task encontrada para essa busca.' : 'A lixeira está vazia.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {filteredTasks.map((task) => (
                <li key={task.id} className="py-3 px-1 flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium truncate${isPrivacyMode ? ' blur-sm select-none' : ''}`}>{task.title}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${PRIORITY_CLASSES[task.priority]}`}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Coluna:</span>
                        {task.column.name}
                      </span>

                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        {new Date(task.deletedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {task.taskLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.taskLabels.map(({ label }) => (
                          <span
                            key={label.id}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: label.color + '22',
                              color: label.color,
                              border: `1px solid ${label.color}55`,
                            }}
                          >
                            <Tag className="h-2.5 w-2.5 shrink-0" />
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    disabled={restoringId === task.id}
                    onClick={() => handleRestore(task.id)}
                  >
                    {restoringId === task.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5">Restaurar</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!loading && !error && tasks.length > 0 && (
          <p className="text-xs text-muted-foreground text-right border-t pt-2">
            {filteredTasks.length} de {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
