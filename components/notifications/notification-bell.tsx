'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { NotificationPanel } from './notification-panel';
import { useNotificationSocket } from '@/hooks/use-notification-socket';
import { getUnreadCountAction } from '@/actions/notificacao/get-unread-count.action';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  token: string;
}

export function NotificationBell({ token }: NotificationBellProps) {
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);

  useNotificationSocket(token);

  useEffect(() => {
    getUnreadCountAction().then(setUnreadCount);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] font-bold px-1',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[380px]" align="end" sideOffset={8}>
        <NotificationPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
