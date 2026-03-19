'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { AtSign, UserPlus, MessageCircle, RefreshCw, Megaphone, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotificationStore, type AppNotification } from '@/lib/stores/notification-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getNotificationsAction } from '@/actions/notificacao/get-notifications.action';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MENTION: AtSign,
  TASK_ASSIGNED: UserPlus,
  TASK_COMMENT: MessageCircle,
  TASK_UPDATED: RefreshCw,
  ADMIN_BROADCAST: Megaphone,
};

interface NotificationFeedProps {
  initialData: AppNotification[];
}

function NotificationItem({ n }: { n: AppNotification }) {
  const Icon = TYPE_ICONS[n.type] ?? Bell;
  const taskUrl =
    n.taskId && n.project
      ? `/workspace/${n.project.workspaceId}/projetos/${n.project.id}?task=${n.taskId}`
      : null;

  const content = (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
      <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${n.isRead ? 'text-muted-foreground' : 'font-medium'}`}>
          {n.title}
        </p>
        {n.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(n.createdAt), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
      {!n.isRead && <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-primary" />}
    </div>
  );

  return taskUrl ? (
    <Link href={taskUrl}>{content}</Link>
  ) : (
    <div>{content}</div>
  );
}

export function NotificationFeed({ initialData }: NotificationFeedProps) {
  const store = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [allNotifs, setAllNotifs] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (store.notifications.length === 0 && initialData.length > 0) {
      store.hydrate({ notifications: initialData, unreadCount: store.unreadCount });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openModal() {
    setOpen(true);
    if (allNotifs.length === 0) {
      startTransition(async () => {
        const res = await getNotificationsAction(1, 50, false);
        setAllNotifs(res.data);
        setTotal(res.total);
        setPage(1);
      });
    }
  }

  function loadMore() {
    const nextPage = page + 1;
    startTransition(async () => {
      const res = await getNotificationsAction(nextPage, 50, false);
      setAllNotifs((prev) => [...prev, ...res.data]);
      setPage(nextPage);
    });
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Notificações recentes</h2>
      </div>

      <div className="divide-y">
        {store.notifications.slice(0, 5).length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma notificação recente
          </p>
        ) : (
          store.notifications.slice(0, 5).map((n) => <NotificationItem key={n.id} n={n} />)
        )}
      </div>

      <div className="px-4 py-3 border-t">
        <button
          type="button"
          onClick={openModal}
          className="text-xs text-primary hover:underline"
        >
          Ver todas as notificações
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Todas as notificações</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto divide-y -mx-6 px-6">
            {isPending && allNotifs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
            )}
            {!isPending && allNotifs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhuma notificação
              </p>
            )}
            {allNotifs.map((n) => (
              <NotificationItem key={n.id} n={n} />
            ))}
          </div>
          {allNotifs.length < total && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isPending}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {isPending ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
