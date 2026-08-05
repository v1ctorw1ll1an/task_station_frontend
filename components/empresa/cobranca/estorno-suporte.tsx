'use client';

import { LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCents, formatDate } from '@/components/superadmin/financeiro/format';
import { linkDeSuporte, type SuporteConfig } from '@/lib/suporte';

/** Prazo de arrependimento (CDC art. 49): 7 dias corridos a partir da compra. */
export const PRAZO_ESTORNO_DIAS = 7;

/**
 * Quantos dias faltam do prazo de arrependimento, a partir da data do pagamento.
 * `null` quando o prazo já passou ou a data não veio.
 */
export function diasRestantesParaEstorno(pagoEm: string | null | undefined): number | null {
  if (!pagoEm) return null;
  const pago = new Date(pagoEm).getTime();
  if (Number.isNaN(pago)) return null;
  const fim = pago + PRAZO_ESTORNO_DIAS * 86_400_000;
  const restam = Math.ceil((fim - Date.now()) / 86_400_000);
  return restam > 0 ? restam : null;
}

/**
 * Caminho de estorno dentro do prazo de arrependimento. Aparece só enquanto o
 * prazo corre, e diz **a data limite** — quem quer desistir precisa saber até
 * quando pode, não descobrir depois que perdeu o direito.
 *
 * O contato é humano de propósito: estorno mexe em dinheiro que já saiu da conta
 * do cliente e depende do meio de pagamento (Pix volta diferente de cartão). Um
 * botão que estornasse sozinho seria irreversível no clique errado.
 */
export function EstornoSuporte({
  companyId,
  cobranca,
  suporte,
}: {
  companyId: string;
  cobranca: { amountCents: number; paidAt: string | null; id: string };
  /** Canal configurado no ambiente, resolvido no servidor. `null` = ainda sem canal. */
  suporte: SuporteConfig | null;
}) {
  const dias = diasRestantesParaEstorno(cobranca.paidAt);
  if (dias == null || !cobranca.paidAt) return null;

  const limite = new Date(new Date(cobranca.paidAt).getTime() + PRAZO_ESTORNO_DIAS * 86_400_000);
  // A mensagem já vai preenchida com o que o atendimento precisa para achar a
  // cobrança — sem isso o primeiro contato vira um vaivém de "qual empresa?".
  const canal = suporte
    ? linkDeSuporte(
        suporte,
        'Pedido de estorno — TaskDY',
        [
          'Olá! Gostaria de solicitar o estorno da minha assinatura do TaskDY.',
          `Empresa: ${companyId}`,
          `Cobrança: ${cobranca.id}`,
          `Valor: ${formatCents(cobranca.amountCents)}`,
          `Pago em: ${formatDate(cobranca.paidAt)}`,
        ].join('\n'),
      )
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <LifeBuoy className="h-4 w-4 shrink-0" />
          Mudou de ideia? Você pode pedir estorno até {formatDate(limite.toISOString())}
        </p>
        <p className="text-xs text-muted-foreground">
          São {PRAZO_ESTORNO_DIAS} dias a partir do pagamento de{' '}
          {formatCents(cobranca.amountCents)} —{' '}
          {dias === 1 ? 'último dia hoje' : `faltam ${dias} dias`}. Nosso time cuida do estorno
          junto ao meio de pagamento.
        </p>
      </div>

      {canal ? (
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <a href={canal.href} target="_blank" rel="noreferrer">
            {canal.rotulo}
          </a>
        </Button>
      ) : (
        // Canal ainda não definido: o botão aparece (para a tela não mudar de forma
        // quando for configurado), mas desabilitado — link quebrado seria pior.
        <Button variant="outline" size="sm" className="shrink-0" disabled title="Canal de suporte ainda não configurado">
          Falar com o suporte
        </Button>
      )}
    </div>
  );
}
