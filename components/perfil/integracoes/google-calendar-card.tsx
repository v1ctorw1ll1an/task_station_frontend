'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCw,
  Unplug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { getGoogleCalendarStatusAction } from '@/actions/integracoes/get-google-calendar-status.action';
import { connectGoogleCalendarAction } from '@/actions/integracoes/connect-google-calendar.action';
import { disconnectGoogleCalendarAction } from '@/actions/integracoes/disconnect-google-calendar.action';
import { updateGoogleCalendarSourcesAction } from '@/actions/integracoes/update-google-calendar-sources.action';
import { syncGoogleCalendarAction } from '@/actions/integracoes/sync-google-calendar.action';
import type { GoogleCalendarStatus } from '@/actions/integracoes/google-calendar-types';

const STATUS_LABEL: Record<string, string> = {
  trial: 'em período de teste',
  readonly: 'em somente leitura',
  canceled: 'cancelada',
};

const RETURN_MESSAGES: Record<string, { type: 'ok' | 'err'; text: string }> = {
  connected: {
    type: 'ok',
    text: 'Google Agenda conectado. A primeira sincronização começa em instantes.',
  },
  cancelled: { type: 'err', text: 'Conexão cancelada no Google.' },
  error: { type: 'err', text: 'Não foi possível conectar ao Google Agenda.' },
};

const ERROR_REASONS: Record<string, string> = {
  forbidden:
    'A integração exige ao menos uma empresa com plano ativo (o período de teste não conta).',
  expired: 'O pedido de conexão expirou ou o Google não liberou o acesso. Tente de novo.',
};

