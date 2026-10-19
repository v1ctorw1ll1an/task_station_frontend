'use client';

import { useState, useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { setGoogleSyncDirectionAction } from '@/actions/superadmin/google-sync.action';
import type {
  GoogleSyncDirection,
  GoogleSyncPanel as Panel,
} from '@/actions/superadmin/google-sync-types';

const OPTIONS: {
  value: GoogleSyncDirection;
  label: string;
  description: string;
  icon: typeof ArrowLeftRight;
}[] = [
  {
    value: 'both',
    label: 'Nos dois sentidos',
    description:
      'Eventos e prazos do TaskDY vão para o Google, e o que muda no Google volta para o TaskDY.',
    icon: ArrowLeftRight,
  },
  {
    value: 'google_to_app',
    label: 'Só do Google para o TaskDY',
    description:
      'Eventos do Google entram e se atualizam no TaskDY. Nada do TaskDY é enviado ao Google — o que já está lá fica parado.',
    icon: ArrowLeft,
  },
  {
    value: 'app_to_google',
    label: 'Só do TaskDY para o Google',
    description:
      'Eventos e prazos do TaskDY vão para o Google. Edições feitas no Google em cópias do TaskDY são desfeitas, e eventos novos do Google não entram.',
    icon: ArrowRight,
  },
];

export function GoogleSyncPanel({ initial }: { initial: Panel }) {
  const [panel, setPanel] = useState(initial);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const direction = value as GoogleSyncDirection;
    if (direction === panel.direction) return;
    const previous = panel;
    setPanel({ ...panel, direction });
    setMsg(null);
    startTransition(async () => {
      const res = await setGoogleSyncDirectionAction(direction);
      if (!res.data) {
        setPanel(previous);
        setMsg({ type: 'err', text: res.error ?? 'Erro ao salvar a direção' });
        return;
      }
      setPanel(res.data);
      const queued = res.data.resyncQueued ?? 0;
      setMsg({
        type: 'ok',
        text:
          queued > 0
            ? `Direção salva. Sincronização completa agendada para ${queued} ${queued === 1 ? 'conta conectada' : 'contas conectadas'}.`
            : 'Direção salva.',
      });
    });
  }

  const { stats } = panel;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-2.5 shrink-0">
            <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">Google Agenda</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define para onde a sincronização corre, para todos os usuários conectados.
            </p>
          </div>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!panel.enabled && (
          <p className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            A integração está desligada neste servidor (GOOGLE_CALENDAR_ENABLED ou credenciais).
            A direção fica salva e passa a valer quando ela for ligada.
          </p>
        )}

        <RadioGroup
          value={panel.direction}
          onValueChange={handleChange}
          disabled={isPending}
          aria-label="Direção da sincronização"
        >
          {OPTIONS.map(({ value, label, description, icon: Icon }) => (
            <label
              key={value}
              htmlFor={`sync-${value}`}
              className={cn(
                'flex items-start gap-3 rounded-lg border bg-card px-4 py-3 cursor-pointer transition-colors',
                panel.direction === value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                isPending && 'cursor-wait',
              )}
            >
              <RadioGroupItem id={`sync-${value}`} value={value} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>

        {msg && (
          <p className={`text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-destructive'}`}>
            {msg.text}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Ao trocar, cada conta conectada passa por uma sincronização completa para alinhar o
          que ficou de fora enquanto o sentido estava desligado.
          {panel.updatedAt && (
            <>
              {' '}
              Última alteração em{' '}
              {format(parseISO(panel.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {panel.updatedBy && <> por {panel.updatedBy.name}</>}.
            </>
          )}
        </p>

        <Separator />

        <dl className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Contas conectadas" value={stats.activeConnections} />
          <Stat label="Jobs na fila" value={stats.pendingJobs} />
          <Stat
            label="Jobs com falha"
            value={stats.failingJobs}
            warn={stats.failingJobs > 0}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-xl font-semibold tabular-nums',
          warn && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
