'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Settings, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { NotificationItem } from './notification-item';
import { getNotificationsAction } from '@/actions/notificacao/get-notifications.action';
import { markAsReadAction } from '@/actions/notificacao/mark-as-read.action';
import { markAllReadAction } from '@/actions/notificacao/mark-all-read.action';
import { deleteNotificationAction } from '@/actions/notificacao/delete-notification.action';

export function NotificationPanel({ onClose }: { onClose?: () => void }) {
  const store = useNotificationStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    getNotificationsAction(1, 20).then((res) => {
      store.hydrate({ notifications: res.data ?? [], unreadCount: store.unreadCount });
      setLoaded(true);
    });
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRead(id: string) {
    store.markAsRead(id);
    await markAsReadAction(id);
  }

  async function handleDelete(id: string) {
    store.removeNotification(id);
    await deleteNotificationAction(id);
  }

  async function handleMarkAllRead() {
    store.markAllAsRead();
    await markAllReadAction();
  }

  const unread = store.unreadCount;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold">Notificações</span>
          {unread > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-blue-500 text-white text-[10px] font-bold px-1.5">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar como lidas
            </Button>
          )}
          <Link href="/perfil/preferencias-notificacoes">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
        {!loaded ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            <p className="text-xs">Carregando...</p>
          </div>
        ) : store.notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <div className="rounded-full bg-muted p-4">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Tudo em dia</p>
              <p className="text-xs text-muted-foreground mt-0.5">Você não tem notificações no momento</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {store.notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={handleRead}
                onDelete={handleDelete}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {store.notifications.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-2.5 text-center">
            <Link
              href="/perfil/preferencias-notificacoes"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Gerenciar preferências de notificação
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
