import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  taskId: string | null;
  projectId: string | null;
  actorId: string | null;
  actor: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
  project: { id: string; name: string; workspaceId: string } | null;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  hydrate: (data: { notifications: AppNotification[]; unreadCount: number }) => void;
  applyNewNotification: (n: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  hydrate: ({ notifications, unreadCount }) => set({ notifications, unreadCount }),

  applyNewNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - (s.notifications.find((n) => n.id === id && !n.isRead) ? 1 : 0)),
    })),

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      unreadCount: s.unreadCount - (s.notifications.find((n) => n.id === id && !n.isRead) ? 1 : 0),
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),
}));
