'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { notifyGuestAction } from '@/actions/projeto/notify-guest.action';
import type { TaskGuestSummary } from '@/actions/projeto/list-guests.action';

interface SendChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId: string;
  guests: TaskGuestSummary[];
  historyEntryIds: string[];
}

function initialOf(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return (first[0] ?? '?').toUpperCase();
}

export function SendChangesDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  guests,
  historyEntryIds,
}: SendChangesDialogProps) {
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSend = (guestId: string) => {
    setError(null);
    setPendingId(guestId);
    startTransition(async () => {
      const res = await notifyGuestAction(projectId, taskId, guestId, historyEntryIds);
      if (res.error || !res.whatsappUrl) {
        setError(res.error ?? 'Erro ao gerar mensagem');
      } else {
        window.open(res.whatsappUrl, '_blank', 'noopener,noreferrer');
        setSent((prev) => {
          const next = new Set(prev);
          next.add(guestId);
          return next;
        });
      }
      setPendingId(null);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar alterações aos convidados</DialogTitle>
          <DialogDescription>
            Você fez alterações nesta task. Envie um resumo via WhatsApp para os convidados que
            acompanham este card.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <ul className="space-y-1 max-h-[40vh] overflow-y-auto">
          {guests.map((guest) => {
            const isSent = sent.has(guest.id);
            const isLoading = pending && pendingId === guest.id;
            return (
              <li
                key={guest.id}
                className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {initialOf(guest.name)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium">{guest.name}</span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {guest.phoneE164}
                  </span>
                </div>
                {isSent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    enviado
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSend(guest.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    title={`Enviar para ${guest.name}`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    enviar
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            <X className="h-4 w-4" />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
