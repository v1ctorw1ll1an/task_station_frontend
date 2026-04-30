export type AttendeeStatus = 'invited' | 'accepted' | 'declined' | 'tentative';
export type ReminderMethod = 'notification' | 'email';
export type EventVisibility = 'private' | 'shared';
export type EventMutationScope = 'single' | 'future' | 'all';

export interface EventAttendee {
  userId: string;
  name: string;
  email: string;
  photoUrl: string | null;
  status: AttendeeStatus;
}

export interface EventReminder {
  minutesBefore: number;
  method: ReminderMethod;
}

/** Ocorrência expandida — uma instância de evento numa data específica. */
export interface CalendarEventOccurrence {
  eventId: string;
  occurrenceKey: string;
  originalDate: string;
  title: string;
  description: string | null;
  location: string | null;
  color: string | null;
  allDay: boolean;
  startsAt: string;
  endsAt: string;
  timezone: string;
  visibility: EventVisibility;
  isRecurringInstance: boolean;
  isOwner: boolean;
  myRsvpStatus: AttendeeStatus | null;
  attendees: EventAttendee[];
  reminders: EventReminder[];
  guestEmails: string[];
  taskId: string | null;
  workspaceId: string | null;
  companyId: string | null;
}