export function GoogleCalendarCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingSource, setSavingSource] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Mensagem de volta do OAuth (?google=connected|cancelled|error&reason=...).
  const [prevParam, setPrevParam] = useState<string | null>(null);
  const googleParam = searchParams.get('google');
  if (googleParam !== prevParam) {
    setPrevParam(googleParam);
    const base = googleParam ? RETURN_MESSAGES[googleParam] : undefined;
    if (base) {
      const detail = ERROR_REASONS[searchParams.get('reason') ?? ''];
      setMsg(base.type === 'err' && detail ? { type: 'err', text: detail } : base);
    }
  }

  useEffect(() => {
    getGoogleCalendarStatusAction().then((res) => {
      if (res.data) setStatus(res.data);
      else setLoadError(res.error ?? 'Erro ao carregar a integração');
    });
  }, []);

  function handleConnect() {
    setMsg(null);
    startTransition(async () => {
      const res = await connectGoogleCalendarAction();
      if (res.url) {
        window.location.href = res.url;
      } else {
        setMsg({ type: 'err', text: res.error ?? 'Não foi possível iniciar a conexão' });
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const res = await disconnectGoogleCalendarAction();
      setConfirmDisconnect(false);
      if (res.error) {
        setMsg({ type: 'err', text: res.error });
        return;
      }
      setMsg({ type: 'ok', text: 'Google Agenda desconectado. Nada foi apagado.' });
      const refreshed = await getGoogleCalendarStatusAction();
      if (refreshed.data) setStatus(refreshed.data);
      router.replace('/perfil/integracoes');
    });
  }

  function handleSyncNow() {
    startTransition(async () => {
      const res = await syncGoogleCalendarAction();
      setMsg(
        res.error
          ? { type: 'err', text: res.error }
          : { type: 'ok', text: 'Sincronização agendada. Leva até um minuto.' },
      );
    });
  }

  async function handleToggleSource(sourceId: string, importEnabled: boolean) {
    if (!status) return;
    setSavingSource(sourceId);
    setStatus({
      ...status,
      calendars: status.calendars.map((c) => (c.id === sourceId ? { ...c, importEnabled } : c)),
    });
    const res = await updateGoogleCalendarSourcesAction([{ sourceId, importEnabled }]);
    setSavingSource(null);
    if (res.data) setStatus(res.data);
    else setMsg({ type: 'err', text: res.error ?? 'Erro ao salvar calendários' });
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </CardContent>
      </Card>
    );
  }

  const conn = status.connection;
  const active = conn?.status === 'active';
  const ineligible = status.companies.filter((c) => !c.eligible);
  const available = status.enabled && status.allowed;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-2.5 shrink-0">
              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">Google Agenda</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seus eventos e prazos de tarefas no Google Agenda, e os eventos do Google aqui na
                agenda do TaskDY.
              </p>
            </div>
            {active && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {msg && (
            <p className={`text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-destructive'}`}>
              {msg.text}
            </p>
          )}

          {!available && (
            <p className="text-sm text-muted-foreground">
              {status.enabled
                ? 'A integração ainda está em teste fechado e não foi liberada para a sua conta.'
                : 'A integração com o Google Agenda ainda não está disponível.'}
            </p>
          )}

          {available && !active && (
            <div className="space-y-3">
              {conn?.status === 'revoked' && conn.lastError && (
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {conn.lastError}
                </p>
              )}
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>Criamos um calendário “TaskDY” na sua conta com seus eventos e prazos.</li>
                <li>Eventos que você cria no Google aparecem aqui como eventos pessoais.</li>
                <li>Tarefas vão só para o Google (edite-as pelo TaskDY).</li>
              </ul>
              <Button onClick={handleConnect} disabled={isPending || !status.canConnect} className="gap-1.5">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                {conn ? 'Conectar de novo' : 'Conectar Google Agenda'}
              </Button>
              {!status.canConnect && (
                <p className="text-xs text-muted-foreground">
                  É preciso ter ao menos uma empresa com plano ativo — o período de teste não
                  inclui a integração.
                </p>
              )}
            </div>
          )}

          {available && active && conn && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{conn.googleEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    {conn.lastSyncAt
                      ? `Última sincronização ${formatDistanceToNow(parseISO(conn.lastSyncAt), { addSuffix: true, locale: ptBR })}`
                      : 'Primeira sincronização em andamento…'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSyncNow} disabled={isPending} className="gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
                  Sincronizar agora
                </Button>
              </div>

              {conn.lastError && (
                <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {conn.lastError}
                </p>
              )}

              {ineligible.length > 0 && (
                <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 space-y-0.5">
                  {ineligible.map((c) => (
                    <p key={c.companyId}>
                      A empresa <strong>{c.name}</strong> está{' '}
                      {STATUS_LABEL[c.status ?? ''] ?? 'sem plano ativo'}: os itens dela não vão
                      para o Google (e o que já está lá fica congelado).
                    </p>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Calendários do Google</p>
                  <p className="text-xs text-muted-foreground">
                    Escolha quais calendários também aparecem no TaskDY.
                  </p>
                </div>
                {status.calendars.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{c.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.isTaskdyCalendar
                          ? 'Sempre sincronizado — é onde o TaskDY escreve'
                          : c.writable
                            ? 'Edições feitas no TaskDY voltam para este calendário'
                            : 'Somente leitura — edite pelo Google'}
                      </p>
                    </div>
                    {c.isTaskdyCalendar ? (
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" aria-label="Fixo" />
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        {savingSource === c.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        )}
                        <Switch
                          checked={c.importEnabled}
                          disabled={savingSource === c.id}
                          onCheckedChange={(v) => handleToggleSource(c.id, v)}
                          aria-label={`Importar ${c.summary}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setConfirmDisconnect(true)}
                disabled={isPending}
              >
                <Unplug className="h-4 w-4" />
                Desconectar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar o Google Agenda?</AlertDialogTitle>
            <AlertDialogDescription>
              A sincronização para, mas nada é apagado: o calendário “TaskDY” continua na sua
              conta Google e os eventos importados continuam no TaskDY. Se conectar de novo, a
              sincronização retoma sem duplicar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDisconnect();
              }}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
