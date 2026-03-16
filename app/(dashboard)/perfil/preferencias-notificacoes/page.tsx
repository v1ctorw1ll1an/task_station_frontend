'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

const PREF_LABELS: { key: keyof Preferences; label: string; description: string }[] = [
  { key: 'adminBroadcast', label: 'Avisos do administrador', description: 'Mensagens enviadas por admins ou pelo superadmin' },
  { key: 'mention', label: 'Menções em comentários', description: 'Quando alguém te menciona com @nome em um comentário' },
  { key: 'taskAssigned', label: 'Atribuição de task', description: 'Quando você é atribuído a uma task' },
  { key: 'taskComment', label: 'Comentários em tasks', description: 'Novos comentários em tasks que você participa' },
  { key: 'taskUpdated', label: 'Atualizações de task', description: 'Mudanças importantes em tasks que você participa' },
];

export default function PreferenciasNotificacoesPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPreferencesAction().then((data) => {
      if (data) setPrefs(data as Preferences);
    });
  }, []);

  async function handleToggle(key: keyof Preferences, value: boolean) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    await updatePreferencesAction({ [key]: value });
    setSaving(false);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Preferências de notificações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha quais notificações você deseja receber.
          {saving && <span className="ml-2 text-xs">Salvando...</span>}
        </p>
      </div>
      <Separator />
      {prefs === null ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {PREF_LABELS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <Switch
                id={key}
                checked={prefs[key]}
                onCheckedChange={(v) => handleToggle(key, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
