'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowDown, ArrowUp, Filter, Search, X } from 'lucide-react';
import type { KanbanSortState } from './kanban-column';
import { DEFAULT_SORT_STATE } from './kanban-column';
import type { KanbanColumn } from './kanban-board';
import type { ProjectLabel } from '@/actions/projeto/get-labels.action';

export interface KanbanBoardFilterState {
  search: string;
  sortState: KanbanSortState;
  filterLabelIds: string[];
  filterAssigneeIds: string[];
  filterReporterIds: string[];
  dateFrom: string;
  dateTo: string;
  dateFields: ('dueDate' | 'startDate')[];
}

export const EMPTY_BOARD_FILTER: KanbanBoardFilterState = {
  search: '',
  sortState: DEFAULT_SORT_STATE,
  filterLabelIds: [],
  filterAssigneeIds: [],
  filterReporterIds: [],
  dateFrom: '',
  dateTo: '',
  dateFields: ['dueDate', 'startDate'],
};

interface Assignee {
  id: string;
  name: string;
  photoUrl: string | null;
}

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface KanbanBoardFilterProps {
  columns: KanbanColumn[];
  labels: ProjectLabel[];
  filter: KanbanBoardFilterState;
  onFilterChange: (filter: KanbanBoardFilterState) => void;
}

