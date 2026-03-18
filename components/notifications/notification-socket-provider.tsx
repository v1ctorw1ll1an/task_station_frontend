'use client';

import { useNotificationSocket } from '@/hooks/use-notification-socket';

interface Props {
  token: string;
}

export function NotificationSocketProvider({ token }: Props) {
  useNotificationSocket(token);
  return null;
}
