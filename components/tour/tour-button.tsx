'use client';

import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTourStore } from '@/lib/stores/tour-store';

/**
 * Reabre o tutorial guiado.
 *
 * Mora no header dos layouts que montam o `TourProvider` — e só neles. Se estivesse no
 * `SidebarShell`, que também serve o painel do superusuário, o botão acenderia o tour no
 * store sem ninguém para desenhar o overlay.
 *
 * Reabrir é seguro a qualquer momento: `start()` volta ao primeiro passo e as funções de
 * `lib/tour/build.ts` reaproveitam o workspace, o projeto e a task do exemplo em vez de
 * criar cópias.
 */
export function TourButton() {
  const start = useTourStore((s) => s.start);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => start()}
      title="Refazer o tutorial"
      aria-label="Refazer o tutorial"
    >
      <CircleHelp className="h-4 w-4" />
    </Button>
  );
}
