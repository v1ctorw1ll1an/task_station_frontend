'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HomeGreetingProps {
  userName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function HomeGreeting({ userName }: HomeGreetingProps) {
  const firstName = userName.split(' ')[0];
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold">
        {getGreeting()}, {firstName}
      </h1>
      <p className="text-sm text-muted-foreground capitalize">{today}</p>
    </div>
  );
}
