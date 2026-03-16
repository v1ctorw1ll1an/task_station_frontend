'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, AtSign, UserCheck, MessageSquare, Pencil, Megaphone, X } from 'lucide-react';
import type { AppNotification } from '@/lib/stores/notification-store';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  ADMIN_BROADCAST: { icon: Megaphone, label: 'Aviso', color: 'text-blue-500' },
  MENTION: { icon: AtSign, label: 'Menção', color: 'text-violet-500' },
  TASK_ASSIGNED: { icon: UserCheck, label: 'Atribuição', color: 'text-emerald-500' },
  TASK_COMMENT: { icon: MessageSquare, label: 'Comentário', color: 'text-orange-500' },
  TASK_UPDATED: { icon: Pencil, label: 'Atualização', color: 'text-cyan-500' },
};

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({ notification: n, onRead, onDelete }: NotificationItemProps) {
  const config = TYPE_CONFIG[n.type] ?? { icon: Bell, label: 'Notificação', color: 'text-muted-foreground' };
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer group transition-colors',
        !n.isRead && 'bg-blue-50/50 dark:bg-blue-950/20',
      )}
      onClick={() => !n.isRead && onRead(n.id)}
    >
      <div className={cn('mt-0.5 shrink-0', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-snug', !n.isRead && 'font-medium')}>{n.title}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
            className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-foreground transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      {!n.isRead && (
        <div className="mt-2 shrink-0 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </div>
  );
}
