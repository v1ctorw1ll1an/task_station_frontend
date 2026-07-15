'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TaskDetailDialog } from '@/components/workspace/kanban/task-detail-dialog';
import { computeTaskPrefix } from '@/components/workspace/kanban/kanban-board';
import { getTaskByIdAction } from '@/actions/projeto/get-task-by-id.action';
import { getProjectMembrosAction } from '@/actions/projeto/get-project-membros.action';
import { getLabelsAction } from '@/actions/projeto/get-labels.action';
import { notifyAgendaChanged } from '@/lib/agenda-events';
import type { KanbanTask } from '@/components/workspace/kanban/kanban-card';
import type { WorkspaceMember } from '@/components/workspace/kanban/kanban-board';
import type { ProjectLabel } from '@/actions/projeto/get-labels.action';
import type { TaskDueCardData } from '@/components/home/task-due-card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface AgendaTaskDialogProps {
  task: TaskDueCardData | null;
  currentUserId: string;
  onClose: () => void;
}

export function AgendaTaskDialog({ task, currentUserId, onClose }: AgendaTaskDialogProps) {
  const [fullTask, setFullTask] = useState<KanbanTask | null>(null);
  const [membros, setMembros] = useState<WorkspaceMember[]>([]);
  const [labels, setLabels] = useState<ProjectLabel[]>([]);
  const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);

  const loading = !!task && loadedTaskId !== task.id;

  useEffect(() => {
    if (!task) return;
    let active = true;
    Promise.all([
      getTaskByIdAction(task.project.id, task.id),
      getProjectMembrosAction(task.project.id),
      getLabelsAction(task.project.id),
    ]).then(([t, m, l]) => {
      if (!active) return;
      setFullTask(t);
      setMembros(m);
      setLabels(l);
      setLoadedTaskId(task.id);
    });
    return () => { active = false; };
  }, [task]);

  const open = !!task;

  if (!open) return null;

  const taskPrefix = computeTaskPrefix(task.project.name);

  if (loading || !fullTask) {
    return (
      <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Carregando task…</DialogTitle>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <TaskDetailDialog
      key={fullTask.id}
      task={fullTask}
      taskPrefix={taskPrefix}
      projectId={task.project.id}
      workspaceId={task.project.workspace.id}
      isAdmin
      membros={membros}
      labels={labels}
      currentUserId={currentUserId}
      onClose={onClose}
      onSaved={notifyAgendaChanged}
    />
  );
}
