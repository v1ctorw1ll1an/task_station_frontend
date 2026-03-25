'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { NotificationBell as NotificationBellType } from './notification-bell';

const NotificationBellDynamic = dynamic(
  () => import('./notification-bell').then((m) => m.NotificationBell),
  { ssr: false },
);

export function NotificationBellClient(
  props: ComponentProps<typeof NotificationBellType>,
) {
  return <NotificationBellDynamic {...props} />;
}
