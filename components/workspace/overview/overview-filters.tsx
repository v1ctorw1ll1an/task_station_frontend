'use client';

import { useState, useCallback } from 'react';
import { Filter, X, Search } from 'lucide-react';
import type { OverviewProject, OverviewAssignee } from '@/actions/workspace/get-workspace-overview.action';
import { ICON_MAP } from '@/lib/icons/project-icons';

export interface FilterState {
  search: string;
  selectedProjects: string[];
  selectedAssignees: string[];
  selectedColumnNames: string[];
  dateFrom: string;
  dateTo: string;
  dateFields: ('createdAt' | 'dueDate' | 'startDate')[];
}

interface OverviewFiltersProps {
  projects: OverviewProject[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
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
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background overflow-hidden shrink-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function OverviewFilters({ projects, filters, onFiltersChange }: OverviewFiltersProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  // Derive unique assignees from all tasks
  const allAssignees: OverviewAssignee[] = [];
  const seenIds = new Set<string>();
  for (const project of projects) {
    for (const col of project.columns) {
      for (const task of col.tasks) {
        for (const a of task.assignees) {
          if (!seenIds.has(a.id)) {
            seenIds.add(a.id);
            allAssignees.push(a);
          }
        }
      }
    }
  }
  allAssignees.sort((a, b) => a.name.localeCompare(b.name));

  // Derive unique column names (lowercase key → display name)
  const columnNameMap = new Map<string, string>();
  const columnColorMap = new Map<string, string | null>();
  for (const project of projects) {
    for (const col of project.columns) {
      const key = col.name.toLowerCase();
      if (!columnNameMap.has(key)) {
        columnNameMap.set(key, col.name);
        columnColorMap.set(key, col.color);
      }
    }
  }
  const uniqueColumns = Array.from(columnNameMap.entries()).sort((a, b) =>
    a[1].localeCompare(b[1]),
  );

  const dateActive = !!filters.dateFrom;

  const activeCount =
    (filters.search ? 1 : 0) +
    filters.selectedProjects.length +
    filters.selectedAssignees.length +
    filters.selectedColumnNames.length +
    (dateActive ? 1 : 0);

  const update = useCallback(
    (patch: Partial<FilterState>) => onFiltersChange({ ...filters, ...patch }),
    [filters, onFiltersChange],
  );

  function toggleProject(id: string) {
    const next = filters.selectedProjects.includes(id)
      ? filters.selectedProjects.filter((p) => p !== id)
      : [...filters.selectedProjects, id];
    update({ selectedProjects: next });
  }

  function toggleAssignee(id: string) {
    const next = filters.selectedAssignees.includes(id)
      ? filters.selectedAssignees.filter((a) => a !== id)
      : [...filters.selectedAssignees, id];
    update({ selectedAssignees: next });
  }

  function toggleColumn(key: string) {
    const next = filters.selectedColumnNames.includes(key)
      ? filters.selectedColumnNames.filter((c) => c !== key)
      : [...filters.selectedColumnNames, key];
    update({ selectedColumnNames: next });
  }

  function toggleDateField(field: 'createdAt' | 'dueDate' | 'startDate') {
    const next = filters.dateFields.includes(field)
      ? filters.dateFields.filter((f) => f !== field)
      : [...filters.dateFields, field];
    update({ dateFields: next });
  }

  function clearAll() {
    onFiltersChange({
      search: '',
      selectedProjects: [],
      selectedAssignees: [],
      selectedColumnNames: [],
      dateFrom: '',
      dateTo: '',
      dateFields: ['createdAt', 'dueDate', 'startDate'],
    });
  }

  function clearDate() {
    update({ dateFrom: '', dateTo: '' });
  }

  const dateChipLabel = (() => {
    if (!dateActive) return '';
    const fieldLabels: Record<string, string> = { createdAt: 'Criação', dueDate: 'Venc.', startDate: 'Início' };
    const fields = filters.dateFields.map((f) => fieldLabels[f]).join(', ');
    if (filters.dateTo && filters.dateTo !== filters.dateFrom) {
      return `${formatDateBR(filters.dateFrom)} – ${formatDateBR(filters.dateTo)}${fields ? ` (${fields})` : ''}`;
    }
    return `${formatDateBR(filters.dateFrom)}${fields ? ` (${fields})` : ''}`;
  })();

  return (
    <div className="space-y-2">
      {/* Search + filter toggle row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tasks..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-1.5 pl-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => update({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className={`relative inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            panelOpen || activeCount > 0
              ? 'border-primary bg-primary/5 text-primary'
              : 'bg-background text-muted-foreground hover:bg-muted/50'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Filter panel */}
      {panelOpen && (
        <div className="rounded-lg border bg-card p-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Projects */}
            {projects.length >= 2 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projeto</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {projects.map((p) => {
                    const Icon = p.icon ? (ICON_MAP[p.icon] ?? null) : null;
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded accent-primary"
                          checked={filters.selectedProjects.includes(p.id)}
                          onChange={() => toggleProject(p.id)}
                        />
                        {Icon && (
                          <Icon
                            className="h-3.5 w-3.5 shrink-0"
                            style={p.iconColor ? { color: p.iconColor } : undefined}
                          />
                        )}
                        <span className="text-xs truncate">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assignees */}
            {allAssignees.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Responsável</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {allAssignees.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded accent-primary"
                        checked={filters.selectedAssignees.includes(a.id)}
                        onChange={() => toggleAssignee(a.id)}
                      />
                      <AssigneeAvatar name={a.name} photoUrl={a.photoUrl} />
                      <span className="text-xs truncate">{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Columns */}
            {uniqueColumns.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Coluna</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {uniqueColumns.map(([key, name]) => {
                    const color = columnColorMap.get(key);
                    return (
                      <label key={key} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded accent-primary"
                          checked={filters.selectedColumnNames.includes(key)}
                          onChange={() => toggleColumn(key)}
                        />
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs border"
                          style={
                            color
                              ? { backgroundColor: `${color}1A`, borderColor: `${color}55`, color }
                              : undefined
                          }
                        >
                          {color && (
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          )}
                          <span className="max-w-[90px] truncate">{name}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Date range */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Período</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                De:
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => update({ dateFrom: e.target.value })}
                  className="rounded-md border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Até:
                <input
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(e) => update({ dateTo: e.target.value })}
                  className="rounded-md border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { field: 'createdAt', label: 'Criação' },
                  { field: 'dueDate', label: 'Vencimento' },
                  { field: 'startDate', label: 'Início/Est.' },
                ] as const
              ).map(({ field, label }) => (
                <label
                  key={field}
                  className={`flex items-center gap-1.5 text-xs cursor-pointer ${!dateActive ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded accent-primary"
                    checked={filters.dateFields.includes(field)}
                    disabled={!dateActive}
                    onChange={() => toggleDateField(field)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.selectedProjects.map((id) => {
            const p = projects.find((pr) => pr.id === id);
            if (!p) return null;
            const Icon = p.icon ? (ICON_MAP[p.icon] ?? null) : null;
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
                {Icon && <Icon className="h-3 w-3 shrink-0" style={p.iconColor ? { color: p.iconColor } : undefined} />}
                {p.name}
                <button type="button" onClick={() => toggleProject(id)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {filters.selectedAssignees.map((id) => {
            const a = allAssignees.find((as) => as.id === id);
            if (!a) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
                {a.name}
                <button type="button" onClick={() => toggleAssignee(id)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {filters.selectedColumnNames.map((key) => {
            const name = columnNameMap.get(key);
            if (!name) return null;
            return (
              <span key={key} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
                {name}
                <button type="button" onClick={() => toggleColumn(key)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {dateActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
              Período: {dateChipLabel}
              <button type="button" onClick={clearDate}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
