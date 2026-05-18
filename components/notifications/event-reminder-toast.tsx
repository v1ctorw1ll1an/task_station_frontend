'use client';

import { useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { useReminderToastStore } from '@/lib/stores/reminder-toast-store';

const AUTO_DISMISS_MS = 30_000;

export function EventReminderToastContainer() {
  const toasts = useReminderToastStore((s) => s.toasts);
  const dismiss = useReminderToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), AUTO_DISMISS_MS),
    );
    return () => {
      for (const id of timers) clearTimeout(id);
    };
  }, [toasts, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className="pointer-events-auto rounded-lg border bg-popover shadow-lg overflow-hidden animate-in slide-in-from-right-4 duration-300"
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-2 shrink-0">
              <BellRing className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={t.title}>
                {t.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.body}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
