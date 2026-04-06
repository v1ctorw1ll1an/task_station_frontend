'use client';

import { useState, useTransition, useMemo } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KanbanCard, type KanbanTask } from './kanban-card';
import { ColumnOptionsMenu } from './column-options-menu';
import { createTaskAction } from '@/actions/projeto/create-task.action';
import { moveTaskAction } from '@/actions/projeto/move-task.action';
import type { KanbanColumn } from './kanban-board';
import type { ProjectLabel } from '@/actions/projeto/get-labels.action';
import type { KanbanBoardFilterState } from './kanban-board-filter';

export interface KanbanSortState {
  dueDate: 'asc' | 'desc' | null;
  priority: 'desc' | 'asc' | null;
}

export const DEFAULT_SORT_STATE: KanbanSortState = { dueDate: null, priority: null };

const PRIORITY_ORDER: Record<KanbanTask['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function applySort(tasks: KanbanTask[], sort: KanbanSortState): KanbanTask[] {
  if (sort.dueDate === null && sort.priority === null) return tasks;
  return [...tasks].sort((a, b) => {
    if (sort.priority !== null) {
      const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (diff !== 0) return sort.priority === 'desc' ? diff : -diff;
    }
    if (sort.dueDate !== null) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return sort.dueDate === 'asc' ? diff : -diff;
    }
    return 0;
  });
}

interface KanbanColumnProps {
  column: KanbanColumn;
  allColumns: KanbanColumn[];
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  labels: ProjectLabel[];
  taskPrefix: string;
  boardFilter: KanbanBoardFilterState;
  onTaskClick: (taskId: string) => void;
}

export function KanbanColumnComponent({
  column,
  allColumns,
  projectId,
  workspaceId,
  isAdmin,
  labels,
  taskPrefix,
  boardFilter,
  onTaskClick,
}: KanbanColumnProps) {
  const [addPosition, setAddPosition] = useState<'top' | 'bottom' | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addPending, startAdd] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);
  const [localSort, setLocalSort] = useState<KanbanSortState>(DEFAULT_SORT_STATE);
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

    // Global: assignee filter
    if (boardFilter.filterAssigneeIds.length > 0) {
      tasks = tasks.filter((task) =>
        task.taskAssignees.some((ta) => boardFilter.filterAssigneeIds.includes(ta.user.id)),
      );
    }

    // Global: reporter filter
    if (boardFilter.filterReporterIds.length > 0) {
      tasks = tasks.filter((task) =>
        boardFilter.filterReporterIds.includes(task.reporter.id),
      );
    }

    // Global + local: label filter (union)
    const combinedLabelIds = [...new Set([...boardFilter.filterLabelIds, ...filterLabelIds])];
    if (combinedLabelIds.length > 0) {
      tasks = tasks.filter((task) =>
        task.taskLabels.some((tl) => combinedLabelIds.includes(tl.label.id)),
      );
    }

    // Global: search
    if (boardFilter.search) {
      const q = boardFilter.search.toLowerCase();
      tasks = tasks.filter((task) => task.title.toLowerCase().includes(q));
    }

    // Global: date filter
    if (boardFilter.dateFrom) {
      const dateTo = boardFilter.dateTo || boardFilter.dateFrom;
      const fields = boardFilter.dateFields.length > 0 ? boardFilter.dateFields : (['dueDate', 'startDate'] as const);
      tasks = tasks.filter((task) =>
        fields.some((field) => {
          const raw = task[field] as string | null;
          if (!raw) return false;
          const taskDate = raw.slice(0, 10);
          return taskDate >= boardFilter.dateFrom && taskDate <= dateTo;
        }),
      );
    }

    // Sort: global takes precedence when any dimension is set, otherwise use local
    const hasGlobalSort = boardFilter.sortState.dueDate !== null || boardFilter.sortState.priority !== null;
    const effectiveSort = hasGlobalSort ? boardFilter.sortState : localSort;

    tasks = applySort(tasks, effectiveSort);

    return tasks;
  }, [column.tasks, localSort, filterLabelIds, boardFilter]);

  const hasActiveLocalFilters = localSort.dueDate !== null || localSort.priority !== null || filterLabelIds.length > 0;

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
    setLocalSort(DEFAULT_SORT_STATE);
    setFilterLabelIds([]);
  }

  const headerStyle = column.color
    ? { backgroundColor: `${column.color}1A`, borderLeft: `4px solid ${column.color}` }
    : {};
  const nameStyle = column.color ? { color: column.color } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex w-64 md:w-72 flex-shrink-0 flex-col rounded-lg border bg-muted/40 h-full overflow-hidden',
        isDragging ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing rounded-t-lg"
        style={headerStyle}
        {...(isAdmin ? { ...attributes, ...listeners } : {})}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={nameStyle}>{column.name}</span>
          {column.isDone && (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
          )}
          <span className="text-xs text-muted-foreground">
            ({displayedTasks.length < column.tasks.length ? `${displayedTasks.length}/` : ''}{column.tasks.length})
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
            sortState={localSort}
            filterLabelIds={filterLabelIds}
            hasActiveFilters={hasActiveLocalFilters}
            onSortChange={setLocalSort}
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
            <KanbanCard key={task.id} task={task} taskPrefix={taskPrefix} onClick={(t) => onTaskClick(t.id)} columnIsDone={column.isDone} />
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
