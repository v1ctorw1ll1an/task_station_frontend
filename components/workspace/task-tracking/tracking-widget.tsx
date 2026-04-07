'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Timer } from 'lucide-react';
import {
  useTaskTrackingStore,
  rawToActiveSession,
  type RawSession,
} from '@/lib/stores/task-tracking-store';
import { TrackingSessionCard } from './tracking-session-card';

interface TrackingWidgetProps {
  initialSessions: RawSession[];
}

export function TrackingWidget({ initialSessions }: TrackingWidgetProps) {
  const store = useTaskTrackingStore();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('tracking-widget-collapsed') === 'true',
  );

  // Hydrate store with server-fetched sessions on mount
  useEffect(() => {
    store.setSessions(initialSessions.map(rawToActiveSession));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('tracking-widget-collapsed', String(next));
  }

  const sessions = store.sessions;
  const runningCount = sessions.filter((s) => s.status === 'running').length;

  // Warn user before closing/refreshing page if there are running sessions
  useEffect(() => {
    if (runningCount === 0) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [runningCount]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 shadow-lg rounded-lg border bg-popover">
      {/* Header */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent/50 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {sessions.length === 0
              ? 'Atividade'
              : `${sessions.length} tarefa${sessions.length !== 1 ? 's' : ''} ativa${sessions.length !== 1 ? 's' : ''}`}
          </span>
          {runningCount > 0 && (
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
        {collapsed ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2 border-t pt-2">
          {sessions.length === 0 ? (
            <div className="py-2 text-center space-y-1">
              <Timer className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground font-medium">
                Nenhuma tarefa em execução.
              </p>
              <p className="text-xs text-muted-foreground">
                Abra um card e clique em &ldquo;Iniciar&rdquo;.
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <TrackingSessionCard key={session.id} session={session} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
