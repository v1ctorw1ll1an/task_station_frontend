'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KanbanColumnComponent } from './kanban-column';
import { KanbanCard, type KanbanTask } from './kanban-card';
import { TaskDetailDialog } from './task-detail-dialog';
import { moveTaskAction } from '@/actions/projeto/move-task.action';
import { reorderColunasAction } from '@/actions/projeto/reorder-colunas.action';
import { createColunaAction, CreateColunaActionState } from '@/actions/projeto/create-coluna.action';
import type { ProjectLabel } from '@/actions/projeto/get-labels.action';
import { LabelsManager } from './labels-manager';
import { TrashDialog } from './trash-dialog';

export type { ProjectLabel };

export interface KanbanColumn {
  id: string;
  name: string;
  color: string | null;
  order: number;
  tasks: KanbanTask[];
}

interface KanbanData {
  columns: KanbanColumn[];
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
}

interface KanbanBoardProps {
  data: KanbanData;
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  membros: WorkspaceMember[];
  labels: ProjectLabel[];
  currentUserId: string;
}

const initialCreateColunaState: CreateColunaActionState = {};

export function KanbanBoard({ data, projectId, workspaceId, isAdmin, membros, labels, currentUserId }: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState<KanbanColumn[]>(data.columns);

  // Sincroniza com os dados do servidor após router.refresh()
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColumns(data.columns);
  }, [data.columns]);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Always derive from fresh server data so updates are reflected immediately
  const selectedTask = selectedTaskId
    ? data.columns.flatMap((c) => c.tasks).find((t) => t.id === selectedTaskId) ?? null
    : null;
  const [createColOpen, setCreateColOpen] = useState(false);
  const [, startTransition] = useTransition();

  const [createColunaState, createColunaFormAction, isCreateColPending] = useActionState(
    createColunaAction,
    initialCreateColunaState,
  );

  useEffect(() => {
    if (createColunaState.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreateColOpen(false);
      router.refresh();
    }
  }, [createColunaState.success, router]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // When dragging a column, only consider other columns as drop targets.
  // When dragging a task, use closestCenter across all droppables.
  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      if (activeColumnId) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (c) => c.data.current?.type === 'column',
          ),
        });
      }
      return closestCenter(args);
    },
    [activeColumnId],
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task as KanbanTask);
    } else if (active.data.current?.type === 'column') {
      setActiveColumnId(active.id as string);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type !== 'task') return;

    const activeTaskData = active.data.current.task as KanbanTask;
    const overId = over.id as string;

    // Encontrar coluna de destino
    let targetColumnId: string | null = null;
    if (over.data.current?.type === 'column') {
      targetColumnId = overId;
    } else if (over.data.current?.type === 'task') {
      const overTask = over.data.current.task as KanbanTask;
      targetColumnId = overTask.columnId;
    }

    if (!targetColumnId || targetColumnId === activeTaskData.columnId) return;

    // Mover task otimisticamente entre colunas
    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === activeTaskData.columnId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== activeTaskData.id) };
        }
        if (col.id === targetColumnId) {
          const updatedTask = { ...activeTaskData, columnId: targetColumnId! };
          return { ...col, tasks: [...col.tasks, updatedTask] };
        }
        return col;
      }),
    );
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      setActiveColumnId(null);

      if (!over) return;

      // Reordenar colunas
      if (active.data.current?.type === 'column' && over.data.current?.type === 'column') {
        const activeId = active.id as string;
        const overId = over.id as string;
        if (activeId === overId) return;

        const colIds = columns.map((c) => c.id);
        const newOrder = arrayMove(colIds, colIds.indexOf(activeId), colIds.indexOf(overId));

        setColumns((cols) => {
          const colMap = new Map(cols.map((c) => [c.id, c]));
          return newOrder.map((id) => colMap.get(id)!).filter(Boolean);
        });
        startTransition(async () => {
          await reorderColunasAction(projectId, workspaceId, newOrder);
          router.refresh();
        });
        return;
      }

      // Mover task
      if (active.data.current?.type === 'task') {
        const draggedTask = active.data.current.task as KanbanTask;
        const overId = over.id as string;

        let targetColumnId: string;
        let afterTaskId: string | null = null;

        if (over.data.current?.type === 'column') {
          // Dropped on column area — place at end
          targetColumnId = overId;
          const targetTasks = columns
            .find((c) => c.id === targetColumnId)
            ?.tasks.filter((t) => t.id !== draggedTask.id) ?? [];
          afterTaskId = targetTasks.length > 0 ? targetTasks[targetTasks.length - 1].id : null;
        } else if (over.data.current?.type === 'task') {
          const overTask = over.data.current.task as KanbanTask;
          targetColumnId = overTask.columnId;

          // Use arrayMove to compute the correct final position.
          // For same-column: columns state still has the original order (SortableContext handles visuals).
          // For cross-column: handleDragOver already appended the task at the end of the target column.
          const targetCol = columns.find((c) => c.id === targetColumnId)!;
          const colTaskIds = targetCol.tasks.map((t) => t.id);
          const fromIdx = colTaskIds.indexOf(draggedTask.id);
          const toIdx = colTaskIds.indexOf(overId);

          if (fromIdx !== -1 && toIdx !== -1) {
            const reordered = arrayMove(colTaskIds, fromIdx, toIdx);
            const newPos = reordered.indexOf(draggedTask.id);
            afterTaskId = newPos === 0 ? null : reordered[newPos - 1];
          } else {
            // Fallback: dragged task not found in target column yet (edge case)
            afterTaskId = overTask.id;
          }
        } else {
          return;
        }

        // Capture values for closure before startTransition
        const capturedTargetColumnId = targetColumnId;
        const capturedAfterTaskId = afterTaskId;
        const capturedDraggedTask = draggedTask;

        // Aplica o update visual imediatamente (sem transição)
        setColumns((cols) =>
          cols.map((col) => {
            if (col.id === capturedTargetColumnId) {
              const withoutDragged = col.tasks.filter((t) => t.id !== capturedDraggedTask.id);
              const updatedTask = { ...capturedDraggedTask, columnId: capturedTargetColumnId };
              if (capturedAfterTaskId === null) {
                return { ...col, tasks: [updatedTask, ...withoutDragged] };
              }
              const insertAfterIdx = withoutDragged.findIndex((t) => t.id === capturedAfterTaskId);
              const newTasks = [...withoutDragged];
              newTasks.splice(insertAfterIdx + 1, 0, updatedTask);
              return { ...col, tasks: newTasks };
            }
            if (col.id === capturedDraggedTask.columnId && col.id !== capturedTargetColumnId) {
              return { ...col, tasks: col.tasks.filter((t) => t.id !== capturedDraggedTask.id) };
            }
            return col;
          }),
        );

        startTransition(async () => {
          await moveTaskAction(projectId, capturedDraggedTask.id, workspaceId, capturedTargetColumnId, capturedAfterTaskId);
          router.refresh();
        });
      }
    },
    [columns, projectId, workspaceId, setColumns, startTransition, router],
  );

  const activeTaskData = activeTask
    ? columns.flatMap((c) => c.tasks).find((t) => t.id === activeTask.id) ?? activeTask
    : null;

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-2 gap-2">
          <TrashDialog projectId={projectId} workspaceId={workspaceId} />
          <LabelsManager projectId={projectId} workspaceId={workspaceId} labels={labels} />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row gap-4 overflow-x-auto pb-6 items-start">
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => (
              <KanbanColumnComponent
                key={col.id}
                column={col}
                allColumns={columns}
                projectId={projectId}
                workspaceId={workspaceId}
                isAdmin={isAdmin}
                labels={labels}
                onTaskClick={setSelectedTaskId}
              />
            ))}
          </SortableContext>

          {/* Botão de nova coluna */}
          {isAdmin && (
            <Dialog open={createColOpen} onOpenChange={setCreateColOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-72 flex-shrink-0 h-12 border-dashed text-muted-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova coluna
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Nova coluna</DialogTitle>
                </DialogHeader>
                <form action={createColunaFormAction} className="space-y-4">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <div className="space-y-2">
                    <Label htmlFor="new-col-name">Nome</Label>
                    <Input
                      id="new-col-name"
                      name="name"
                      placeholder="Ex: Em Review"
                      autoFocus
                    />
                  </div>
                  {createColunaState.error && (
                    <p className="text-sm text-destructive">{createColunaState.error}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateColOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreateColPending}>
                      {isCreateColPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <DragOverlay>
          {activeTaskData && (
            <KanbanCard task={activeTaskData} onClick={() => {}} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>

      <TaskDetailDialog
        key={selectedTask?.id ?? ''}
        task={selectedTask}
        projectId={projectId}
        workspaceId={workspaceId}
        isAdmin={isAdmin}
        membros={membros}
        labels={labels}
        currentUserId={currentUserId}
        onClose={() => {
          setSelectedTaskId(null);
          router.refresh();
        }}
      />
    </>
  );
}
