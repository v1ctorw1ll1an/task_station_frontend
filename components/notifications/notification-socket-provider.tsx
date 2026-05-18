'use client';

import { useNotificationSocket } from '@/hooks/use-notification-socket';
import { EventReminderToastContainer } from './event-reminder-toast';

interface Props {
  token: string;
}

export function NotificationSocketProvider({ token }: Props) {
  useNotificationSocket(token);
  return <EventReminderToastContainer />;
}
