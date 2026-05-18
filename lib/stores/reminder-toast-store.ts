import { create } from 'zustand';

export interface ReminderToast {
  id: string;
  title: string;
  body: string;
  /** ISO string */
  shownAt: string;
}

interface ReminderToastStore {
  toasts: ReminderToast[];
  push: (toast: Omit<ReminderToast, 'shownAt'>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_TOASTS = 4;

export const useReminderToastStore = create<ReminderToastStore>((set) => ({
  toasts: [],
  push(toast) {
    set((state) => ({
      toasts: [
        { ...toast, shownAt: new Date().toISOString() },
        ...state.toasts.filter((t) => t.id !== toast.id),
      ].slice(0, MAX_TOASTS),
    }));
  },
  dismiss(id) {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clear() {
    set({ toasts: [] });
  },
}));
