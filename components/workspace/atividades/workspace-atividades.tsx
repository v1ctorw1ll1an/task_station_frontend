'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ExternalLink, Timer } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { rawToActiveSession, type ActiveSession, type RawSession } from '@/lib/stores/task-tracking-store';
import { Badge } from '@/components/ui/badge';

interface TaskSessionStartedPayload {
  sessionId: string; taskId: string; taskTitle: string; taskNumber: number | null;
  projectId: string; projectName: string; workspaceId: string; workspaceName: string;
  companyId: string; userId: string; userName: string; userPhotoUrl: string | null;
  status: 'running'; resumedAt: string; totalSeconds: number;
}

function formatSeconds(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDisplaySeconds(session: ActiveSession): number {
  if (session.status === 'running' && session.resumedAt) {
    const elapsed = Math.floor((Date.now() - new Date(session.resumedAt).getTime()) / 1000);
    return session.totalSeconds + elapsed;
  }
  return session.totalSeconds;
}

interface MemberGroup {
  userId: string;
  userName: string;
  userPhotoUrl: string | null;
  sessions: ActiveSession[];
}

function groupByMember(sessions: ActiveSession[]): MemberGroup[] {
  const map = new Map<string, MemberGroup>();
  for (const s of sessions) {
    if (!map.has(s.userId)) {
      map.set(s.userId, {
        userId: s.userId,
        userName: s.userName,
        userPhotoUrl: s.userPhotoUrl,
        sessions: [],
      });
    }
    map.get(s.userId)!.sessions.push(s);
  }
  return Array.from(map.values());
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

interface WorkspaceAtividadesProps {
  initialSessions: RawSession[];
  workspaceId: string;
  currentUserId: string;
  token: string;
}

export function WorkspaceAtividades({
  initialSessions,
  workspaceId,
  token,
}: WorkspaceAtividadesProps) {
  const [sessions, setSessions] = useState<ActiveSession[]>(
    () => initialSessions.map(rawToActiveSession),
  );
  const [, setTick] = useState(0);
  const [collapsedMembers, setCollapsedMembers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const BACKEND_WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

    const socket = io(`${BACKEND_WS_URL}/kanban`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => socket.emit('joinWorkspace', { workspaceId }));
    socket.on('reconnect', () => socket.emit('joinWorkspace', { workspaceId }));

    socket.on('taskSession:started', (p: TaskSessionStartedPayload) => {
      const newSession: ActiveSession = {
        id: p.sessionId, taskId: p.taskId, taskTitle: p.taskTitle, taskNumber: p.taskNumber,
        projectId: p.projectId, projectName: p.projectName,
        workspaceId: p.workspaceId, workspaceName: p.workspaceName,
        userId: p.userId, userName: p.userName, userPhotoUrl: p.userPhotoUrl,
        status: 'running', totalSeconds: p.totalSeconds, resumedAt: p.resumedAt,
      };
      setSessions((prev) => [...prev.filter((s) => s.id !== p.sessionId), newSession]);
    });

    socket.on('taskSession:paused', (p: { sessionId: string; totalSeconds: number }) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === p.sessionId
            ? { ...s, status: 'paused', totalSeconds: p.totalSeconds, resumedAt: null }
            : s,
        ),
      );
    });

    socket.on('taskSession:resumed', (p: { sessionId: string; resumedAt: string }) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === p.sessionId ? { ...s, status: 'running', resumedAt: p.resumedAt } : s,
        ),
      );
    });

    socket.on('taskSession:stopped', (p: { sessionId: string }) => {
      setSessions((prev) => prev.filter((s) => s.id !== p.sessionId));
    });

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, token]);

  function toggleMember(userId: string) {
    setCollapsedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const memberGroups = groupByMember(sessions);

  if (memberGroups.length === 0) {
    return (
      <div className="rounded-lg border bg-card px-6 py-16 text-center space-y-2">
        <Timer className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum membro com tarefa em execução.</p>
        <p className="text-xs text-muted-foreground">Quando um membro iniciar uma tarefa, ela aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {memberGroups.map((group) => {
        const isCollapsed = collapsedMembers.has(group.userId);
        return (
          <div key={group.userId} className="rounded-lg border bg-card overflow-hidden">
            <button
              onClick={() => toggleMember(group.userId)}
              className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30 w-full text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(group.userName)}
              </div>
              <span className="font-medium text-sm flex-1">{group.userName}</span>
              <Badge variant="secondary" className="text-xs">
                {group.sessions.length} tarefa{group.sessions.length !== 1 ? 's' : ''}
              </Badge>
              {isCollapsed
                ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {!isCollapsed && (
              <div className="divide-y">
                {group.sessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        session.status === 'running'
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={session.taskTitle}>
                        {session.taskTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">{session.projectName}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums shrink-0">
                      {formatSeconds(getDisplaySeconds(session))}
                    </span>
                    <Link
                      href={`/workspace/${workspaceId}/projetos/${session.projectId}?task=${session.taskId}`}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      title="Ver card"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
