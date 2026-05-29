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

function formatBrPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

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
  const phoneHiddenRef = useRef<HTMLInputElement>(null);

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
              Telefone <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                +55
              </span>
              <Input
                id="guest-phone"
                required
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                autoComplete="off"
                maxLength={16}
                className="flex-1"
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                  e.target.value = formatBrPhone(digits);
                  if (phoneHiddenRef.current) {
                    phoneHiddenRef.current.value = digits ? `+55${digits}` : '';
                  }
                }}
              />
            </div>
            <input ref={phoneHiddenRef} type="hidden" name="phone" />
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
