'use server';
import { getSession } from '@/lib/auth';

interface PreferencePayload {
  adminBroadcast?: boolean;
  mention?: boolean;
  taskAssigned?: boolean;
  taskComment?: boolean;
  taskUpdated?: boolean;
  eventReminder?: boolean;
  eventReminderSound?: boolean;
  eventReminderPopup?: boolean;
  eventReminderBrowser?: boolean;
  notificationSound?: boolean;
  notificationBrowser?: boolean;
}

export async function updatePreferencesAction(data: PreferencePayload) {
  const session = await getSession();
  if (!session) return null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/notificacoes/preferencias`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) return null;
  return res.json();
}
