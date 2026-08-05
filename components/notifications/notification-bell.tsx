'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotificationStore } from '@/lib/stores/notification-store';
import type { AppNotification } from '@/lib/stores/notification-store';
import { NotificationPanel } from './notification-panel';
import { useNotificationSocket } from '@/hooks/use-notification-socket';
import { getUnreadCountAction } from '@/actions/notificacao/get-unread-count.action';
import { cn } from '@/lib/utils';
import { MarkdownDisplay } from '@/components/workspace/kanban/markdown-editor';

interface NotificationBellProps {
  token: string;
}

export function NotificationBell({ token }: NotificationBellProps) {
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [broadcastDetail, setBroadcastDetail] = useState<AppNotification | null>(null);

  useNotificationSocket(token);

  useEffect(() => {
    getUnreadCountAction().then(setUnreadCount);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9" data-tour="notification-bell">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                className={cn(
                  'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                  'h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1',
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[380px]" align="end" sideOffset={8}>
          <NotificationPanel
            onClose={() => setOpen(false)}
            onOpenBroadcast={(n) => {
              setOpen(false);
              setBroadcastDetail(n);
            }}
          />
        </PopoverContent>
      </Popover>

      <Dialog open={!!broadcastDetail} onOpenChange={(v) => { if (!v) setBroadcastDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{broadcastDetail?.title}</DialogTitle>
          </DialogHeader>
          {broadcastDetail && (
            <div className="space-y-4">
              <div className="prose-sm max-w-none">
                <MarkdownDisplay content={broadcastDetail.body} />
              </div>
              <div className="text-xs text-muted-foreground border-t pt-3 flex justify-between">
                {broadcastDetail.actor && (
                  <span>Por {broadcastDetail.actor.name}</span>
                )}
                <span>
                  {formatDistanceToNow(new Date(broadcastDetail.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
