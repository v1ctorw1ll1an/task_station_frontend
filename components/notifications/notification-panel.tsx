'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { NotificationItem } from './notification-item';
import { getNotificationsAction } from '@/actions/notificacao/get-notifications.action';
import { markAsReadAction } from '@/actions/notificacao/mark-as-read.action';
import { markAllReadAction } from '@/actions/notificacao/mark-all-read.action';
import { deleteNotificationAction } from '@/actions/notificacao/delete-notification.action';

export function NotificationPanel() {
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

  return (
    <div className="flex flex-col w-80 max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold">Notificações</span>
        <div className="flex items-center gap-2">
          {store.unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAllRead}>
              Marcar todas como lidas
            </Button>
          )}
          <Link href="/perfil/preferencias-notificacoes">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
      <Separator />

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {store.notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          store.notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={handleRead} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
