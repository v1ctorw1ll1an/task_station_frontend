'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { useReminderToastStore } from '@/lib/stores/reminder-toast-store';
import type { AppNotification } from '@/lib/stores/notification-store';
import {
  playReminderSound,
  showBrowserReminderNotification,
} from '@/lib/event-reminder-alert';
import { getPreferencesAction } from '@/actions/notificacao/get-preferences.action';

interface EventReminderPrefs {
  eventReminderSound: boolean;
  eventReminderPopup: boolean;
  eventReminderBrowser: boolean;
}

export function useNotificationSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const prefsRef = useRef<EventReminderPrefs>({
    eventReminderSound: true,
    eventReminderPopup: true,
    eventReminderBrowser: true,
  });
  const store = useNotificationStore();
  const pushToast = useReminderToastStore((s) => s.push);

  // Fetch user prefs uma vez na hidratação
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getPreferencesAction()
      .then((data) => {
        if (cancelled || !data) return;
        prefsRef.current = {
          eventReminderSound: Boolean(data.eventReminderSound ?? true),
          eventReminderPopup: Boolean(data.eventReminderPopup ?? true),
          eventReminderBrowser: Boolean(data.eventReminderBrowser ?? true),
        };

        if (
          prefsRef.current.eventReminderBrowser
          && typeof window !== 'undefined'
          && 'Notification' in window
          && Notification.permission === 'default'
        ) {
          Notification.requestPermission().catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token]);

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

      if (n.type === 'EVENT_REMINDER') {
        const prefs = prefsRef.current;
        const hasFocus =
          typeof document !== 'undefined'
          && document.visibilityState === 'visible'
          && document.hasFocus();

        if (prefs.eventReminderSound) {
          playReminderSound();
        }
        if (prefs.eventReminderPopup && hasFocus) {
          pushToast({
            id: n.id ?? `evrem-${Date.now()}`,
            title: n.title,
            body: n.body,
          });
        }
        if (prefs.eventReminderBrowser && !hasFocus) {
          showBrowserReminderNotification(n.title, n.body);
        }
      }
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
