'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/lib/stores/notification-store';
import type { AppNotification } from '@/lib/stores/notification-store';

export function useNotificationSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const store = useNotificationStore();

  useEffect(() => {
    if (!token || socketRef.current) return;

    const BACKEND_WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

    const socket = io(`${BACKEND_WS_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribeNotifications');
    });

    socket.on('notification:new', (n: AppNotification) => {
      store.applyNewNotification(n);
    });

    socket.on('reconnect', () => {
      socket.emit('subscribeNotifications');
    });

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
}