export function KanbanBoardFilter({ columns, labels, filter, onFilterChange }: KanbanBoardFilterProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close panel on click outside
  useEffect(() => {
    if (!panelOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [panelOpen]);

  // Unique assignees from all tasks
  const allAssignees: Assignee[] = [];
  const seenIds = new Set<string>();
  for (const col of columns) {
    for (const task of col.tasks) {
      for (const ta of task.taskAssignees) {
        if (!seenIds.has(ta.user.id)) {
          seenIds.add(ta.user.id);
          allAssignees.push({ id: ta.user.id, name: ta.user.name, photoUrl: ta.user.photoUrl });
        }
      }
    }
  }
  allAssignees.sort((a, b) => a.name.localeCompare(b.name));

  const allReporters: Assignee[] = [];
  const seenReporterIds = new Set<string>();
  for (const col of columns) {
    for (const task of col.tasks) {
      if (!seenReporterIds.has(task.reporter.id)) {
        seenReporterIds.add(task.reporter.id);
        allReporters.push({ id: task.reporter.id, name: task.reporter.name, photoUrl: task.reporter.photoUrl });
      }
    }
  }
  allReporters.sort((a, b) => a.name.localeCompare(b.name));

  const dateActive = !!filter.dateFrom;
  const sortActive = filter.sortState.dueDate !== null || filter.sortState.priority !== null;

  const activeCount =
    (sortActive ? 1 : 0) +
    filter.filterLabelIds.length +
    filter.filterAssigneeIds.length +
    filter.filterReporterIds.length +
    (dateActive ? 1 : 0);

  const update = useCallback(
    (patch: Partial<KanbanBoardFilterState>) => onFilterChange({ ...filter, ...patch }),
    [filter, onFilterChange],
  );

  function toggleLabel(id: string) {
    const next = filter.filterLabelIds.includes(id)
      ? filter.filterLabelIds.filter((x) => x !== id)
      : [...filter.filterLabelIds, id];
    update({ filterLabelIds: next });
  }

  function toggleAssignee(id: string) {
    const next = filter.filterAssigneeIds.includes(id)
      ? filter.filterAssigneeIds.filter((x) => x !== id)
      : [...filter.filterAssigneeIds, id];
    update({ filterAssigneeIds: next });
  }

  function toggleReporter(id: string) {
    const next = filter.filterReporterIds.includes(id)
      ? filter.filterReporterIds.filter((x) => x !== id)
      : [...filter.filterReporterIds, id];
    update({ filterReporterIds: next });
  }

  function toggleDueDate(dir: 'asc' | 'desc') {
    update({ sortState: { ...filter.sortState, dueDate: filter.sortState.dueDate === dir ? null : dir } });
  }

  function togglePriority(dir: 'desc' | 'asc') {
    update({ sortState: { ...filter.sortState, priority: filter.sortState.priority === dir ? null : dir } });
  }

  function toggleDateField(field: 'dueDate' | 'startDate') {
    const next = filter.dateFields.includes(field)
      ? filter.dateFields.filter((f) => f !== field)
      : [...filter.dateFields, field];
    update({ dateFields: next });
  }

  function clearAll() {
    onFilterChange(EMPTY_BOARD_FILTER);
  }

  const dateChipLabel = (() => {
    if (!dateActive) return '';
    const fieldLabels: Record<string, string> = { dueDate: 'Venc.', startDate: 'Início' };
    const fields = filter.dateFields.map((f) => fieldLabels[f]).join(', ');
    if (filter.dateTo && filter.dateTo !== filter.dateFrom) {
      return `${formatDateBR(filter.dateFrom)} – ${formatDateBR(filter.dateTo)}${fields ? ` (${fields})` : ''}`;
    }
    return `${formatDateBR(filter.dateFrom)}${fields ? ` (${fields})` : ''}`;
  })();

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      {/* Search + filter toggle row */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tasks..."
            value={filter.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-32 sm:w-48 rounded-md border bg-background px-3 py-1.5 pl-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {filter.search && (
            <button
              type="button"
              onClick={() => update({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors cursor-pointer ${
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

        {(activeCount > 0 || filter.search) && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Expandable panel */}
      {panelOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-[540px] max-w-[90vw] rounded-lg border bg-card shadow-lg p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Sort */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ordenação</p>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide pt-1">Por data</p>
                {(
                  [
                    { dir: 'asc', icon: <ArrowUp className="h-3 w-3 shrink-0" />, label: 'Mais próxima primeiro' },
                    { dir: 'desc', icon: <ArrowDown className="h-3 w-3 shrink-0" />, label: 'Mais distante primeiro' },
                  ] as const
                ).map(({ dir, icon, label }) => (
                  <label key={dir} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded accent-primary"
                      checked={filter.sortState.dueDate === dir}
                      onChange={() => toggleDueDate(dir)}
                    />
                    {icon}
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide pt-2">Por urgência</p>
                {(
                  [
                    { dir: 'desc', icon: <ArrowUp className="h-3 w-3 shrink-0" />, label: 'Mais urgente primeiro' },
                    { dir: 'asc', icon: <ArrowDown className="h-3 w-3 shrink-0" />, label: 'Menos urgente primeiro' },
                  ] as const
                ).map(({ dir, icon, label }) => (
                  <label key={dir} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded accent-primary"
                      checked={filter.sortState.priority === dir}
                      onChange={() => togglePriority(dir)}
                    />
                    {icon}
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Labels */}
            {labels.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Label</p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {labels.map((label) => (
                    <label key={label.id} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded accent-primary"
                        checked={filter.filterLabelIds.includes(label.id)}
                        onChange={() => toggleLabel(label.id)}
                      />
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                      <span className="text-xs truncate">{label.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Assignees */}
            {allAssignees.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Responsável</p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {allAssignees.map((a) => {
                    const initials = a.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? '')
                      .join('');
                    const src = a.photoUrl
                      ? a.photoUrl.startsWith('http')
                        ? a.photoUrl
                        : `${process.env.NEXT_PUBLIC_API_URL}${a.photoUrl}`
                      : null;
                    return (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded accent-primary"
                          checked={filter.filterAssigneeIds.includes(a.id)}
                          onChange={() => toggleAssignee(a.id)}
                        />
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background overflow-hidden shrink-0">
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </span>
                        <span className="text-xs truncate">{a.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reporters */}
            {allReporters.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reporter</p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {allReporters.map((a) => {
                    const initials = a.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? '')
                      .join('');
                    const src = a.photoUrl
                      ? a.photoUrl.startsWith('http')
                        ? a.photoUrl
                        : `${process.env.NEXT_PUBLIC_API_URL}${a.photoUrl}`
                      : null;
                    return (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded accent-primary"
                          checked={filter.filterReporterIds.includes(a.id)}
                          onChange={() => toggleReporter(a.id)}
                        />
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background overflow-hidden shrink-0">
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </span>
                        <span className="text-xs truncate">{a.name}</span>
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
                  value={filter.dateFrom}
                  onChange={(e) => update({ dateFrom: e.target.value })}
                  className="rounded-md border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Até:
                <input
                  type="date"
                  value={filter.dateTo}
                  min={filter.dateFrom || undefined}
                  onChange={(e) => update({ dateTo: e.target.value })}
                  className="rounded-md border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              {(
                [
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
                    checked={filter.dateFields.includes(field)}
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

      {/* Active chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filter.sortState.dueDate !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
              {filter.sortState.dueDate === 'asc' ? 'Prazo: mais próximo' : 'Prazo: mais distante'}
              <button type="button" className="cursor-pointer" onClick={() => update({ sortState: { ...filter.sortState, dueDate: null } })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filter.sortState.priority !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
              {filter.sortState.priority === 'desc' ? 'Mais urgente primeiro' : 'Menos urgente primeiro'}
              <button type="button" className="cursor-pointer" onClick={() => update({ sortState: { ...filter.sortState, priority: null } })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filter.filterLabelIds.map((id) => {
            const label = labels.find((l) => l.id === id);
            if (!label) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                {label.name}
                <button type="button" className="cursor-pointer" onClick={() => toggleLabel(id)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {filter.filterAssigneeIds.map((id) => {
            const a = allAssignees.find((x) => x.id === id);
            if (!a) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
                {a.name}
                <button type="button" className="cursor-pointer" onClick={() => toggleAssignee(id)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {filter.filterReporterIds.map((id) => {
            const a = allReporters.find((x) => x.id === id);
            if (!a) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
                Reporter: {a.name}
                <button type="button" className="cursor-pointer" onClick={() => toggleReporter(id)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {dateActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
              Período: {dateChipLabel}
              <button type="button" className="cursor-pointer" onClick={() => update({ dateFrom: '', dateTo: '' })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
