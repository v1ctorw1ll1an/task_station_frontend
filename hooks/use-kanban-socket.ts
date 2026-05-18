'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useKanbanStore } from '@/lib/stores/kanban-store';
import { useTaskTrackingStore } from '@/lib/stores/task-tracking-store';
import { getKanbanDataAction } from '@/actions/projeto/get-kanban.action';
import type {
  TaskCreatedPayload,
  TaskUpdatedPayload,
  TaskMovedPayload,
  TaskDeletedPayload,
  TaskRestoredPayload,
  ColumnCreatedPayload,
  ColumnUpdatedPayload,
  ColumnReorderedPayload,
  ColumnDeletedPayload,
} from '@/lib/stores/kanban-store';
import type { ActiveSession } from '@/lib/stores/task-tracking-store';

interface TaskSessionStartedPayload {
  sessionId: string; taskId: string; taskTitle: string; taskNumber: number | null;
  projectId: string; projectName: string; workspaceId: string; workspaceName: string;
  userId: string; userName: string; userPhotoUrl: string | null;
  status: 'running'; resumedAt: string; totalSeconds: number;
}

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useKanbanSocket(projectId: string, token: string | null) {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(
    token ? 'connecting' : 'disconnected',
  );
  const socketRef = useRef<Socket | null>(null);
  const store = useKanbanStore();
  const trackingStore = useTaskTrackingStore();

  useEffect(() => {
    if (!token) return;

    const BACKEND_WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

    const socket = io(`${BACKEND_WS_URL}/kanban`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus('connected');
      socket.emit('joinProject', { projectId });
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setSocketStatus('error');
    });

    socket.on('reconnect', () => {
      setSocketStatus('connected');
      socket.emit('joinProject', { projectId });
    });

    // ── Handlers de task ──────────────────────────────────────────────────────
    socket.on('task:created', (p: TaskCreatedPayload) => store.applyTaskCreated(p));
    socket.on('task:updated', (p: TaskUpdatedPayload) => store.applyTaskUpdated(p));
    socket.on('task:moved', (p: TaskMovedPayload) => store.applyTaskMoved(p));
    socket.on('task:deleted', (p: TaskDeletedPayload) => {
      store.applyTaskDeleted(p);
      trackingStore.applySessionsStoppedByTaskId(p.taskId);
    });
    socket.on('task:restored', (p: TaskRestoredPayload) => store.applyTaskRestored(p));

    // ── Handlers de coluna ────────────────────────────────────────────────────
    socket.on('column:created', (p: ColumnCreatedPayload) => store.applyColumnCreated(p));
    socket.on('column:updated', (p: ColumnUpdatedPayload) => store.applyColumnUpdated(p));
    socket.on('column:reordered', (p: ColumnReorderedPayload) => store.applyColumnReordered(p));
    socket.on('column:deleted', (p: ColumnDeletedPayload) => store.applyColumnDeleted(p));

    // ── Handlers de sessão de task ────────────────────────────────────────────
    socket.on('taskSession:started', (p: TaskSessionStartedPayload) => {
      const currentUserId = useKanbanStore.getState().currentUserId;
      if (p.userId === currentUserId) {
        const session: ActiveSession = {
          id: p.sessionId, taskId: p.taskId, taskTitle: p.taskTitle, taskNumber: p.taskNumber,
          projectId: p.projectId, projectName: p.projectName,
          workspaceId: p.workspaceId, workspaceName: p.workspaceName,
          userId: p.userId, userName: p.userName, userPhotoUrl: p.userPhotoUrl,
          status: 'running', totalSeconds: p.totalSeconds, resumedAt: p.resumedAt,
        };
        trackingStore.applySessionStarted(session);
      }
    });
    socket.on('taskSession:paused', (p: { sessionId: string; taskId: string; userId: string; totalSeconds: number }) => {
      const currentUserId = useKanbanStore.getState().currentUserId;
      if (p.userId === currentUserId) {
        trackingStore.applySessionPaused(p.sessionId, p.totalSeconds);
      }
    });
    socket.on('taskSession:resumed', (p: { sessionId: string; taskId: string; userId: string; resumedAt: string }) => {
      const currentUserId = useKanbanStore.getState().currentUserId;
      if (p.userId === currentUserId) {
        trackingStore.applySessionResumed(p.sessionId, p.resumedAt);
      }
    });
    socket.on('taskSession:stopped', (p: { sessionId: string; taskId: string; userId: string }) => {
      const currentUserId = useKanbanStore.getState().currentUserId;
      if (p.userId === currentUserId) {
        trackingStore.applySessionStopped(p.sessionId);
      }
    });

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback: se desconectado por mais de 30s, recarrega o kanban completo
  useEffect(() => {
    if (socketStatus !== 'disconnected' && socketStatus !== 'error') return;

    const id = setTimeout(async () => {
      const data = await getKanbanDataAction(projectId);
      if (data) {
        const state = useKanbanStore.getState();
        state.hydrate({
          projectId,
          currentUserId: state.currentUserId ?? '',
          columns: data.columns,
          labels: state.labels,
          membros: state.membros,
        });
      }
    }, 30_000);

    return () => clearTimeout(id);
  }, [socketStatus, projectId]);

  return { socketStatus, isConnected: socketStatus === 'connected' };
}
