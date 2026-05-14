import { create } from 'zustand';
import type { KanbanTask } from '@/components/workspace/kanban/kanban-card';
import type { KanbanColumn, WorkspaceMember } from '@/components/workspace/kanban/kanban-board';
import type { ProjectLabel } from '@/actions/projeto/get-labels.action';

// ── Tipos de payload dos eventos socket ──────────────────────────────────────

export interface TaskCreatedPayload {
  task: KanbanTask;
  columnId: string;
}

export interface TaskUpdatedPayload {
  task: KanbanTask;
  actorId: string;
}

export interface TaskMovedPayload {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
  afterTaskId: string | null;
  actorId: string;
}

export interface TaskDeletedPayload {
  taskId: string;
  columnId: string;
  actorId: string;
}

export interface TaskRestoredPayload {
  task: KanbanTask;
  columnId: string;
}

export interface ColumnCreatedPayload {
  column: KanbanColumn;
}

export interface ColumnUpdatedPayload {
  columnId: string;
  changes: { name?: string; color?: string | null };
}

export interface ColumnReorderedPayload {
  orderedColumnIds: string[];
}

export interface ColumnDeletedPayload {
  columnId: string;
  targetColumnId: string | null;
  movedTaskIds: string[];
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface KanbanState {
  projectId: string | null;
  currentUserId: string | null;
  columns: KanbanColumn[];
  labels: ProjectLabel[];
  membros: WorkspaceMember[];

  // Hidratação: chamado no mount do KanbanBoard com os dados do servidor
  hydrate: (data: {
    projectId: string;
    currentUserId: string;
    columns: KanbanColumn[];
    labels: ProjectLabel[];
    membros: WorkspaceMember[];
  }) => void;

  // Mutações locais para drag-drop otimista
  setColumns: (cols: KanbanColumn[]) => void;
  optimisticMoveTask: (
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    afterTaskId: string | null,
  ) => void;
  optimisticReorderColumns: (orderedIds: string[]) => void;

  // Pagination: append more tasks to a column (load-more)
  appendColumnTasks: (columnId: string, tasks: KanbanTask[]) => void;

  // Handlers para eventos do socket
  applyTaskCreated: (payload: TaskCreatedPayload) => void;
  applyTaskUpdated: (payload: TaskUpdatedPayload) => void;
  applyTaskMoved: (payload: TaskMovedPayload) => void;
  applyTaskDeleted: (payload: TaskDeletedPayload) => void;
  applyTaskRestored: (payload: TaskRestoredPayload) => void;
  applyColumnCreated: (payload: ColumnCreatedPayload) => void;
  applyColumnUpdated: (payload: ColumnUpdatedPayload) => void;
  applyColumnReordered: (payload: ColumnReorderedPayload) => void;
  applyColumnDeleted: (payload: ColumnDeletedPayload) => void;
}

// ── Helper: insere task após afterTaskId (ou no início se null) ───────────────

function insertTask(tasks: KanbanTask[], task: KanbanTask, afterTaskId: string | null): KanbanTask[] {
  const without = tasks.filter((t) => t.id !== task.id);
  if (afterTaskId === null) return [task, ...without];
  const idx = without.findIndex((t) => t.id === afterTaskId);
  if (idx === -1) return [...without, task];
  const result = [...without];
  result.splice(idx + 1, 0, task);
  return result;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  projectId: null,
  currentUserId: null,
  columns: [],
  labels: [],
  membros: [],

  hydrate: (data) =>
    set({
      projectId: data.projectId,
      currentUserId: data.currentUserId,
      columns: data.columns,
      labels: data.labels,
      membros: data.membros,
    }),

  setColumns: (cols) => set({ columns: cols }),

  optimisticMoveTask: (taskId, fromColumnId, toColumnId, afterTaskId) =>
    set((state) => {
      const task = state.columns
        .find((c) => c.id === fromColumnId)
        ?.tasks.find((t) => t.id === taskId);
      if (!task) return state;

      const updatedTask = { ...task, columnId: toColumnId };
      return {
        columns: state.columns.map((col) => {
          if (col.id === fromColumnId && col.id !== toColumnId) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
          }
          if (col.id === toColumnId) {
            return { ...col, tasks: insertTask(col.tasks, updatedTask, afterTaskId) };
          }
          return col;
        }),
      };
    }),

  optimisticReorderColumns: (orderedIds) =>
    set((state) => {
      const colMap = new Map(state.columns.map((c) => [c.id, c]));
      return { columns: orderedIds.map((id) => colMap.get(id)!).filter(Boolean) };
    }),

  appendColumnTasks: (columnId, tasks) =>
    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id !== columnId) return col;
        const existingIds = new Set(col.tasks.map((t) => t.id));
        const fresh = tasks.filter((t) => !existingIds.has(t.id));
        return { ...col, tasks: [...col.tasks, ...fresh] };
      }),
    })),

  // ── Socket handlers ──────────────────────────────────────────────────────────

  applyTaskCreated: ({ task, columnId }) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col,
      ),
    })),

  applyTaskUpdated: ({ task }) => {
    // Sempre aplica: o dialog detecta conflito via task.updatedAt se houver edição em curso
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === task.columnId
          ? { ...col, tasks: col.tasks.map((t) => (t.id === task.id ? task : t)) }
          : col,
      ),
    }));
  },

  applyTaskMoved: ({ taskId, fromColumnId, toColumnId, afterTaskId }) => {
    // Seguro sem actor-skip: para cross-column, após move otimístico a task não está mais
    // em fromColumnId → find() retorna undefined → no-op para o ator. Tab B aplica corretamente.
    const task = get()
      .columns.find((c) => c.id === fromColumnId)
      ?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, columnId: toColumnId };
    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id === fromColumnId && col.id !== toColumnId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
        }
        if (col.id === toColumnId) {
          return { ...col, tasks: insertTask(col.tasks, updatedTask, afterTaskId) };
        }
        return col;
      }),
    }));
  },

  applyTaskDeleted: ({ taskId, columnId }) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) } : col,
      ),
    })),

  applyTaskRestored: ({ task, columnId }) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col,
      ),
    })),

  applyColumnCreated: ({ column }) =>
    set((state) => ({ columns: [...state.columns, column] })),

  applyColumnUpdated: ({ columnId, changes }) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, ...changes } : col,
      ),
    })),

  applyColumnReordered: ({ orderedColumnIds }) =>
    set((state) => {
      const colMap = new Map(state.columns.map((c) => [c.id, c]));
      return { columns: orderedColumnIds.map((id) => colMap.get(id)!).filter(Boolean) };
    }),

  applyColumnDeleted: ({ columnId, targetColumnId, movedTaskIds }) =>
    set((state) => {
      const deletedCol = state.columns.find((c) => c.id === columnId);
      const movedTasks = deletedCol?.tasks.filter((t) => movedTaskIds.includes(t.id)) ?? [];

      return {
        columns: state.columns
          .filter((c) => c.id !== columnId)
          .map((col) => {
            if (targetColumnId && col.id === targetColumnId) {
              return { ...col, tasks: [...col.tasks, ...movedTasks.map((t) => ({ ...t, columnId: targetColumnId }))] };
            }
            return col;
          }),
      };
    }),
}));
