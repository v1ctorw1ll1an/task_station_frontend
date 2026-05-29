'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Conecta o convidado (sem JWT) ao namespace /kanban e entra na sala da própria
 * task via token público. Em `task:changed`, dispara o callback de refetch para
 * refletir, sem F5, mudanças feitas pela equipe ou por outros convidados.
 */
export function usePublicTaskSocket(token: string, onChanged: () => void) {
  const onChangedRef = useRef(onChanged);

  useEffect(() => {
    onChangedRef.current = onChanged;
  }, [onChanged]);

  useEffect(() => {
    if (!token) return;

    const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
    const socket: Socket = io(`${url}/kanban`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    });

    const join = () => socket.emit('joinPublicTask', { token });
    socket.on('connect', join);
    socket.on('reconnect', join);
    socket.on('task:changed', () => onChangedRef.current());

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [token]);
}
