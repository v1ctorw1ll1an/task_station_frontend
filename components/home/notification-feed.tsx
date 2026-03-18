'use client';

import Link from 'next/link';
import { AtSign, UserPlus, MessageCircle, RefreshCw, Megaphone, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AppNotification } from '@/lib/stores/notification-store';

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

export function NotificationFeed({ initialData }: NotificationFeedProps) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Notificações recentes</h2>
      </div>

      <div className="divide-y">
        {initialData.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma notificação recente
          </p>
        ) : (
          initialData.map((n) => {
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
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            );

            return taskUrl ? (
              <Link key={n.id} href={taskUrl}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t">
        <Link
          href="/perfil/preferencias-notificacoes"
          className="text-xs text-primary hover:underline"
        >
          Ver todas as notificações
        </Link>
      </div>
    </div>
  );
}
