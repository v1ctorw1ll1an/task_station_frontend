'use client';

import Link from 'next/link';
import { ICON_MAP } from '@/lib/icons/project-icons';

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-400',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
  medium: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
  high: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950',
  urgent: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
};

function relativeDueDate(dueDate: string): { label: string; isOverdue: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate.split('T')[0]);
  const diffMs = due.getTime() - today.getTime();
  const days = Math.round(diffMs / 86400000);

  if (days < 0) return { label: `há ${Math.abs(days)}d`, isOverdue: true };
  if (days === 0) return { label: 'hoje', isOverdue: false };
  if (days === 1) return { label: 'amanhã', isOverdue: false };
  return { label: `em ${days}d`, isOverdue: false };
}

export interface TaskDueCardData {
  id: string;
  title: string;
  taskNumber: number | null;
  priority: string;
  dueDate: string | null;
  startDate: string | null;
  createdAt: string;
  column: { id: string; name: string; color: string | null };
  project: {
    id: string;
    name: string;
    icon: string | null;
    iconColor: string | null;
    workspace: { id: string; name: string };
  };
}

interface TaskDueCardProps {
  task: TaskDueCardData;
}

export function TaskDueCard({ task }: TaskDueCardProps) {
  const IconComponent = task.project.icon
    ? (ICON_MAP as Record<string, React.ComponentType<{ className?: string }>>)[task.project.icon]
    : null;
  const taskUrl = `/workspace/${task.project.workspace.id}/projetos/${task.project.id}?task=${task.id}`;
  const due = task.dueDate ? relativeDueDate(task.dueDate) : null;

  return (
    <Link
      href={taskUrl}
      className={`block rounded-lg border border-l-4 ${PRIORITY_BORDER[task.priority] ?? 'border-l-slate-300'} bg-card p-3 hover:bg-accent/50 transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {task.taskNumber != null && (
              <span className="font-mono text-xs text-muted-foreground">
                #{task.taskNumber}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_CLASSES[task.priority] ?? ''}`}
            >
              {PRIORITY_LABELS[task.priority] ?? task.priority}
            </span>
          </div>
          <p className="text-sm font-medium truncate">{task.title}</p>
        </div>
        {due && (
          <span
            className={`shrink-0 text-xs font-medium ${due.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            {due.label}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        {/* Column badge */}
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border text-[11px]"
          style={
            task.column.color
              ? {
                  backgroundColor: `${task.column.color}1A`,
                  borderColor: `${task.column.color}55`,
                  color: task.column.color,
                }
              : undefined
          }
        >
          {task.column.color && (
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: task.column.color }}
            />
          )}
          {task.column.name}
        </span>

        {/* Project */}
        <span className="inline-flex items-center gap-1 truncate">
          {IconComponent && (
            <IconComponent className="h-3 w-3 shrink-0" />
          )}
          {task.project.name}
        </span>

        {/* Workspace */}
        <span className="hidden sm:inline truncate">{task.project.workspace.name}</span>
      </div>
    </Link>
  );
}
