'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useKanbanStore } from '@/lib/stores/kanban-store';
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

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useKanbanSocket(projectId: string, token: string | null) {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(
    token ? 'connecting' : 'disconnected',
  );
  const socketRef = useRef<Socket | null>(null);
  const store = useKanbanStore();

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
    socket.on('task:deleted', (p: TaskDeletedPayload) => store.applyTaskDeleted(p));
    socket.on('task:restored', (p: TaskRestoredPayload) => store.applyTaskRestored(p));

    // ── Handlers de coluna ────────────────────────────────────────────────────
    socket.on('column:created', (p: ColumnCreatedPayload) => store.applyColumnCreated(p));
    socket.on('column:updated', (p: ColumnUpdatedPayload) => store.applyColumnUpdated(p));
    socket.on('column:reordered', (p: ColumnReorderedPayload) => store.applyColumnReordered(p));
    socket.on('column:deleted', (p: ColumnDeletedPayload) => store.applyColumnDeleted(p));

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
