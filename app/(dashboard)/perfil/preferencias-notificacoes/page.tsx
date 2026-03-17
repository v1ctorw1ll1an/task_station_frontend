'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AtSign, Bell, CheckCircle2, Megaphone, MessageSquare, Pencil, UserCheck } from 'lucide-react';
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
];

const PREF_KEYS = PREF_CONFIG.map((p) => p.key);

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
    await updatePreferencesAction({ [key]: value });
    setSavingKey(null);
    setSavedKey(key);
    setTimeout(() => setSavedKey((prev) => (prev === key ? null : prev)), 2000);
  }

  // Conta apenas as 5 chaves definidas
  const enabledCount = prefs ? PREF_KEYS.filter((k) => prefs[k]).length : 0;

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
              {enabledCount} de {PREF_KEYS.length} ativas
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
          </div>
        )}
      </div>
    </div>
  );
}
