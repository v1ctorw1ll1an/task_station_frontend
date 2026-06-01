'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { useReminderToastStore } from '@/lib/stores/reminder-toast-store';
import type { AppNotification } from '@/lib/stores/notification-store';
import {
  playNotificationSound,
  showBrowserNotification,
  primeAudio,
} from '@/lib/event-reminder-alert';
import { getPreferencesAction } from '@/actions/notificacao/get-preferences.action';

interface AlertPrefs {
  // Lembretes de evento (canais dedicados)
  eventReminderSound: boolean;
  eventReminderPopup: boolean;
  eventReminderBrowser: boolean;
  // Canais globais (todas as outras notificações)
  notificationSound: boolean;
  notificationBrowser: boolean;
}

// O socket é compartilhado entre todos os componentes que chamam o hook
// (provider do dashboard, sininho no workspace/empresa, etc.). Sem isso, duas
// montagens simultâneas abririam duas conexões e o usuário receberia som e
// notificação nativa DUPLICADOS para cada `notification:new`.
let sharedSocket: Socket | null = null;
let refCount = 0;
let prefs: AlertPrefs = {
  eventReminderSound: true,
  eventReminderPopup: true,
  eventReminderBrowser: true,
  notificationSound: true,
  notificationBrowser: true,
};

function requestNotificationPermission(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => undefined);
  }
}

function tabHasFocus(): boolean {
  return (
    typeof document !== 'undefined'
    && document.visibilityState === 'visible'
    && document.hasFocus()
  );
}

function handleNewNotification(n: AppNotification): void {
  useNotificationStore.getState().applyNewNotification(n);

  const hasFocus = tabHasFocus();

  // Lembretes de evento mantêm o comportamento dedicado (popup in-app quando
  // a aba está focada), respeitando os canais configurados pelo usuário.
  if (n.type === 'EVENT_REMINDER') {
    if (prefs.eventReminderSound) playNotificationSound();
    if (prefs.eventReminderPopup && hasFocus) {
      useReminderToastStore.getState().push({
        id: n.id ?? `evrem-${Date.now()}`,
        title: n.title,
        body: n.body,
      });
    }
    if (prefs.eventReminderBrowser && !hasFocus) {
      showBrowserNotification(n.title, n.body, n.id);
    }
    return;
  }

  // Demais notificações (menção, atribuição, comentário, broadcast...): o
  // backend já filtra por preferência DE TIPO antes de emitir. Aqui aplicamos
  // os canais globais (som / notificação do sistema) que o usuário controla
  // nas preferências. Notificação do sistema só quando a aba não está em foco.
  if (prefs.notificationSound) playNotificationSound();
  if (prefs.notificationBrowser && !hasFocus) {
    showBrowserNotification(n.title, n.body, n.id);
  }
}

function connect(token: string): void {
  if (sharedSocket) return;

  // Carrega as preferências de lembrete de evento uma vez por conexão.
  getPreferencesAction()
    .then((data) => {
      if (!data) return;
      prefs = {
        eventReminderSound: Boolean(data.eventReminderSound ?? true),
        eventReminderPopup: Boolean(data.eventReminderPopup ?? true),
        eventReminderBrowser: Boolean(data.eventReminderBrowser ?? true),
        notificationSound: Boolean(data.notificationSound ?? true),
        notificationBrowser: Boolean(data.notificationBrowser ?? true),
      };
    })
    .catch(() => undefined);

  const BACKEND_WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const socket = io(`${BACKEND_WS_URL}/notifications`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
  });
  sharedSocket = socket;

  socket.on('connect', () => socket.emit('subscribeNotifications'));
  socket.on('reconnect', () => socket.emit('subscribeNotifications'));
  socket.on('notification:new', handleNewNotification);
}

function disconnect(): void {
  if (!sharedSocket) return;
  sharedSocket.off();
  sharedSocket.disconnect();
  sharedSocket = null;
}

export function useNotificationSocket(token: string | null) {
  useEffect(() => {
    if (!token) return;

    // Pede permissão de notificação assim que o usuário está autenticado e
    // destrava o áudio no primeiro gesto, para o som conseguir tocar depois.
    requestNotificationPermission();
    primeAudio();

    refCount += 1;
    connect(token);

    return () => {
      refCount -= 1;
      if (refCount <= 0) {
        refCount = 0;
        disconnect();
      }
    };
  }, [token]);
}
