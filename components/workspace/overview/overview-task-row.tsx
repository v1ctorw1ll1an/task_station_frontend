'use client';

import Link from 'next/link';
import type { OverviewTask, OverviewColumn } from '@/actions/workspace/get-workspace-overview.action';

const PRIORITY_CLASSES = {
  low: 'text-slate-500 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
  medium: 'text-blue-600 bg-blue-50 border border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
  high: 'text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
  urgent: 'text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
};

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function relativeDueDate(dueDate: string): string {
  const today = todayStr();
  const due = dueDate.split('T')[0];
  if (due < today) {
    const days = Math.round((new Date(today).getTime() - new Date(due).getTime()) / 86400000);
    return `há ${days}d`;
  }
  if (due === today) return 'hoje';
  const days = Math.round((new Date(due).getTime() - new Date(today).getTime()) / 86400000);
  return `em ${days}d`;
}

function relativeActivity(updatedAt: string): string {
  const today = todayStr();
  const updated = updatedAt.split('T')[0];
  if (updated >= today) return 'hoje';
  const days = Math.round((new Date(today).getTime() - new Date(updated).getTime()) / 86400000);
  return `há ${days}d`;
}

function AssigneeAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const src = photoUrl
    ? photoUrl.startsWith('http')
      ? photoUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${photoUrl}`
    : null;

  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background overflow-hidden"
      title={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

interface OverviewTaskRowProps {
  task: OverviewTask;
  column: OverviewColumn;
  projectId: string;
  workspaceId: string;
}

export function OverviewTaskRow({ task, column, projectId, workspaceId }: OverviewTaskRowProps) {
  const dueDateLabel = task.dueDate ? relativeDueDate(task.dueDate) : null;
  const activityLabel = !task.dueDate ? relativeActivity(task.updatedAt) : null;
  const taskUrl = `/workspace/${workspaceId}/projetos/${projectId}?task=${task.id}`;

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/40 transition-colors group">
      {/* ID */}
      <Link
        href={taskUrl}
        className="font-mono text-xs text-primary hover:underline shrink-0 w-16 truncate"
        title={task.taskRef ?? task.id}
      >
        {task.taskRef ?? '—'}
      </Link>

      {/* Título */}
      <Link
        href={taskUrl}
        className="flex-1 min-w-0 truncate text-foreground hover:text-primary transition-colors"
        title={task.title}
      >
        {task.title}
      </Link>

      {/* Coluna */}
      <span
        className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
        style={
          column.color
            ? {
                backgroundColor: `${column.color}1A`,
                borderColor: `${column.color}55`,
                color: column.color,
              }
            : undefined
        }
      >
        {column.color && (
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
        )}
        <span className="max-w-[100px] truncate">{column.name}</span>
      </span>

      {/* Assignee */}
      <div className="shrink-0 w-6">
        {task.assignees[0] ? (
          <AssigneeAvatar
            name={task.assignees[0].name}
            photoUrl={task.assignees[0].photoUrl}
          />
        ) : (
          <span className="h-5 w-5 flex items-center justify-center rounded-full border border-dashed border-muted-foreground/30" />
        )}
      </div>

      {/* Priority */}
      <span
        className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[task.priority]}`}
      >
        {PRIORITY_LABELS[task.priority]}
      </span>

      {/* Due date / Activity */}
      <span className="shrink-0 text-xs w-16 text-right text-muted-foreground">
        {dueDateLabel ?? activityLabel ?? ''}
      </span>
    </div>
  );
}
