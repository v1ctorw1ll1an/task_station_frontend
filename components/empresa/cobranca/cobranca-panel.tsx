'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, CreditCard, Download, QrCode } from 'lucide-react';
import {
  buySeatsAction,
  cancelPendingSeatChargeAction,
  cancelSubscriptionAction,
  fetchFaturaAtrasoAction,
  fetchSeatHoldersAction,
  fetchSeatPreviewAction,
  reactivateSubscriptionAction,
  reduceSeatsAction,
  trocarCartaoAction,
  updateBillingAddressAction,
  type CheckoutSessionResult,
  type SeatHolder,
  type SeatPreview,
} from '@/actions/empresa/billing.action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CHARGE_STATUS,
  CHARGE_TYPE,
  formatCents,
  formatDate,
  formatDateTime,
  METHOD_LABELS,
  PAYMENT_KIND,
  SUBSCRIPTION_STATUS,
} from '@/components/superadmin/financeiro/format';
import { CheckoutDialog } from '@/components/empresa/cobranca/checkout-dialog';
import { PlansShowcase } from '@/components/empresa/cobranca/plans-showcase';
import { SeatPurchaseDialog } from '@/components/empresa/cobranca/seat-purchase-dialog';
import { JaPagueiButton } from '@/components/empresa/cobranca/ja-paguei-button';
import { EnderecoCobrancaDialog } from '@/components/empresa/cobranca/endereco-cobranca-dialog';
import {
  EstornoSuporte,
  diasRestantesParaEstorno,
} from '@/components/empresa/cobranca/estorno-suporte';
import type { BillingProfileInput } from '@/lib/schemas/billing.schema';
import type { SuporteConfig } from '@/lib/suporte';

interface BillingStatus {
  status: string;
  method: string | null;
  /** Total a que a empresa tem direito: plano + assentos avulsos do anual. */
  purchasedSeats: number;
  planSeats: number;
  addonSeats: number;
  seatsAtNextRenewal: number | null;
  occupiedSeats: number;
  availableSeats: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Até quando o cartão recusado pode ser resolvido sem perder o acesso (R22). */
  graceUntil: string | null;
  /** Assinaturas de usuários adicionais do anual — cada uma com renovação própria. */
  seatAddons: {
    id: string;
    seats: number;
    status: string;
    amountCents: number;
    paymentKind: string;
    currentPeriodEnd: string | null;
  }[];
  /** Mexer em usuários só existe no mensal-cartão. */
  canChangeSeats: boolean;
  prices: {
    monthlyCents: number;
    annualCents: number;
    /** Base que já inclui 1 assento + acesso da empresa (R8/R11). */
    baseCents: number;
    /** Preço de cada assento além do primeiro. */
    extraSeatCents: number;
    /** Preço de um usuário adicional no anual, por ano. */
    annualSeatCents: number;
    /** Teto do campo de quantidade — definido pelo backend, não pela tela. */
    maxSeats: number;
    /** Desconto do anual em % inteiro. Vem do backend para a tela não anunciar outro número. */
    annualDiscountPercent: number;
  };
  pendingPix: { payload: string; encodedImage: string; expiresAt: string; amountCents: number } | null;
  /**
   * Cobrança aguardando confirmação, de qualquer forma de pagamento. É o que
   * permite oferecer o "Já paguei" também para o cartão, que não tem QR.
   */
  pendingCharge: {
    id: string;
    paymentKind: string;
    amountCents: number;
    installments: number;
    invoiceUrl: string | null;
    /** Checkout ainda válido — o "continuar pagamento" de quem saiu no meio. */
    checkoutUrl: string | null;
    checkoutExpiresAt: string | null;
    createdAt: string;
  } | null;
  /** Dados fiscais da empresa — razão social e documento, o que sai na nota. */
  company: { legalName: string; taxId: string };
  /** Dados de cobrança já informados. `null` enquanto ninguém preencheu. */
  billingAddress: BillingProfileInput | null;
  /** Se dá para mandar o cliente pagar: o Asaas exibe este cadastro na página dele. */
  profileComplete: boolean;
}

