'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AtSign, Bell, BellRing, CalendarClock, CheckCircle2, Megaphone, MessageSquare, Monitor, Pencil, UserCheck, Volume2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { getPreferencesAction } from '@/actions/notificacao/get-preferences.action';
import { updatePreferencesAction } from '@/actions/notificacao/update-preferences.action';

interface Preferences {
  adminBroadcast: boolean;
  mention: boolean;
  taskAssigned: boolean;
  taskComment: boolean;
  taskUpdated: boolean;
  eventReminder: boolean;
  eventReminderSound: boolean;
  eventReminderPopup: boolean;
  eventReminderBrowser: boolean;
  notificationSound: boolean;
  notificationBrowser: boolean;
}

const PREF_CONFIG: {
  key: keyof Preferences;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    key: 'adminBroadcast',
    label: 'Avisos do administrador',
    description: 'Mensagens enviadas por admins ou pelo superadmin para você ou para todos',
    icon: Megaphone,
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'mention',
    label: 'Menções em comentários',
    description: 'Quando alguém te menciona com @nome em um comentário de uma task',
    icon: AtSign,
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: 'taskAssigned',
    label: 'Atribuição de task',
    description: 'Quando você é atribuído como responsável por uma task',
    icon: UserCheck,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'taskComment',
    label: 'Comentários em tasks',
    description: 'Novos comentários em tasks das quais você é assignee ou reporter',
    icon: MessageSquare,
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    key: 'taskUpdated',
    label: 'Atualizações de task',
    description: 'Mudanças de título, prioridade ou prazo em tasks que você participa',
    icon: Pencil,
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    key: 'eventReminder',
    label: 'Lembretes de eventos',
    description: 'Receber lembretes de eventos do calendário no horário configurado',
    icon: CalendarClock,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
];

const EVENT_REMINDER_CHANNELS: {
  key: keyof Preferences;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    key: 'eventReminderPopup',
    label: 'Popup na tela',
    description: 'Mostrar um aviso flutuante quando o evento estiver para começar',
    icon: BellRing,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'eventReminderSound',
    label: 'Som de alerta',
    description: 'Tocar um som curto quando o lembrete disparar',
    icon: Volume2,
    iconBg: 'bg-pink-100 dark:bg-pink-900/40',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    key: 'eventReminderBrowser',
    label: 'Notificação do sistema',
    description: 'Mostrar notificação do navegador mesmo com a aba em segundo plano (requer permissão)',
    icon: Monitor,
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
];

// Canais globais — valem para todas as notificações (menções, tasks, avisos).
// Lembretes de evento têm seus próprios canais acima.
const GLOBAL_CHANNELS: {
  key: keyof Preferences;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    key: 'notificationSound',
    label: 'Som de notificação',
    description: 'Tocar um som curto sempre que você receber uma notificação',
    icon: Volume2,
    iconBg: 'bg-pink-100 dark:bg-pink-900/40',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    key: 'notificationBrowser',
    label: 'Notificação do sistema',
    description: 'Mostrar a notificação na central do Windows quando o app estiver em segundo plano (requer permissão)',
    icon: Monitor,
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
];

const PREF_KEYS = [
  ...PREF_CONFIG.map((p) => p.key),
  ...EVENT_REMINDER_CHANNELS.map((p) => p.key),
  ...GLOBAL_CHANNELS.map((p) => p.key),
];
const TOP_LEVEL_PREF_KEYS = PREF_CONFIG.map((p) => p.key);

export default function PreferenciasNotificacoesPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    getPreferencesAction().then((data) => {
      if (data) {
        // Pega apenas as 5 chaves booleanas — ignora id, userId, updatedAt etc.
        const parsed = PREF_KEYS.reduce((acc, key) => {
          acc[key] = Boolean((data as Record<string, unknown>)[key]);
          return acc;
        }, {} as Preferences);
        setPrefs(parsed);
      }
    });
  }, []);

  async function handleToggle(key: keyof Preferences, value: boolean) {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: value });
    setSavingKey(key);
    setSavedKey(null);

    // Se ativando uma notificação do sistema, pedir permissão antes
    if (
      (key === 'eventReminderBrowser' || key === 'notificationBrowser')
      && value
      && typeof window !== 'undefined'
      && 'Notification' in window
    ) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission().catch(() => undefined);
      }
    }

    await updatePreferencesAction({ [key]: value });
    setSavingKey(null);
    setSavedKey(key);
    setTimeout(() => setSavedKey((prev) => (prev === key ? null : prev)), 2000);
  }

  // Conta apenas os toggles principais (top-level)
  const enabledCount = prefs ? TOP_LEVEL_PREF_KEYS.filter((k) => prefs[k]).length : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">Preferências de notificações</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Page title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2.5">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Notificações</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Escolha quais eventos geram notificações para você
              </p>
            </div>
          </div>
          {prefs !== null && (
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1 shrink-0">
              {enabledCount} de {TOP_LEVEL_PREF_KEYS.length} ativas
            </span>
          )}
        </div>

        <Separator />

        {/* Preferences list */}
        {prefs === null ? (
          <div className="space-y-3">
            {PREF_CONFIG.map((p) => (
              <div
                key={p.key}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card animate-pulse"
              >
                <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 rounded bg-muted" />
                  <div className="h-3 w-64 rounded bg-muted" />
                </div>
                <div className="h-5 w-9 rounded-full bg-muted shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <>
          <div className="space-y-3">
            {PREF_CONFIG.map(({ key, label, description, icon: Icon, iconBg, iconColor }) => (
              <div
                key={key}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card transition-colors hover:bg-muted/30"
              >
                <div className={`rounded-full p-2.5 shrink-0 ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {savedKey === key && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {savingKey === key && (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                  )}
                  <Switch
                    id={key}
                    checked={prefs[key]}
                    onCheckedChange={(v) => handleToggle(key, v)}
                    disabled={savingKey === key}
                  />
                </div>
              </div>
            ))}

            {/* Sub-canais dos lembretes de eventos */}
            {prefs.eventReminder && (
              <div className="ml-4 pl-4 border-l-2 border-amber-200 dark:border-amber-900/60 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
                  Como receber lembretes de eventos
                </p>
                {EVENT_REMINDER_CHANNELS.map(({ key, label, description, icon: Icon, iconBg, iconColor }) => (
                  <div
                    key={key}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card transition-colors hover:bg-muted/30"
                  >
                    <div className={`rounded-full p-2.5 shrink-0 ${iconBg}`}>
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      {key === 'eventReminderBrowser'
                        && typeof window !== 'undefined'
                        && 'Notification' in window
                        && Notification.permission === 'denied'
                        && prefs[key] && (
                          <p className="text-xs text-destructive mt-1">
                            Permissão bloqueada nas configurações do navegador.
                          </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {savedKey === key && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      {savingKey === key && (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                      )}
                      <Switch
                        id={key}
                        checked={prefs[key]}
                        onCheckedChange={(v) => handleToggle(key, v)}
                        disabled={savingKey === key}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Canais de alerta globais — valem para todas as notificações */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Canais de alerta</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Como você é avisado quando chega qualquer notificação (menções, tasks, avisos)
              </p>
            </div>
            {GLOBAL_CHANNELS.map(({ key, label, description, icon: Icon, iconBg, iconColor }) => (
              <div
                key={key}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card transition-colors hover:bg-muted/30"
              >
                <div className={`rounded-full p-2.5 shrink-0 ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  {key === 'notificationBrowser'
                    && typeof window !== 'undefined'
                    && 'Notification' in window
                    && Notification.permission === 'denied'
                    && prefs[key] && (
                      <p className="text-xs text-destructive mt-1">
                        Permissão bloqueada nas configurações do navegador.
                      </p>
                    )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {savedKey === key && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {savingKey === key && (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                  )}
                  <Switch
                    id={key}
                    checked={prefs[key]}
                    onCheckedChange={(v) => handleToggle(key, v)}
                    disabled={savingKey === key}
                  />
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
