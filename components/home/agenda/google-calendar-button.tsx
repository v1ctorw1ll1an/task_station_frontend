'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getGoogleCalendarStatusAction } from '@/actions/integracoes/get-google-calendar-status.action';
import { connectGoogleCalendarAction } from '@/actions/integracoes/connect-google-calendar.action';
import type { GoogleCalendarStatus } from '@/actions/integracoes/google-calendar-types';

/** Marca do Google Agenda (versão simplificada, legível em 16px). */
function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 5a2 2 0 0 1 2-2h13v4H7v11H3z" fill="#4285F4" />
      <path d="M18 3h1a2 2 0 0 1 2 2v2h-3z" fill="#1967D2" />
      <path d="M18 7h3v10h-3z" fill="#FBBC04" />
      <path d="M3 18h4v3H5a2 2 0 0 1-2-2z" fill="#188038" />
      <path d="M7 17h11v4H7z" fill="#34A853" />
      <path d="M18 17h3l-3 4z" fill="#EA4335" />
      <path d="M7 7h11v10H7z" fill="#fff" />
      <text
        x="12.5"
        y="15.2"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill="#4285F4"
      >
        31
      </text>
    </svg>
  );
}

/**
 * Atalho da agenda para a integração com o Google Agenda. Só aparece quando o
 * usuário pode usá-la: flag ligada, liberado no teste fechado e com empresa elegível
 * (ou já conectado). Desconectado → inicia o OAuth; conectado → abre as configurações.
 */
export function GoogleCalendarButton() {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getGoogleCalendarStatusAction().then((res) => {
      if (res.data) setStatus(res.data);
    });
  }, []);

  if (!status || !status.enabled || !status.allowed) return null;

  const connected = status.connection?.status === 'active';
  if (!connected && !status.canConnect) return null;

  const buttonClass =
    'relative h-9 flex items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent transition-colors shrink-0';

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      const res = await connectGoogleCalendarAction();
      if (res.url) window.location.href = res.url;
      else setError(res.error ?? 'Não foi possível iniciar a conexão');
    });
  }

  const label = connected
    ? `Google Agenda conectado (${status.connection?.googleEmail}) — gerenciar`
    : 'Conectar ao Google Agenda';

  return (
    <TooltipProvider>
      {/* Com erro, o tooltip fica aberto para a mensagem não sumir junto com o hover. */}
      <Tooltip
        open={error ? true : undefined}
        onOpenChange={(open) => {
          if (!open) setError(null);
        }}
      >
        <TooltipTrigger asChild>
          {connected ? (
            <Link href="/perfil/integracoes" className={buttonClass} aria-label={label}>
              <GoogleCalendarIcon className="h-6 w-6" />
              <span>Google Agenda conectado</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isPending}
              className={cn(buttonClass, 'disabled:opacity-60')}
              aria-label={label}
            >
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <GoogleCalendarIcon className="h-6 w-6" />
              )}
              <span>Conectar ao Google Agenda</span>
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent className={cn(error && 'text-destructive')}>
          {error ?? label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
