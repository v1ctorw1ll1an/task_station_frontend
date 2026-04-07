'use client';

import { useEffect, useState, useTransition } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskTrackingStore, type ActiveSession } from '@/lib/stores/task-tracking-store';
import { pauseSessionAction } from '@/actions/task-session/pause-session.action';
import { resumeSessionAction } from '@/actions/task-session/resume-session.action';
import { stopSessionAction } from '@/actions/task-session/stop-session.action';

function formatSeconds(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TrackingSessionCardProps {
  session: ActiveSession;
}

export function TrackingSessionCard({ session }: TrackingSessionCardProps) {
  const store = useTaskTrackingStore();
  const [, setTick] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Tick every second to update the timer display
  useEffect(() => {
    if (session.status !== 'running') return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  const displaySeconds = store.getDisplaySeconds(session.id);

  function handlePause() {
    store.applySessionPaused(session.id, displaySeconds);
    startTransition(async () => {
      const result = await pauseSessionAction(session.id);
      if (result.error) {
        // Revert optimistic update
        store.applySessionResumed(session.id, session.resumedAt ?? new Date().toISOString());
      } else if (result.data) {
        store.applySessionPaused(session.id, result.data.totalSeconds);
      }
    });
  }

  function handleResume() {
    const now = new Date().toISOString();
    store.applySessionResumed(session.id, now);
    startTransition(async () => {
      const result = await resumeSessionAction(session.id);
      if (result.error) {
        store.applySessionPaused(session.id, session.totalSeconds);
      } else if (result.data) {
        store.applySessionResumed(session.id, result.data.resumedAt ?? now);
      }
    });
  }

  function handleStop() {
    store.applySessionStopped(session.id);
    startTransition(async () => {
      const result = await stopSessionAction(session.id);
      if (result.error) {
        // Revert: put session back
        store.applySessionStarted(session);
      }
    });
  }

  return (
    <div className="rounded-md border bg-card p-2.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
            session.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug truncate" title={session.taskTitle}>
            {session.taskTitle}
          </p>
          <p className="text-xs text-muted-foreground truncate">{session.projectName}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatSeconds(displaySeconds)}
        </span>
        <div className="flex items-center gap-1">
          {session.status === 'running' ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-pointer"
              disabled={isPending}
              onClick={handlePause}
              title="Pausar"
            >
              <Pause className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-pointer"
              disabled={isPending}
              onClick={handleResume}
              title="Retomar"
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive cursor-pointer"
            disabled={isPending}
            onClick={handleStop}
            title="Encerrar"
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
