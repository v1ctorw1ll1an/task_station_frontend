'use client';

import { useState, useTransition, useMemo } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KanbanCard, type KanbanTask } from './kanban-card';
import { ColumnOptionsMenu } from './column-options-menu';
import { createTaskAction } from '@/actions/projeto/create-task.action';
import { moveTaskAction } from '@/actions/projeto/move-task.action';
import type { KanbanColumn } from './kanban-board';
import type { ProjectLabel } from '@/actions/projeto/get-labels.action';

export type SortOption = 'default' | 'dueDate_asc' | 'dueDate_desc' | 'priority_desc' | 'priority_asc';

const PRIORITY_ORDER: Record<KanbanTask['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface KanbanColumnProps {
  column: KanbanColumn;
  allColumns: KanbanColumn[];
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  labels: ProjectLabel[];
  onTaskClick: (taskId: string) => void;
}

export function KanbanColumnComponent({
  column,
  allColumns,
  projectId,
  workspaceId,
  isAdmin,
  labels,
  onTaskClick,
}: KanbanColumnProps) {
  const [addPosition, setAddPosition] = useState<'top' | 'bottom' | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addPending, startAdd] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column', column },
    disabled: !isAdmin,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayedTasks = useMemo(() => {
    let tasks = [...column.tasks];

    if (filterLabelIds.length > 0) {
      tasks = tasks.filter((task) =>
        task.taskLabels.some((tl) => filterLabelIds.includes(tl.label.id)),
      );
    }

    if (sortOption === 'dueDate_asc') {
      tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortOption === 'dueDate_desc') {
      tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      });
    } else if (sortOption === 'priority_desc') {
      tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    } else if (sortOption === 'priority_asc') {
      tasks.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
    }

    return tasks;
  }, [column.tasks, sortOption, filterLabelIds]);

  const hasActiveFilters = sortOption !== 'default' || filterLabelIds.length > 0;

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddError(null);

    const currentPosition = addPosition;
    const formData = new FormData();
    formData.set('projectId', projectId);
    formData.set('workspaceId', workspaceId);
    formData.set('columnId', column.id);
    formData.set('title', newTaskTitle.trim());

    startAdd(async () => {
      const result = await createTaskAction({}, formData);
      if (result.error) {
        setAddError(result.error);
        return;
      }

      if (currentPosition === 'top' && result.taskId) {
        await moveTaskAction(projectId, result.taskId, workspaceId, column.id, null);
      }

      setNewTaskTitle('');
      setAddPosition(null);
    });
  }

  function toggleFilterLabel(id: string) {
    setFilterLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function clearFilters() {
    setSortOption('default');
    setFilterLabelIds([]);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex w-72 flex-shrink-0 flex-col rounded-lg border bg-muted/40 h-full',
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
          <span className="text-xs text-muted-foreground">
            ({filterLabelIds.length > 0 ? `${displayedTasks.length}/` : ''}{column.tasks.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setAddPosition('top')}
            title="Adicionar task no topo"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <ColumnOptionsMenu
            column={column}
            allColumns={allColumns}
            projectId={projectId}
            workspaceId={workspaceId}
            isAdmin={isAdmin}
            labels={labels}
            sortOption={sortOption}
            filterLabelIds={filterLabelIds}
            hasActiveFilters={hasActiveFilters}
            onSortChange={setSortOption}
            onFilterLabelToggle={toggleFilterLabel}
            onClearFilters={clearFilters}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2 px-3 py-1 flex-1 min-h-0 overflow-y-auto">
        {addPosition === 'top' && (
          <form onSubmit={handleAddTask} className="space-y-1.5">
            <Input
              autoFocus
              placeholder="Título da task"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (setAddPosition(null), setNewTaskTitle(''), setAddError(null))}
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
                onClick={() => { setAddPosition(null); setNewTaskTitle(''); setAddError(null); }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
        <SortableContext
          items={displayedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {displayedTasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={(t) => onTaskClick(t.id)} />
          ))}
        </SortableContext>
      </div>

      {/* Footer — adicionar task */}
      <div className="px-3 pb-3 pt-1">
        {addPosition === 'bottom' ? (
          <form onSubmit={handleAddTask} className="space-y-1.5">
            <Input
              autoFocus
              placeholder="Título da task"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (setAddPosition(null), setNewTaskTitle(''), setAddError(null))}
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
                onClick={() => { setAddPosition(null); setNewTaskTitle(''); setAddError(null); }}
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
            onClick={() => setAddPosition('bottom')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar task
          </Button>
        )}
      </div>
    </div>
  );
}
