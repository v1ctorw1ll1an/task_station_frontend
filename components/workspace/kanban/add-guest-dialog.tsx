'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addGuestAction,
  type AddGuestActionState,
} from '@/actions/projeto/add-guest.action';

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId: string;
  onCreated?: () => void;
}

const initialState: AddGuestActionState = {};

export function AddGuestDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  onCreated,
}: AddGuestDialogProps) {
  const [state, formAction, pending] = useActionState(addGuestAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const handledWhatsappRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.success && state.whatsappUrl && handledWhatsappRef.current !== state.whatsappUrl) {
      handledWhatsappRef.current = state.whatsappUrl;
      window.open(state.whatsappUrl, '_blank', 'noopener,noreferrer');
      onCreated?.();
      formRef.current?.reset();
      onOpenChange(false);
    }
  }, [state, onOpenChange, onCreated]);

  useEffect(() => {
    if (!open) {
      handledWhatsappRef.current = null;
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar convidado</DialogTitle>
          <DialogDescription>
            O convidado receberá um link público da task via WhatsApp e poderá acompanhar e atualizar
            esta task sem precisar de cadastro.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="taskId" value={taskId} />

          <div className="space-y-1.5">
            <Label htmlFor="guest-name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input id="guest-name" name="name" required maxLength={120} autoComplete="off" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-phone">
              Telefone (com DDI) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="guest-phone"
              name="phone"
              required
              placeholder="+55 11 99999-9999"
              inputMode="tel"
              autoComplete="off"
            />
            <p className="text-[10px] text-muted-foreground">
              Use formato internacional, ex: +5511999999999
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-email">Email (opcional)</Label>
            <Input id="guest-email" name="email" type="email" maxLength={254} autoComplete="off" />
          </div>

          {state.error && (
            <p className="text-xs text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Salvar e enviar por WhatsApp
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
