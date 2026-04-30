'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createEventAction } from '@/actions/eventos/create-event.action';
import {
  EventFormFields,
  buildInitialFormState,
  combineDateAndTime,
  type EventFormState,
} from './event-form-fields';

interface CreateEventDialogProps {
  companyId: string;
  defaultDate?: Date;
  /** Modo controlado: quando definido, o trigger button não é renderizado */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Esconde o botão trigger (útil em modo controlado externamente) */
  hideTrigger?: boolean;
}

function buildStateForDate(defaultDate?: Date): EventFormState {
  const baseState = buildInitialFormState();
  if (defaultDate) {
    const yyyy = defaultDate.getFullYear();
    const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const dd = String(defaultDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    baseState.startDate = dateStr;
    baseState.endDate = dateStr;
  }
  return baseState;
}

export function CreateEventDialog({
  companyId,
  defaultDate,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideTrigger,
}: CreateEventDialogProps) {
  const router = useRouter();
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp : internalOpen;
  const [formState, setFormState] = useState<EventFormState>(() => buildStateForDate(defaultDate));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setOpen(next: boolean) {
    if (isControlled) {
      onOpenChangeProp?.(next);
    } else {
      setInternalOpen(next);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setFormState(buildStateForDate(defaultDate));
      setError(null);
    }
    setOpen(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createEventAction({}, formData);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? 'Erro ao criar evento');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Novo evento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="title" value={formState.title} />
          <input type="hidden" name="description" value={formState.description} />
          <input type="hidden" name="location" value={formState.location} />
          <input type="hidden" name="color" value={formState.color} />
          <input type="hidden" name="rrule" value={formState.rrule} />
          <input type="hidden" name="allDay" value={String(formState.allDay)} />
          <input type="hidden" name="timezone" value={formState.timezone} />
          <input
            type="hidden"
            name="startsAt"
            value={combineDateAndTime(
              formState.startDate,
              formState.startTime,
              formState.allDay,
              formState.timezone,
            )}
          />
          <input
            type="hidden"
            name="endsAt"
            value={combineDateAndTime(
              formState.endDate,
              formState.endTime,
              formState.allDay,
              formState.timezone,
            )}
          />
          <input type="hidden" name="reminders" value={formState.reminders.join(',')} />
          <input type="hidden" name="guestEmails" value={formState.guestEmails.join(',')} />

          <EventFormFields state={formState} onChange={setFormState} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !formState.title.trim()}>
              {isPending ? 'Criando...' : 'Criar evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
