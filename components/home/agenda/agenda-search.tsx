'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Loader2, Search, X } from 'lucide-react';
import { ICON_MAP } from '@/lib/icons/project-icons';
import { searchMyEventsAction } from '@/actions/eventos/search-my-events.action';
import { searchMyTasksAction } from '@/actions/me/search-my-tasks.action';
import type { CalendarEventOccurrence } from '@/lib/event-types';
import type { TaskDueCardData } from '../task-due-card';
import { cn } from '@/lib/utils';

interface AgendaSearchProps {
  companyId: string;
  onSelectEvent: (occurrence: CalendarEventOccurrence) => void;
  onSelectTask: (task: TaskDueCardData) => void;
}

function eventWhenLabel(occ: CalendarEventOccurrence): string {
  const d = parseISO(occ.startsAt);
  if (occ.allDay) {
    return formatInTimeZone(d, occ.timezone, "EEE, d MMM yyyy", { locale: ptBR });
  }
  return formatInTimeZone(d, occ.timezone, "EEE, d MMM · HH:mm", { locale: ptBR });
}

export function AgendaSearch({ companyId, onSelectEvent, onSelectTask }: AgendaSearchProps) {
  // No desktop o campo fica sempre expandido; no mobile ele começa recolhido (só
  // a lupa) e `mobileOpen` controla a expansão. `active` controla o painel de
  // resultados (independente do estado do campo no mobile).
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [q, setQ] = useState('');
  const [events, setEvents] = useState<CalendarEventOccurrence[]>([]);
  const [tasks, setTasks] = useState<TaskDueCardData[]>([]);
  const [resultsFor, setResultsFor] = useState('');
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const term = q.trim();
  const showPanel = active && term.length >= 2;
  const isCurrent = resultsFor === term;
  const hasResults = events.length > 0 || tasks.length > 0;

  // Busca com debounce quando há termo (≥ 2 chars).
  useEffect(() => {
    if (term.length < 2) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const [ev, tk] = await Promise.all([
          searchMyEventsAction(term, companyId),
          searchMyTasksAction(companyId, term),
        ]);
        setEvents(ev.data);
        setTasks(tk.data);
        setResultsFor(term);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [term, companyId]);

  // Foca o input ao expandir no mobile.
  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus();
  }, [mobileOpen]);

  // Fecha painel / recolhe (mobile) ao clicar fora.
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  function collapse() {
    setActive(false);
    setMobileOpen(false);
    setQ('');
  }

  function handleSelectEvent(occ: CalendarEventOccurrence) {
    onSelectEvent(occ);
    collapse();
  }

  function handleSelectTask(task: TaskDueCardData) {
    onSelectTask(task);
    collapse();
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Campo: sempre visível no desktop (sm+); no mobile só quando expandido */}
      <div
        className={cn(
          'items-center gap-1.5 rounded-md border bg-background pl-2.5 pr-1 h-9 w-60 sm:w-72 sm:flex',
          mobileOpen ? 'flex' : 'hidden',
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(true);
          }}
          onFocus={() => setActive(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setActive(false);
              setMobileOpen(false);
              e.currentTarget.blur();
            }
          }}
          placeholder="Buscar task ou evento..."
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
        />
        {/* Botão de recolher só no mobile (no desktop o campo é permanente) */}
        <button
          type="button"
          onClick={collapse}
          className="sm:hidden shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Fechar busca"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Lupa: só no mobile e só quando o campo está recolhido */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => {
            setMobileOpen(true);
            setActive(true);
          }}
          title="Buscar task ou evento"
          className="sm:hidden h-9 w-9 flex items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
      )}

      {showPanel && (
        <div className="absolute left-0 top-full mt-1 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-md border bg-popover shadow-md">
          <div className="max-h-96 overflow-y-auto p-1">
            {isPending || !isCurrent ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : !hasResults ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                Nenhum resultado para <span className="font-medium">“{term}”</span>
              </p>
            ) : (
              <>
                {events.length > 0 && (
                  <div className="mb-1">
                    <p className="px-2 pt-1.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Eventos
                    </p>
                    {events.map((occ) => (
                      <button
                        key={occ.occurrenceKey}
                        type="button"
                        onClick={() => handleSelectEvent(occ)}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                      >
                        <CalendarDays
                          className="h-4 w-4 mt-0.5 shrink-0"
                          style={occ.color ? { color: occ.color } : undefined}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{occ.title}</span>
                          <span className="block truncate text-xs text-muted-foreground capitalize">
                            {eventWhenLabel(occ)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {tasks.length > 0 && (
                  <div>
                    <p className="px-2 pt-1.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Tasks
                    </p>
                    {tasks.map((task) => {
                      const Icon = task.project.icon
                        ? (ICON_MAP as Record<
                            string,
                            React.ComponentType<{ className?: string; style?: React.CSSProperties }>
                          >)[task.project.icon]
                        : null;
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleSelectTask(task)}
                          className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                        >
                          {Icon ? (
                            <Icon
                              className="h-4 w-4 mt-0.5 shrink-0"
                              style={task.project.iconColor ? { color: task.project.iconColor } : undefined}
                            />
                          ) : (
                            <span className="h-4 w-4 mt-0.5 shrink-0" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{task.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {task.project.name} · {task.project.workspace.name}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
