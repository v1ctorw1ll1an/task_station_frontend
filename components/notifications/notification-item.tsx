'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, AtSign, UserCheck, MessageSquare, Pencil, Megaphone, X, FolderKanban } from 'lucide-react';
import type { AppNotification } from '@/lib/stores/notification-store';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  ADMIN_BROADCAST: { icon: Megaphone,     bg: 'bg-blue-100 dark:bg-blue-900/40',     color: 'text-blue-600 dark:text-blue-400' },
  MENTION:         { icon: AtSign,        bg: 'bg-violet-100 dark:bg-violet-900/40', color: 'text-violet-600 dark:text-violet-400' },
  TASK_ASSIGNED:   { icon: UserCheck,     bg: 'bg-emerald-100 dark:bg-emerald-900/40', color: 'text-emerald-600 dark:text-emerald-400' },
  TASK_COMMENT:    { icon: MessageSquare, bg: 'bg-orange-100 dark:bg-orange-900/40', color: 'text-orange-600 dark:text-orange-400' },
  TASK_UPDATED:    { icon: Pencil,        bg: 'bg-cyan-100 dark:bg-cyan-900/40',     color: 'text-cyan-600 dark:text-cyan-400' },
};

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({ notification: n, onRead, onDelete, onClose }: NotificationItemProps) {
  const router = useRouter();
  const config = TYPE_CONFIG[n.type] ?? { icon: Bell, bg: 'bg-muted', color: 'text-muted-foreground' };
  const Icon = config.icon;

  const taskUrl =
    n.task && n.project
      ? `/workspace/${n.project.workspaceId}/projetos/${n.project.id}?task=${n.task.id}`
      : null;

  function handleClick() {
    if (!n.isRead) onRead(n.id);
    if (taskUrl) {
      onClose?.();
      router.push(taskUrl);
    }
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 px-4 py-3.5 group transition-colors',
        taskUrl ? 'cursor-pointer hover:bg-muted/60' : 'cursor-default',
        !n.isRead && 'bg-blue-50/60 dark:bg-blue-950/25',
      )}
      onClick={handleClick}
    >
      {/* Type icon */}
      <div className={cn('mt-0.5 shrink-0 rounded-full p-2', config.bg)}>
        <Icon className={cn('h-3.5 w-3.5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-5">
        <p className={cn('text-sm leading-snug', !n.isRead ? 'font-semibold' : 'font-medium')}>
          {n.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>

        {/* Task / Project context */}
        {(n.task || n.project) && (
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {n.task && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground font-medium max-w-[160px] truncate">
                <FolderKanban className="h-3 w-3 shrink-0" />
                <span className="truncate">{n.task.title}</span>
              </span>
            )}
            {n.project && (
              <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground max-w-[120px] truncate">
                {n.project.name}
              </span>
            )}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground/60 mt-1.5">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
        </p>
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
        className={cn(
          'absolute top-3 right-3 p-1 rounded-md',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'text-muted-foreground hover:text-foreground hover:bg-muted',
        )}
      >
        <X className="h-3 w-3" />
      </button>

      {/* Unread dot */}
      {!n.isRead && (
        <span className="absolute top-4 right-3 h-2 w-2 rounded-full bg-blue-500 group-hover:opacity-0 transition-opacity" />
      )}
    </div>
  );
}
