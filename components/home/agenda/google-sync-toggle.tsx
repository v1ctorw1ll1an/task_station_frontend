'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getGoogleCalendarStatusAction } from '@/actions/integracoes/get-google-calendar-status.action';
import type { GoogleCalendarStatus } from '@/actions/integracoes/google-calendar-types';
import { FieldHint } from './event-form-fields';

export interface GoogleSyncAvailability {
  /** Usuário tem acesso à integração (flag ligada + liberado no teste fechado). */
  available: boolean;
  /** Conexão ativa e o TaskDY pode escrever no Google. */
  active: boolean;
}

/**
 * Estado da integração para os diálogos de evento. Rebusca a cada abertura: a
 * integração pode ter sido ligada/desligada em Perfil → Integrações.
 */
export function useGoogleSyncAvailability(open: boolean): GoogleSyncAvailability {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);

  useEffect(() => {
    if (!open) return;
    getGoogleCalendarStatusAction().then((res) => {
      if (res.data) setStatus(res.data);
    });
  }, [open]);

  const available = !!status?.enabled && !!status.allowed;
  return {
    available,
    active:
      available &&
      status?.connection?.status === 'active' &&
      status.direction !== 'google_to_app',
  };
}

interface GoogleSyncToggleProps {
  availability: GoogleSyncAvailability;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Toggle "enviar este evento ao Google Agenda". Sem acesso à integração, some;
 * com a sincronização inativa, aparece desligado e travado.
 */
export function GoogleSyncToggle({ availability, checked, onCheckedChange }: GoogleSyncToggleProps) {
  if (!availability.available) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor="event-sync-google" className="cursor-pointer text-xs text-muted-foreground">
        Google Agenda
      </Label>
      <FieldHint>
        {availability.active
          ? 'Salvar este evento no seu Google Agenda. Desmarque para mantê-lo só no TaskDY.'
          : 'A sincronização com o Google Agenda está desativada — ative em Perfil → Integrações.'}
      </FieldHint>
      <Switch
        id="event-sync-google"
        checked={availability.active && checked}
        disabled={!availability.active}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
