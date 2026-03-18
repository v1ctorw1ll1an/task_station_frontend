'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { OverviewProject } from '@/actions/workspace/get-workspace-overview.action';
import { ICON_MAP } from '@/lib/icons/project-icons';
import { OverviewDistributionBar } from './overview-distribution-bar';
import { OverviewTaskRow } from './overview-task-row';

interface OverviewProjectGroupProps {
  project: OverviewProject;
  workspaceId: string;
  defaultOpen?: boolean;
  totalTasks?: number;
}

export function OverviewProjectGroup({
  project,
  workspaceId,
  defaultOpen = true,
  totalTasks: totalTasksProp,
}: OverviewProjectGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Flatten tasks in column order, with their column reference
  const taskRows = project.columns.flatMap((col) =>
    col.tasks.map((task) => ({ task, column: col })),
  );

  const displayTotal = totalTasksProp ?? project.totalTasks;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Project header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Project icon */}
        {(() => {
          const Icon = project.icon ? (ICON_MAP[project.icon] ?? null) : null;
          return Icon ? (
            <Icon
              className="h-4 w-4 shrink-0"
              style={project.iconColor ? { color: project.iconColor } : undefined}
            />
          ) : (
            <span className="h-4 w-4 rounded bg-muted shrink-0" />
          );
        })()}

        {/* Project name */}
        <span className="font-semibold text-sm truncate flex-1">{project.name}</span>

        <span className="text-xs text-muted-foreground shrink-0">
          {displayTotal} {displayTotal === 1 ? 'task' : 'tasks'}
        </span>

        <OverviewDistributionBar
          columns={project.columns}
          totalTasks={displayTotal}
        />
      </button>

      {/* Task list */}
      {open && taskRows.length > 0 && (
        <div className="border-t divide-y divide-border/50">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-1.5 text-[11px] font-medium text-muted-foreground bg-muted/20">
            <span className="w-16 shrink-0">ID</span>
            <span className="flex-1">Título</span>
            <span className="shrink-0 w-28">Coluna</span>
            <span className="shrink-0 w-6">Resp.</span>
            <span className="shrink-0 w-14">Prioridade</span>
            <span className="shrink-0 w-16 text-right">Prazo / Ativ.</span>
          </div>
          {taskRows.map(({ task, column }) => (
            <OverviewTaskRow
              key={task.id}
              task={task}
              column={column}
              projectId={project.id}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}

      {open && taskRows.length === 0 && (
        <div className="border-t px-4 py-4 text-sm text-muted-foreground text-center">
          Nenhuma task neste projeto.
        </div>
      )}
    </div>
  );
}
