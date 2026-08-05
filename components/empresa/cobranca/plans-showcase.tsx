'use client';

import { Check, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCents } from '@/components/superadmin/financeiro/format';
import { CheckoutDialog } from '@/components/empresa/cobranca/checkout-dialog';

interface Prices {
  monthlyCents: number;
  annualCents: number;
  baseCents: number;
  extraSeatCents: number;
  annualSeatCents: number;
  maxSeats: number;
  annualDiscountPercent: number;
}

const FEATURES = [
  'Quadros Kanban ilimitados',
  'Workspaces e projetos sem limite',
  'Cobrança por usuário',
  'Comentários, checklists e anexos',
  'Agenda, notas e rastreamento de tempo',
];

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

/**
 * Vitrine de planos — destaque chamativo mostrado no topo da tela de cobrança
 * quando a empresa ainda não tem um plano pago (trial, somente leitura ou
 * cancelado). Cada card abre o checkout com o método já pré-selecionado.
 */
export function PlansShowcase({
  companyId,
  seats,
  prices,
  status,
  trialEndsAt,
  perfilCompleto,
  onPedirCadastro,
  assentosOcupados = 1,
}: {
  companyId: string;
  seats: number;
  prices: Prices;
  status: string;
  trialEndsAt: string | null;
  /** Repassado ao checkout: sem cadastro completo o Asaas recusa o cliente. */
  perfilCompleto: boolean;
  onPedirCadastro?: () => void;
  /** Piso do seletor de usuários do checkout (quem já está dentro não pode ficar de fora). */
  assentosOcupados?: number;
}) {
  const days = status === 'trial' ? trialDaysLeft(trialEndsAt) : null;
  const monthlyEquivalent = Math.round(prices.annualCents / 12);
  // O que o cliente deixa de gastar em um ano — número em reais, não porcentagem.
  const economiaAnualCents = Math.max(0, prices.monthlyCents * 12 - prices.annualCents);

  const headline =
    status === 'trial'
      ? 'Continue com o TaskDY sem interrupções'
      : 'Reative o acesso da sua empresa';
  const subline =
    status === 'trial'
      ? 'Escolha um plano agora e mantenha tudo funcionando quando o teste acabar.'
      : 'Assine um plano para voltar a criar e editar. Seus dados continuam salvos.';

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative space-y-6">
        <div className="space-y-2">
          {days != null && (
            <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
              <Sparkles className="h-3.5 w-3.5" />
              {days === 0
                ? 'Seu teste termina hoje'
                : `${days} dia${days > 1 ? 's' : ''} de teste restante${days > 1 ? 's' : ''}`}
            </Badge>
          )}
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{headline}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">{subline}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Mensal */}
          <div className="flex flex-col rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">Mensal</p>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold">{formatCents(prices.monthlyCents)}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              No cartão, recorrente. Cancele quando quiser.
            </p>
            <div className="mt-5">
              <CheckoutDialog
                companyId={companyId}
                seats={seats}
                prices={prices}
                initialMethod="monthly"
                perfilCompleto={perfilCompleto}
            onPedirCadastro={onPedirCadastro}
                assentosOcupados={assentosOcupados}
                seatsEditaveis
                trigger={
                  <Button variant="outline" className="w-full">
                    Assinar mensal
                  </Button>
                }
              />
            </div>
          </div>

          {/* Anual (destaque). O desconto é o argumento de venda, então aparece três
              vezes e de formas diferentes: o selo de % no topo, o preço mensal cheio
              riscado ao lado do equivalente com desconto, e o valor em reais que fica
              no bolso — "20% OFF" convence menos que "economize R$ 358 por ano". */}
          <div className="relative flex flex-col rounded-xl border-2 border-emerald-500 bg-card p-5 shadow-lg ring-4 ring-emerald-500/10">
            <Badge className="absolute -top-3 right-4 bg-emerald-600 text-white hover:bg-emerald-600">
              Melhor valor · {prices.annualDiscountPercent}% OFF
            </Badge>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <p className="font-medium">Anual</p>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold">{formatCents(prices.annualCents)}</span>
              <span className="text-sm text-muted-foreground">/ano</span>
            </div>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-xs">
              <span className="text-muted-foreground line-through">
                {formatCents(prices.monthlyCents)}/mês
              </span>
              <span className="font-semibold text-emerald-600">
                {formatCents(monthlyEquivalent)}/mês
              </span>
              <span className="text-muted-foreground">no plano anual</span>
            </p>
            {economiaAnualCents > 0 && (
              <p className="mt-3 rounded-md bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Economize {formatCents(economiaAnualCents)} por ano
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Pix à vista ou cartão em até 12× — mesmo valor nos dois.
            </p>
            <div className="mt-5">
              <CheckoutDialog
                companyId={companyId}
                seats={seats}
                prices={prices}
                initialMethod="annual_pix"
                perfilCompleto={perfilCompleto}
            onPedirCadastro={onPedirCadastro}
                assentosOcupados={assentosOcupados}
                seatsEditaveis
                trigger={<Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">Assinar anual e economizar</Button>}
              />
            </div>
          </div>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">
          Valores para <strong>{seats}</strong> usuário{seats > 1 ? 's' : ''} —{' '}
          {formatCents(prices.baseCents)} (acesso da empresa + 1 usuário) +{' '}
          {formatCents(prices.extraSeatCents)} por usuário adicional. Você escolhe a quantidade no
          próximo passo.
        </p>
      </div>
    </section>
  );
}
