'use client';

import { useActionState } from 'react';
import {
  aceitarConviteAction,
  AceitarConviteActionState,
} from '@/actions/aceitar-convite.action';
import { Button } from '@/components/ui/button';

const initialState: AceitarConviteActionState = {};

export function AceitarConviteButton({
  token,
  companyName,
}: {
  token: string;
  companyName: string;
}) {
  const [state, formAction, isPending] = useActionState(aceitarConviteAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Entrando...' : `Entrar em ${companyName}`}
      </Button>
    </form>
  );
}
