'use client';

import { useState, useMemo, useCallback } from 'react';
import type { OverviewProject } from '@/actions/workspace/get-workspace-overview.action';
import { OverviewProjectGroup } from './overview-project-group';
import { OverviewFilters, type FilterState } from './overview-filters';

interface WorkspaceOverviewProps {
  projects: OverviewProject[];
  workspaceId: string;
}

const EMPTY_FILTERS: FilterState = {
  search: '',
  selectedProjects: [],
  selectedAssignees: [],
  selectedColumnNames: [],
  dateFrom: '',
  dateTo: '',
  dateFields: ['createdAt', 'dueDate', 'startDate'],
};

export function WorkspaceOverview({ projects, workspaceId }: WorkspaceOverviewProps) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const handleFiltersChange = useCallback((f: FilterState) => setFilters(f), []);

  const filteredProjects = useMemo(() => {
    const searchLower = filters.search.toLowerCase();

    return projects
      .filter(
        (p) =>
          filters.selectedProjects.length === 0 || filters.selectedProjects.includes(p.id),
      )
      .map((p) => {
        const filteredColumns = p.columns
          .filter(
            (col) =>
              filters.selectedColumnNames.length === 0 ||
              filters.selectedColumnNames.includes(col.name.toLowerCase()),
          )
          .map((col) => ({
            ...col,
            tasks: col.tasks.filter((task) => {
              const matchesSearch =
                !searchLower || task.title.toLowerCase().includes(searchLower);
              const matchesAssignee =
                filters.selectedAssignees.length === 0 ||
                task.assignees.some((a) => filters.selectedAssignees.includes(a.id));

              let matchesDate = true;
              if (filters.dateFrom) {
                const dateTo = filters.dateTo || filters.dateFrom;
                const fields = filters.dateFields.length > 0 ? filters.dateFields : (['createdAt', 'dueDate', 'startDate'] as const);
                matchesDate = fields.some((field) => {
                  const raw = task[field as keyof typeof task] as string | null | undefined;
                  if (!raw) return false;
                  const taskDate = raw.slice(0, 10);
                  return taskDate >= filters.dateFrom && taskDate <= dateTo;
                });
              }

              return matchesSearch && matchesAssignee && matchesDate;
            }),
          }))
          .filter((col) => col.tasks.length > 0);

        const totalTasks = filteredColumns.reduce((sum, col) => sum + col.tasks.length, 0);

        return { ...p, columns: filteredColumns, totalTasks };
      })
      .filter((p) => p.totalTasks > 0);
  }, [projects, filters]);

  const hasActiveFilters =
    filters.search ||
    filters.selectedProjects.length > 0 ||
    filters.selectedAssignees.length > 0 ||
    filters.selectedColumnNames.length > 0 ||
    !!filters.dateFrom;

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center text-muted-foreground">
        Nenhum projeto ativo neste workspace.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <OverviewFilters projects={projects} filters={filters} onFiltersChange={handleFiltersChange} />

      {filteredProjects.length === 0 && hasActiveFilters ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-muted-foreground">
          Nenhuma task encontrada com os filtros aplicados.
        </div>
      ) : (
        filteredProjects.map((project, i) => (
          <OverviewProjectGroup
            key={project.id}
            project={project}
            workspaceId={workspaceId}
            defaultOpen={i === 0}
            totalTasks={project.totalTasks}
          />
        ))
      )}
    </div>
  );
}