interface Charge {
  id: string;
  type: string;
  paymentKind: string;
  status: string;
  amountCents: number;
  installments: number;
  invoiceUrl: string | null;
  createdAt: string;
  /** Quando o dinheiro entrou — é dela que corre o prazo de arrependimento. */
  paidAt: string | null;
}

export function CobrancaPanel({
  companyId,
  status,
  charges,
  variant = 'full',
  suporte = null,
}: {
  companyId: string;
  status: BillingStatus;
  charges: Charge[];
  /**
   * Canal de suporte configurado no ambiente. Resolvido no servidor e descido como
   * prop — ler do ambiente aqui não funcionaria (este arquivo roda no browser).
   */
  suporte?: SuporteConfig | null;
  /**
   * 'full' = página de cobrança completa. 'paywall' = tela de bloqueio: só planos
   * + Pix pendente (sem status de plano/assentos); histórico só se houver cobranças.
   */
  variant?: 'full' | 'paywall';
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [seatQty, setSeatQty] = useState('1');
  const [openSeat, setOpenSeat] = useState<null | 'buy' | 'reduce'>(null);
  /** Abre o cadastro de cobrança quando um fluxo de pagamento esbarra nele. */
  const [openCadastro, setOpenCadastro] = useState(false);

  const st = SUBSCRIPTION_STATUS[status.status] ?? { label: status.status, variant: 'outline' as const };
  const isActive = status.status === 'active';
  const isPastDue = status.status === 'past_due';
  const needsSubscription = ['trial', 'readonly', 'canceled', 'courtesy'].includes(status.status);
  // Empresa sem plano pago vigente → mostra a vitrine chamativa no topo.
  // Cortesia (isenta pelo superadmin) mantém só o botão discreto de assinar.
  const showPlans = ['trial', 'readonly', 'canceled'].includes(status.status);
  // Na tela de bloqueio (paywall) só interessam planos + Pix pendente; status de
  // plano/assentos saem, e o histórico aparece apenas quando há cobranças.
  const full = variant !== 'paywall';
  const showHistory = full || charges.length > 0;
  // O anual no cartão não renova sozinho (é compra única parcelada): a partir de D-30
  // o botão de renovar aparece, para contratar o próximo ano sem deixar vencer (R47).
  // O anual no Pix virou assinatura e renova sozinho — mas manter o botão não atrapalha.
  const anual = status.method === 'annual_pix' || status.method === 'annual_card';
  // Lido uma vez na montagem: "agora" no corpo do render é impuro, e um dia a mais ou
  // a menos na contagem não muda nada — o que importa é a janela de 30 dias.
  const [diasParaRenovar] = useState(() =>
    status.currentPeriodEnd
      ? Math.ceil((new Date(status.currentPeriodEnd).getTime() - Date.now()) / 86_400_000)
      : null,
  );
  const podeRenovar =
    isActive && anual && !status.cancelAtPeriodEnd && diasParaRenovar != null && diasParaRenovar <= 30;
  // Trocar o cartão só faz sentido onde existe recorrência — e é o conserto da carência.
  const podeTrocarCartao = status.method === 'monthly_card' && (isActive || isPastDue);
  // `purchasedSeats` é o nome do campo, não a verdade da tela: o trial nasce com os
  // lugares do teste sem ninguém ter comprado nada, e chamar isso de "comprado" faz o
  // cliente achar que já está pagando. `method === null` cobre quem saiu do trial sem
  // nunca pagar — mesmo sinal que o backend usa para distinguir 'trial_ended' de
  // 'subscription_expired'. No trial com Pix em aberto o método já está preenchido,
  // mas ainda não houve pagamento — por isso o status vem antes na condição.
  const assentosIncluidos =
    status.status === 'trial' || status.status === 'courtesy' || status.method === null;
  // Por quantos usuários cotar uma assinatura NOVA. Sem plano pago, `purchasedSeats`
  // são as vagas do teste (hoje 6) — cotar por elas mostraria a uma empresa de duas
  // pessoas o preço de seis, ancorando a venda num tamanho que ela não pediu. O ponto
  // de partida passa a ser quem já está dentro; subir é um clique, e o piso do
  // seletor continua sendo `occupiedSeats`, então ninguém contrata menos do que tem.
  const seatsParaCotar = assentosIncluidos
    ? Math.max(1, status.occupiedSeats)
    : status.planSeats;
  // Devolver usuário exige plano MENSAL pago vigente e mais de um assento no plano.
  // No anual os usuários extras são assinaturas próprias com um ano pago — reduzir ali
  // seria estornar, e a regra é não estornar. `canChangeSeats` vem do backend para a
  // tela e a API concordarem sobre onde a operação existe.
  const podeReduzirAssentos = isActive && status.canChangeSeats && status.planSeats > 1;
  // Pagamento mais recente ainda dentro do prazo de arrependimento. `charges` já vem
  // do mais novo para o mais antigo, então o primeiro que casar é o que vale.
  const cobrancaEstornavel = charges.find(
    (c) => c.status === 'paid' && diasRestantesParaEstorno(c.paidAt) != null,
  );

  function run(fn: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (r.error) setError(r.error);
      else {
        setOpenSeat(null);
        setOpenCadastro(false);
        router.refresh();
      }
    });
  }

  /**
   * Operações que terminam numa página do Asaas. Quando volta um link, saímos do app —
   * é o fluxo, não um erro. Sem link (Pix, ou nada a cobrar), recarrega a tela.
   */
  function irParaCheckout(fn: () => Promise<CheckoutSessionResult>) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (r.error) {
        setError(r.error);
        return;
      }
      if (r.checkoutUrl) {
        window.location.assign(r.checkoutUrl);
        return;
      }
      setOpenSeat(null);
      router.refresh();
    });
  }

  /** "Pagar fatura em atraso": busca o link e leva à página da cobrança no Asaas. */
  function abrirFaturaEmAtraso() {
    setError(null);
    start(async () => {
      const r = await fetchFaturaAtrasoAction(companyId);
      if (r.invoiceUrl) window.open(r.invoiceUrl, '_blank', 'noopener,noreferrer');
      else setError(r.error ?? 'Nenhuma fatura em atraso encontrada');
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Carência do cartão recusado: é o único aviso que o cliente recebe antes de
          perder o acesso, e traz o conserto junto — não só a má notícia. */}
      {isPastDue && (
        <div className="space-y-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Não conseguimos cobrar seu cartão
          </p>
          <p className="text-xs text-muted-foreground">
            O acesso continua normal
            {status.graceUntil ? ` até ${formatDate(status.graceUntil)}` : ' por alguns dias'}.
            São duas coisas diferentes: <strong>pagar o que ficou para trás</strong> e{' '}
            <strong>trocar o cartão</strong> das próximas cobranças.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending} onClick={abrirFaturaEmAtraso}>
              Pagar fatura em atraso
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => irParaCheckout(() => trocarCartaoAction(companyId))}
            >
              <CreditCard className="mr-1 h-4 w-4" />
              Trocar cartão
            </Button>
          </div>
        </div>
      )}

      {/* Vitrine de planos (chamativa) — só quando não há plano pago vigente */}
      {showPlans && (
        <PlansShowcase
          companyId={companyId}
          seats={seatsParaCotar}
          prices={status.prices}
          status={status.status}
          trialEndsAt={status.trialEndsAt}
          perfilCompleto={status.profileComplete}
          onPedirCadastro={() => setOpenCadastro(true)}
          assentosOcupados={status.occupiedSeats}
        />
      )}

      {/* Status da assinatura (oculto no paywall) */}
      {full && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Plano</CardTitle>
          <Badge variant={st.variant}>{st.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="Método" value={status.method ? METHOD_LABELS[status.method] ?? status.method : '—'} />
            {/* Só o preço da cadência contratada: mostrar "mensal" num plano anual
                (ainda mais no Pix, que é à vista) confunde quem já pagou o ano. */}
            {status.method === 'monthly_card' && (
              <Field label="Valor mensal" value={`${formatCents(status.prices.monthlyCents)}/mês`} />
            )}
            {status.method === 'annual_pix' && (
              <Field
                label="Valor anual (Pix)"
                value={`${formatCents(status.prices.annualCents)}/ano`}
              />
            )}
            {status.method === 'annual_card' && (
              <Field
                label="Valor anual (cartão)"
                value={`${formatCents(status.prices.annualCents)}/ano`}
              />
            )}
            {!status.method && (
              <>
                <Field label="Mensal" value={formatCents(status.prices.monthlyCents)} />
                <Field label="Anual" value={formatCents(status.prices.annualCents)} />
              </>
            )}
            {/* A contagem de usuários não é repetida aqui: ela tem seção própria
                logo abaixo, no mesmo bloco. */}
            <Field
              label={status.status === 'trial' ? 'Fim do teste' : 'Renovação'}
              value={formatDate(status.status === 'trial' ? status.trialEndsAt : status.currentPeriodEnd)}
            />
            {status.cancelAtPeriodEnd && (
              <Field label="Aviso" value="Cancela no fim do ciclo" />
            )}
          </div>

          {/* Duas pontas: à esquerda o que mantém ou muda o plano, à direita a saída.
              Cancelar no meio dos botões de assinar é convite a clique errado. */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-start gap-2">
              <ExportarDadosButton companyId={companyId} />
              {needsSubscription && !showPlans && (
                <CheckoutDialog
                  companyId={companyId}
                  seats={seatsParaCotar}
                  prices={status.prices}
                  perfilCompleto={status.profileComplete}
                  onPedirCadastro={() => setOpenCadastro(true)}
                  assentosOcupados={status.occupiedSeats}
                  seatsEditaveis
                />
              )}
              {/* Renovar sem deixar vencer: o anual não renova sozinho, e antes disto o
                  cliente só conseguia pagar de novo DEPOIS de perder o acesso. */}
              {podeRenovar && (
                <CheckoutDialog
                  companyId={companyId}
                  seats={status.purchasedSeats}
                  prices={status.prices}
                  initialMethod={status.method === 'annual_card' ? 'annual_card' : 'annual_pix'}
                  proximoCicloEm={status.currentPeriodEnd}
                  perfilCompleto={status.profileComplete}
                  onPedirCadastro={() => setOpenCadastro(true)}
                  titulo="Renovar o plano"
                  trigger={
                    <Button size="sm">
                      Renovar agora
                      {diasParaRenovar != null && diasParaRenovar >= 0
                        ? ` (vence em ${diasParaRenovar} dia${diasParaRenovar === 1 ? '' : 's'})`
                        : ''}
                    </Button>
                  }
                />
              )}
              {isActive && !status.cancelAtPeriodEnd && (
                <CheckoutDialog
                  companyId={companyId}
                  seats={status.purchasedSeats}
                  prices={status.prices}
                  initialMethod={status.method === 'monthly_card' ? 'annual_pix' : 'monthly'}
                  proximoCicloEm={status.currentPeriodEnd}
                  perfilCompleto={status.profileComplete}
                  onPedirCadastro={() => setOpenCadastro(true)}
                  titulo="Trocar de plano"
                  trigger={
                    <Button variant="outline" size="sm">
                      Trocar de plano
                    </Button>
                  }
                />
              )}
              {/* O cartão vive no Asaas: trocá-lo é abrir um checkout novo, que recria
                  a recorrência cobrando só a partir do fim do ciclo já pago. */}
              {podeTrocarCartao && !isPastDue && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    if (!status.profileComplete) return setOpenCadastro(true);
                    irParaCheckout(() => trocarCartaoAction(companyId));
                  }}
                >
                  <CreditCard className="mr-1 h-4 w-4" />
                  Trocar cartão
                </Button>
              )}
              {/* Aparece sempre. Sem endereço salvo vira "Complete seu cadastro" —
                  preencher antes deixa o checkout mais curto e é o que sai na nota.
                  Diferente do "Atualizar cartão", não depende de plano mensal: o
                  endereço é nosso, o cartão é do provedor. */}
              <EnderecoCobrancaDialog
                companyId={companyId}
                enderecoSalvo={status.billingAddress}
                empresa={status.company}
                pending={pending}
                open={openCadastro}
                onOpenChange={setOpenCadastro}
                onConfirm={(dados) => run(() => updateBillingAddressAction(companyId, dados))}
              />
            </div>

            {/* Saídas: separadas do resto por `justify-between`. */}
            <div className="flex flex-wrap items-start gap-2">
              {isActive && !status.cancelAtPeriodEnd && (
                <ConfirmButton
                  label="Cancelar assinatura"
                  variant="outline"
                  title="Cancelar assinatura?"
                  /* A data exata, não "o fim do ciclo": quem clica em cancelar quer
                     saber se perde o acesso agora. Não perde — o cancelamento só
                     agenda (`cancelAtPeriodEnd`), e o gate de cobrança nem olha essa
                     flag; a empresa só vira `canceled` quando o ciclo pago termina. */
                  description={
                    status.currentPeriodEnd
                      ? `Você continua com acesso normal até ${formatDate(status.currentPeriodEnd)} — o período que já está pago. A partir daí a empresa perde o acesso ao app, e os dados ficam preservados. Dá para reativar a qualquer momento antes dessa data.`
                      : 'O acesso continua até o fim do ciclo pago. Depois, a empresa perde o acesso ao app (os dados ficam preservados).'
                  }
                  disabled={pending}
                  onConfirm={() => run(() => cancelSubscriptionAction(companyId))}
                />
              )}
              {isActive &&
                status.cancelAtPeriodEnd &&
                (status.method === 'monthly_card' ? (
                  // A recorrência foi encerrada no Asaas ao cancelar e o cartão mora lá:
                  // reativar é informá-lo de novo, na página segura do provedor.
                  <ConfirmButton
                    label="Reativar assinatura"
                    variant="outline"
                    title="Reativar assinatura?"
                    description="Você será levado para a página segura do Asaas para informar o cartão. A cobrança só volta a acontecer no fim do período já pago."
                    disabled={pending}
                    onConfirm={() => {
                      if (!status.profileComplete) return setOpenCadastro(true);
                      irParaCheckout(() => reactivateSubscriptionAction(companyId));
                    }}
                  />
                ) : (
                  <ConfirmButton
                    label="Reativar assinatura"
                    variant="outline"
                    title="Reativar assinatura?"
                    description="Desfaz o cancelamento agendado — a assinatura continua normalmente na próxima renovação."
                    disabled={pending}
                    onConfirm={() => irParaCheckout(() => reactivateSubscriptionAction(companyId))}
                  />
                ))}
            </div>
          </div>

          <Separator />

          {/* Usuários no mesmo bloco do plano: eram dois cards separados, e responder
              "cabe mais alguém?" exigia descer a tela para longe do plano que paga
              por eles. São a mesma decisão. */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Usuários</h3>
              <span className="text-xs text-muted-foreground">
                {status.occupiedSeats} de {status.purchasedSeats} em uso
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <Field
                label={assentosIncluidos ? 'Incluídos' : 'Contratados'}
                value={String(status.purchasedSeats)}
                nota={
                  status.addonSeats > 0
                    ? `${status.planSeats} no plano + ${status.addonSeats} avulso(s)`
                    : undefined
                }
              />
              <Field label="Em uso" value={String(status.occupiedSeats)} />
              <Field label="Disponíveis" value={String(status.availableSeats)} />
            </div>

            {status.status === 'trial' && (
              <p className="text-xs text-muted-foreground">
                O teste inclui {status.purchasedSeats} usuário
                {status.purchasedSeats > 1 ? 's' : ''} — você ainda não contratou nenhum. Assine
                um plano para adicionar mais pessoas.
              </p>
            )}
            {status.seatsAtNextRenewal != null && (
              <p className="text-xs text-muted-foreground">
                Redução agendada: {status.seatsAtNextRenewal} usuário(s) na próxima renovação.
              </p>
            )}
            {/* No anual, cada compra de usuários é uma assinatura com data própria —
                a tela precisa mostrar essas datas, senão a renovação vira surpresa. */}
            {status.seatAddons.length > 0 && (
              <div className="space-y-1.5 rounded-md bg-muted/60 px-3 py-2 text-xs">
                <p className="font-medium text-foreground">Usuários adicionais (anual)</p>
                {status.seatAddons.map((a) => (
                  <p key={a.id} className="text-muted-foreground">
                    {a.seats} usuário{a.seats > 1 ? 's' : ''} · {formatCents(a.amountCents)}/ano ·{' '}
                    {a.status === 'pending'
                      ? 'aguardando pagamento'
                      : a.status === 'past_due'
                        ? `renovação em atraso (venceu ${formatDate(a.currentPeriodEnd)})`
                        : `renova em ${formatDate(a.currentPeriodEnd)}`}
                  </p>
                ))}
                <p className="text-muted-foreground">
                  Renovam sozinhos, em data própria. Para encerrar um deles, fale com o suporte.
                </p>
              </div>
            )}
            {isActive && (
              <div className="flex flex-wrap gap-2">
                <SeatPurchaseDialog
                  companyId={companyId}
                  open={openSeat === 'buy'}
                  onOpenChange={(o) => setOpenSeat(o ? 'buy' : null)}
                  pending={pending}
                  perfilCompleto={status.profileComplete}
                  onPedirCadastro={() => setOpenCadastro(true)}
                  onConfirm={(compra) =>
                    irParaCheckout(() =>
                      buySeatsAction(companyId, compra.quantity, compra.paymentKind),
                    )
                  }
                  onCancelPending={() => run(() => cancelPendingSeatChargeAction(companyId))}
                />
                {podeReduzirAssentos && (
                  <SeatReduceDialog
                    open={openSeat === 'reduce'}
                    onOpenChange={(o) => setOpenSeat(o ? 'reduce' : null)}
                    qty={seatQty}
                    setQty={setSeatQty}
                    pending={pending}
                    companyId={companyId}
                    occupiedSeats={status.occupiedSeats}
                    purchasedSeats={status.planSeats}
                    onConfirm={(userIds) =>
                      run(() => reduceSeatsAction(companyId, Number(seatQty), userIds))
                    }
                  />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Pix pendente */}
      {status.pendingPix && (
        <Card id="pix-pendente" className="scroll-mt-4 ring-2 ring-primary/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4" /> Pix aguardando pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${status.pendingPix.encodedImage}`}
              alt="QR Code Pix"
              className="w-40 h-40 border rounded-md bg-white p-1"
            />
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground">
                Valor: <strong>{formatCents(status.pendingPix.amountCents)}</strong> · expira{' '}
                {formatDateTime(status.pendingPix.expiresAt)}
              </p>
              <Label className="text-xs">Copia e cola</Label>
              <div className="flex gap-2">
                <Input readOnly value={status.pendingPix.payload} className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(status.pendingPix!.payload)}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Assim que o pagamento for confirmado, o plano é ativado automaticamente.
              </p>
              <JaPagueiButton companyId={companyId} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cartão (ou boleto) aguardando confirmação: sem QR não havia nada na tela
          dizendo "estamos esperando" — o cliente pagava e ficava sem sinal nenhum. */}
      {!status.pendingPix && status.pendingCharge && (
        <Card className="ring-2 ring-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pagamento aguardando confirmação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatCents(status.pendingCharge.amountCents)}
              {status.pendingCharge.installments > 1
                ? ` em ${status.pendingCharge.installments}×`
                : ''}{' '}
              · {PAYMENT_KIND[status.pendingCharge.paymentKind] ?? status.pendingCharge.paymentKind}{' '}
              · enviado em {formatDateTime(status.pendingCharge.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {status.pendingCharge.checkoutUrl
                ? 'Você começou o pagamento e ainda não concluiu. Continue de onde parou — abrir uma cobrança nova geraria uma segunda cobrança do mesmo pedido.'
                : 'A confirmação costuma levar alguns minutos. Assim que cair, o plano é ativado automaticamente — você não precisa fazer nada.'}
            </p>
            <div className="flex flex-wrap items-start gap-2">
              {/* Checkout ainda válido tem precedência: retomar o mesmo link é o que
                  garante uma cobrança só (o backend reaproveita, não recria). */}
              {status.pendingCharge.checkoutUrl && (
                <Button size="sm" asChild>
                  <a href={status.pendingCharge.checkoutUrl}>
                    <CreditCard className="mr-1 h-4 w-4" />
                    Continuar pagamento
                  </a>
                </Button>
              )}
              <JaPagueiButton companyId={companyId} />
              {!status.pendingCharge.checkoutUrl && status.pendingCharge.invoiceUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={status.pendingCharge.invoiceUrl} target="_blank" rel="noreferrer">
                    Ver cobrança
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arrependimento (CDC art. 49): só enquanto o prazo corre. Fica logo acima do
          histórico, colado no pagamento a que se refere. */}
      {cobrancaEstornavel && (
        <EstornoSuporte
          companyId={companyId}
          cobranca={cobrancaEstornavel}
          suporte={suporte}
        />
      )}

      {/* Histórico (no paywall só aparece se houver cobranças) */}
      {showHistory && (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Fatura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                      Nenhuma cobrança ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  charges.map((c) => {
                    const cs = CHARGE_STATUS[c.status] ?? { label: c.status, variant: 'outline' as const };
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(c.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">{CHARGE_TYPE[c.type] ?? c.type}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {PAYMENT_KIND[c.paymentKind] ?? c.paymentKind}
                          {c.installments > 1 ? ` ${c.installments}×` : ''}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cs.variant}>{cs.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCents(c.amountCents)}</TableCell>
                        <TableCell className="text-right">
                          {c.invoiceUrl ? (
                            <a
                              href={c.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Abrir
                            </a>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

function Field({ label, value, nota }: { label: string; value: string; nota?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
      {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
    </div>
  );
}

/**
 * Saída dos dados da empresa. Fica sempre visível — inclusive com a assinatura
 * vencida —, porque a cobrança suspende o serviço, não o direito do cliente aos
 * dados dele.
 */
function ExportarDadosButton({ companyId }: { companyId: string }) {
  const base = `/api/files/billing/empresa/${companyId}/exportar`;
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" asChild>
        <a href={`${base}?formato=json`}>
          <Download className="h-4 w-4 mr-1" />
          Exporte seus dados (JSON)
        </a>
      </Button>
      {/* O rótulo curto só funciona colado no botão de cima; o aria-label é que
          carrega a frase inteira para quem navega por leitor de tela. */}
      <Button variant="ghost" size="sm" asChild>
        <a href={`${base}?formato=csv`} aria-label="Exporte seus dados em CSV">
          (CSV)
        </a>
      </Button>
    </div>
  );
}

/**
 * O que a redução faz — e, sobretudo, o que ela **não** faz: nada é estornado, o
 * valor só cai na renovação. Reduzir no meio do ciclo já pago não devolve dinheiro
 * (R19), e é melhor o admin ler isso antes de confirmar do que descobrir depois.
 */
function ResumoDaReducao({ companyId, quantity }: { companyId: string; quantity: number }) {
  const [preview, setPreview] = useState<SeatPreview | null>(null);

  useEffect(() => {
    let ativo = true;
    if (quantity < 1) return;
    const t = setTimeout(() => {
      void fetchSeatPreviewAction(companyId, quantity, 'reduzir').then((p) => {
        if (ativo) setPreview(p);
      });
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [companyId, quantity]);

  if (!preview || quantity < 1) return null;

  const porPeriodo = preview.cadencia === 'anual' ? '/ano' : '/mês';
  const vigencia = preview.vigenciaEm ? formatDate(preview.vigenciaEm) : 'a renovação';

  return (
    <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-muted-foreground">Usuários</span>
        <span className="text-right font-medium">
          {preview.seatsAtuais} → {preview.seatsDepois}
          <span className="block text-xs font-normal text-muted-foreground">
            {preview.occupiedSeats} de {preview.seatsDepois} em uso
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between border-t pt-2">
        <span className="text-muted-foreground">A partir de {vigencia}</span>
        <span className="font-medium">
          <span className="mr-2 text-muted-foreground line-through">
            {formatCents(preview.valorHojeCents)}
          </span>
          {formatCents(preview.valorDepoisCents)}
          {porPeriodo}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Nada é cobrado nem estornado agora: o ciclo atual já está pago e segue valendo até{' '}
        {vigencia}.
      </p>

      {preview.precisaLiberar > 0 && (
        <p className="text-xs text-destructive">
          {preview.precisaLiberar} pessoa(s) precisam sair para caber no novo total.
        </p>
      )}
    </div>
  );
}

/**
 * Escolha de quem devolve o assento. Só aparece quando a redução mexe em assentos
 * ocupados — devolver assento vago não tira ninguém. Quem for marcado continua
 * trabalhando até o fim do ciclo já pago (R19).
 */
function SeatHolderPicker({
  companyId,
  quantity,
  selected,
  setSelected,
}: {
  companyId: string;
  quantity: number;
  selected: string[];
  setSelected: (v: string[]) => void;
}) {
  const [holders, setHolders] = useState<SeatHolder[] | null>(null);

  useEffect(() => {
    let ativo = true;
    void fetchSeatHoldersAction(companyId).then((h) => {
      if (ativo) setHolders(h);
    });
    return () => {
      ativo = false;
    };
  }, [companyId]);

  if (!holders) return <p className="text-xs text-muted-foreground">Carregando membros…</p>;

  const admins = holders.filter((h) => h.role === 'admin').length;
  function toggle(userId: string, isAdmin: boolean) {
    if (selected.includes(userId)) {
      setSelected(selected.filter((id) => id !== userId));
      return;
    }
    if (isAdmin && admins <= 1) return; // a empresa precisa de um admin
    if (selected.length >= quantity) return;
    setSelected([...selected, userId]);
  }

  return (
    <div className="space-y-2">
      <Label>Quem sai na próxima renovação</Label>
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
        {holders.map((h) => {
          const isAdmin = h.role === 'admin';
          const travado = isAdmin && admins <= 1;
          const marcado = selected.includes(h.userId);
          return (
            <label
              key={h.userId}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                travado ? 'opacity-50' : 'cursor-pointer hover:bg-muted'
              }`}
            >
              <input
                type="checkbox"
                checked={marcado}
                disabled={travado}
                onChange={() => toggle(h.userId, isAdmin)}
              />
              <span className="min-w-0 flex-1 truncate">
                {h.user.name}
                <span className="ml-1 text-xs text-muted-foreground">{h.user.email}</span>
              </span>
              {isAdmin && <span className="text-xs text-muted-foreground">admin</span>}
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {selected.length} de {quantity} selecionado(s). Quem sair mantém o acesso até a renovação —
        a empresa já pagou por este ciclo.
      </p>
    </div>
  );
}

function SeatReduceDialog({
  open,
  onOpenChange,
  qty,
  setQty,
  pending,
  companyId,
  occupiedSeats,
  purchasedSeats,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  qty: string;
  setQty: (v: string) => void;
  pending: boolean;
  companyId: string;
  /** Assentos ocupados hoje — define se a redução precisa escolher quem sai. */
  occupiedSeats: number;
  purchasedSeats: number;
  onConfirm: (userIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const quantidade = Number(qty) || 0;
  // A empresa nunca fica sem assento (R11), então dá para devolver no máximo
  // `purchasedSeats - 1`. Sem este teto o admin digitava um número maior e só
  // descobria pelo erro do backend, depois de escolher quem sai.
  const maxDevolver = Math.max(1, purchasedSeats - 1);
  const quantidadeValida = quantidade >= 1 && quantidade <= maxDevolver;
  // Sobrando gente para os assentos restantes, o admin precisa dizer quem sai.
  const precisaEscolher = quantidadeValida && purchasedSeats - quantidade < occupiedSeats;
  const faltamEscolher = precisaEscolher
    ? occupiedSeats - selected.length - (purchasedSeats - quantidade)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          Reduzir usuários
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reduzir usuários</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="qty">Quantos usuários devolver</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              max={maxDevolver}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <p className={`text-xs ${quantidadeValida ? 'text-muted-foreground' : 'text-destructive'}`}>
              {quantidadeValida
                ? `Você tem ${purchasedSeats} usuários e pode devolver até ${maxDevolver} — a empresa fica com pelo menos 1.`
                : `Escolha entre 1 e ${maxDevolver} usuários: a empresa precisa ficar com pelo menos 1.`}
            </p>
          </div>
          {quantidadeValida && <ResumoDaReducao companyId={companyId} quantity={quantidade} />}
          {precisaEscolher && (
            <SeatHolderPicker
              companyId={companyId}
              quantity={quantidade}
              selected={selected}
              setSelected={setSelected}
            />
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !quantidadeValida || faltamEscolher > 0}
            onClick={() => onConfirm(selected)}
          >
            {faltamEscolher > 0 ? `Selecione mais ${faltamEscolher}` : 'Agendar redução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmButton({
  label,
  title,
  description,
  variant,
  disabled,
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  variant: 'outline' | 'destructive';
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" disabled={disabled}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
