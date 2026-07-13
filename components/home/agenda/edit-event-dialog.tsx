'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { updateEventAction } from '@/actions/eventos/update-event.action';
import { deleteEventAction } from '@/actions/eventos/delete-event.action';
import { rsvpEventAction } from '@/actions/eventos/rsvp-event.action';
import { notifyAgendaChanged } from '@/lib/agenda-events';
import type { CalendarEventOccurrence, AttendeeStatus } from '@/lib/event-types';
import {
  EventFormFields,
  buildInitialFormState,
  combineDateAndTime,
  type EventFormState,
} from './event-form-fields';

interface EditEventDialogProps {
  occurrence: CalendarEventOccurrence;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventDialog({ occurrence, companyId, open, onOpenChange }: EditEventDialogProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<EventFormState>(() =>
    buildInitialFormState({
      title: occurrence.title,
      description: occurrence.description,
      location: occurrence.location,
      allDay: occurrence.allDay,
      startsAt: occurrence.startsAt,
      endsAt: occurrence.endsAt,
      color: occurrence.color,
      rrule: occurrence.rrule,
      reminders: occurrence.reminders.map((r) => ({ minutesBefore: r.minutesBefore })),
      timezone: occurrence.timezone,
      guestEmails: occurrence.guestEmails,
    }),
  );
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [saveScope, setSaveScope] = useState<'single' | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteScope, setDeleteScope] = useState<'single' | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isRsvping, startRsvp] = useTransition();

  function doSave(formData: FormData) {
    startSaving(async () => {
      const result = await updateEventAction({}, formData);
      if (result.success) {
        setConfirmSaveOpen(false);
        onOpenChange(false);
        notifyAgendaChanged();
        router.refresh();
      } else {
        setError(result.error ?? 'Erro ao salvar');
        setConfirmSaveOpen(false);
      }
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    // Evento recorrente: pergunta o escopo (apenas este / toda a série) num popup
    // antes de salvar. Ao confirmar lá, o evento é salvo e o diálogo fecha.
    if (occurrence.isRecurringInstance) {
      setPendingFormData(formData);
      setSaveScope('all');
      setConfirmSaveOpen(true);
      return;
    }
    doSave(formData);
  }

  function confirmSave() {
    if (!pendingFormData) return;
    const fd = pendingFormData;
    fd.set('scope', saveScope);
    if (saveScope === 'single') {
      fd.set('originalDate', occurrence.originalDate);
      // Alterar só esta ocorrência não deve mexer na regra da série.
      fd.delete('rrule');
    } else {
      fd.delete('originalDate');
      fd.set('rrule', formState.rrule);
    }
    doSave(fd);
  }

  function handleDelete() {
    startDeleting(async () => {
      const result = await deleteEventAction(
        occurrence.eventId,
        deleteScope,
        deleteScope === 'single' ? occurrence.originalDate : undefined,
        companyId,
      );
      if (result.success) {
        setConfirmDelete(false);
        onOpenChange(false);
        notifyAgendaChanged();
        router.refresh();
      }
    });
  }

  function handleRsvp(status: AttendeeStatus) {
    startRsvp(async () => {
      const result = await rsvpEventAction(occurrence.eventId, status, companyId);
      if (result.success) {
        onOpenChange(false);
        notifyAgendaChanged();
        router.refresh();
      }
    });
  }

  const canEdit = occurrence.isOwner;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{canEdit ? 'Editar evento' : 'Detalhes do evento'}</DialogTitle>
          </DialogHeader>

          {canEdit ? (
            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="eventId" value={occurrence.eventId} />
              <input type="hidden" name="companyId" value={companyId} />
              {/* scope/originalDate/rrule são ajustados em confirmSave conforme a
                  escolha no popup; aqui vai o padrão (toda a série / evento único). */}
              <input type="hidden" name="scope" value="all" />
              <input type="hidden" name="title" value={formState.title} />
              <input type="hidden" name="description" value={formState.description} />
              <input type="hidden" name="location" value={formState.location} />
              <input type="hidden" name="color" value={formState.color} />
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
              <input type="hidden" name="rrule" value={formState.rrule} />
              <input type="hidden" name="reminders" value={formState.reminders.join(',')} />
              <input type="hidden" name="guestEmails" value={formState.guestEmails.join(',')} />

              <EventFormFields state={formState} onChange={setFormState} />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    setDeleteScope(occurrence.isRecurringInstance ? 'single' : 'all');
                    setConfirmDelete(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending || !formState.title.trim()}>
                    {isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{occurrence.title}</h2>
              {occurrence.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {occurrence.description}
                </p>
              )}
              {occurrence.location && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Local: </span>
                  {occurrence.location}
                </p>
              )}
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium">Você foi convidado</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={occurrence.myRsvpStatus === 'accepted' ? 'default' : 'outline'}
                    disabled={isRsvping}
                    onClick={() => handleRsvp('accepted')}
                  >
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant={occurrence.myRsvpStatus === 'tentative' ? 'default' : 'outline'}
                    disabled={isRsvping}
                    onClick={() => handleRsvp('tentative')}
                  >
                    Talvez
                  </Button>
                  <Button
                    size="sm"
                    variant={occurrence.myRsvpStatus === 'declined' ? 'default' : 'outline'}
                    disabled={isRsvping}
                    onClick={() => handleRsvp('declined')}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Este é um evento recorrente. As alterações afetam:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSaveScope('single')}
              className={
                saveScope === 'single'
                  ? 'rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1 text-xs'
                  : 'rounded-full border bg-card hover:bg-accent px-3 py-1 text-xs'
              }
            >
              Apenas este
            </button>
            <button
              type="button"
              onClick={() => setSaveScope('all')}
              className={
                saveScope === 'all'
                  ? 'rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1 text-xs'
                  : 'rounded-full border bg-card hover:bg-accent px-3 py-1 text-xs'
              }
            >
              Toda a série
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                confirmSave();
              }}
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              {occurrence.isRecurringInstance
                ? 'Este é um evento recorrente. Escolha o que excluir:'
                : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {occurrence.isRecurringInstance && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteScope('single')}
                className={
                  deleteScope === 'single'
                    ? 'rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1 text-xs'
                    : 'rounded-full border bg-card hover:bg-accent px-3 py-1 text-xs'
                }
              >
                Apenas esta ocorrência
              </button>
              <button
                type="button"
                onClick={() => setDeleteScope('all')}
                className={
                  deleteScope === 'all'
                    ? 'rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1 text-xs'
                    : 'rounded-full border bg-card hover:bg-accent px-3 py-1 text-xs'
                }
              >
                Toda a série
              </button>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
