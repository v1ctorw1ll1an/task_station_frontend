'use client';

import { useState, useTransition } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KanbanCard, type KanbanTask } from './kanban-card';
import { ColumnOptionsMenu } from './column-options-menu';
import { createTaskAction } from '@/actions/projeto/create-task.action';
import type { KanbanColumn } from './kanban-board';

interface KanbanColumnProps {
  column: KanbanColumn;
  allColumns: KanbanColumn[];
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  onTaskClick: (task: KanbanTask) => void;
}

export function KanbanColumnComponent({
  column,
  allColumns,
  projectId,
  workspaceId,
  isAdmin,
  onTaskClick,
}: KanbanColumnProps) {
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addPending, startAdd] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column', column },
    disabled: !isAdmin,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddError(null);

    const formData = new FormData();
    formData.set('projectId', projectId);
    formData.set('workspaceId', workspaceId);
    formData.set('columnId', column.id);
    formData.set('title', newTaskTitle.trim());

    startAdd(async () => {
      const result = await createTaskAction({}, formData);
      if (result.error) {
        setAddError(result.error);
      } else {
        setNewTaskTitle('');
        setAddingTask(false);
      }
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex w-72 flex-shrink-0 flex-col rounded-lg border bg-muted/40',
        isDragging ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing"
        {...(isAdmin ? { ...attributes, ...listeners } : {})}
      >
        <div className="flex items-center gap-2">
          {column.color && (
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
          )}
          <span className="text-sm font-semibold">{column.name}</span>
          <span className="text-xs text-muted-foreground">({column.tasks.length})</span>
        </div>
        {isAdmin && (
          <ColumnOptionsMenu
            column={column}
            allColumns={allColumns}
            projectId={projectId}
            workspaceId={workspaceId}
          />
        )}
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2 px-3 py-1 flex-1 min-h-[40px]">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
      </div>

      {/* Footer — adicionar task */}
      <div className="px-3 pb-3 pt-1">
        {addingTask ? (
          <form onSubmit={handleAddTask} className="space-y-1.5">
            <Input
              autoFocus
              placeholder="Título da task"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setAddingTask(false)}
              disabled={addPending}
            />
            {addError && <p className="text-xs text-destructive">{addError}</p>}
            <div className="flex gap-1">
              <Button type="submit" size="sm" disabled={addPending || !newTaskTitle.trim()}>
                {addPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingTask(false);
                  setNewTaskTitle('');
                  setAddError(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground text-xs"
            onClick={() => setAddingTask(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar task
          </Button>
        )}
      </div>
    </div>
  );
}
