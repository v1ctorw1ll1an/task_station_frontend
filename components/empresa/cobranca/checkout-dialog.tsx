'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import {
  fetchCheckoutPreviewAction,
  subscribeAnnualCardAction,
  subscribeAnnualPixAction,
  subscribeMonthlyAction,
  type CheckoutPreview,
} from '@/actions/empresa/billing.action';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCents } from '@/components/superadmin/financeiro/format';

type Method = 'monthly' | 'annual_pix' | 'annual_card';

interface Prices {
  monthlyCents: number;
  annualCents: number;
  /** Base que já inclui 1 assento + acesso da empresa (R8/R11). */
  baseCents: number;
  /** Preço de cada assento além do primeiro. */
  extraSeatCents: number;
  /** Teto de sanidade do campo de quantidade — vem do backend, não do palpite da tela. */
  maxSeats: number;
  /** Preço de um usuário adicional no anual, por ano. */
  annualSeatCents: number;
  /** Desconto do anual em % inteiro — anunciado, nunca chutado pela tela. */
  annualDiscountPercent: number;
}

// Rola até o card de Pix. Como o card só entra no DOM após o router.refresh()
// (re-render do servidor), tenta por alguns segundos até encontrá-lo.
function scrollToPix(tries = 0) {
  const el = document.getElementById('pix-pendente');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (tries < 25) setTimeout(() => scrollToPix(tries + 1), 120);
}

export function CheckoutDialog({
  companyId,
  seats,
  prices,
  initialMethod = 'monthly',
  trigger,
  proximoCicloEm,
  titulo,
  perfilCompleto,
  onPedirCadastro,
  assentosOcupados = 1,
  seatsEditaveis = false,
}: {
  companyId: string;
  seats: number;
  prices: Prices;
  initialMethod?: Method;
  trigger?: React.ReactNode;
  /**
   * Se os dados de cobrança já estão completos. Sem eles o Asaas recusa o cliente na
   * própria página de pagamento, então o botão abre o cadastro em vez de tentar.
   */
  perfilCompleto: boolean;
  /** Chamado quando falta cadastro — a tela abre o diálogo de dados de cobrança. */
  onPedirCadastro?: () => void;
  /**
   * Quantos assentos já estão ocupados. Piso do seletor: contratar menos do que a
   * empresa tem de gente faria o plano nascer estourado (e o backend recusa).
   */
  assentosOcupados?: number;
  /**
   * Deixa escolher a quantidade de assentos. Só na contratação (trial, expirado,
   * cancelado) — com plano vigente, assento se compra pela tela de usuários (cobrança
   * própria), então aqui a quantidade fica travada no que já foi contratado.
   */
  seatsEditaveis?: boolean;
  /**
   * Data em que o plano contratado passa a valer, quando já existe ciclo pago em
   * aberto (renovar antes de vencer ou trocar de plano — R47). Sem isto o usuário
   * acharia que está pagando duas vezes o mesmo período.
   */
  proximoCicloEm?: string | null;
  titulo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>(initialMethod);
  const [installments, setInstallments] = useState('1');
  const [qtd, setQtd] = useState(String(seats));
  // Mensal e anual à vista sempre (é o que permite comparar antes de escolher);
  // o anual parcelado só quando selecionado, porque depende do nº de parcelas.
  const [precos, setPrecos] = useState<{
    monthly: CheckoutPreview | null;
    annual: CheckoutPreview | null;
    selecionado: CheckoutPreview | null;
  }>({ monthly: null, annual: null, selecionado: null });

  const minSeats = Math.max(1, assentosOcupados);
  const assentos = Number(qtd);
  const qtdValida =
    Number.isInteger(assentos) && assentos >= minSeats && assentos <= prices.maxSeats;

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o) {
      setMethod(initialMethod);
      setError(null);
      // Reabrir com a quantidade que o servidor conhece: um número abandonado numa
      // tentativa anterior não pode virar o valor cobrado no clique seguinte.
      setQtd(String(seats));
    }
  }

  // Os totais vêm do backend — a tela mostra a conta aberta (base + adicionais),
  // mas quem soma é o mesmo módulo que cobra. Reimplementar a fórmula aqui faria
  // desconto anual, juros e arredondamento divergirem do valor cobrado.
  useEffect(() => {
    if (!open || !qtdValida) return;
    let ativo = true;
    const t = setTimeout(() => {
      void Promise.all([
        fetchCheckoutPreviewAction(companyId, assentos, 'monthly'),
        fetchCheckoutPreviewAction(companyId, assentos, 'annual_pix'),
        method === 'annual_card'
          ? fetchCheckoutPreviewAction(companyId, assentos, 'annual_card', Number(installments))
          : Promise.resolve(null),
      ]).then(([monthly, annual, card]) => {
        if (!ativo) return;
        const selecionado =
          method === 'monthly' ? monthly : method === 'annual_pix' ? annual : card;
        setPrecos({ monthly, annual, selecionado });
      });
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [open, companyId, assentos, qtdValida, method, installments]);

  // O preview carrega a quantidade que ele precificou: comparar com a digitada é o
  // que impede exibir o total de 3 assentos enquanto o campo já mostra 30 (o
  // debounce abre exatamente essa janela). Enquanto não bate, é "calculando".
  const precoNoAr = qtdValida && precos.monthly?.seats === assentos ? precos : null;
  const calculando = qtdValida && precoNoAr == null;
  // Sem preview ainda: cai no preço que o servidor já mandou no status — nunca
  // num número calculado aqui.
  const mensalCents = precoNoAr?.monthly?.totalCents ?? prices.monthlyCents;
  const anualCents = precoNoAr?.annual?.totalCents ?? prices.annualCents;
  const adicionais = Math.max(0, (qtdValida ? assentos : seats) - 1);
  // Quanto o anual poupa contra 12 mensalidades da MESMA quantidade de usuários —
  // por isso sai dos preços já calculados, e não de `prices`, que é o preço base.
  const economiaAnualCents = Math.max(0, mensalCents * 12 - anualCents);

  const usesCard = method === 'monthly' || method === 'annual_card';

  function submit() {
    setError(null);
    // O cartão é digitado na página do Asaas, mas o cadastro que ela exibe é o nosso:
    // sem ele completo o pagamento falharia lá, com uma mensagem que o cliente não
    // consegue resolver. Melhor pedir aqui.
    if (!perfilCompleto) {
      setError('Complete os dados de cobrança antes de continuar para o pagamento');
      onPedirCadastro?.();
      return;
    }
    if (seatsEditaveis && !qtdValida) {
      setError(
        assentos < minSeats
          ? `A empresa já tem ${minSeats} pessoa(s) — contrate ao menos ${minSeats} usuário(s).`
          : `Escolha entre ${minSeats} e ${prices.maxSeats} usuários.`,
      );
      return;
    }
    const seatsEscolhidos = seatsEditaveis ? assentos : undefined;
    start(async () => {
      const r =
        method === 'monthly'
          ? await subscribeMonthlyAction(companyId, seatsEscolhidos)
          : method === 'annual_pix'
            ? await subscribeAnnualPixAction(companyId, seatsEscolhidos)
            : await subscribeAnnualCardAction(companyId, Number(installments), seatsEscolhidos);
      if (r.error) {
        setError(r.error);
        return;
      }
      // Cartão: o pagamento acontece fora do app. Sair da página aqui é o fluxo —
      // a volta cai em `?checkout=sucesso`, que dispara a conferência sozinha.
      const url = 'checkoutUrl' in r ? r.checkoutUrl : null;
      if (url) {
        window.location.assign(url);
        return;
      }
      setOpen(false);
      router.refresh();
      // Pix gerado → rola até o QR (que só aparece após o refresh do servidor).
      if (method === 'annual_pix') scrollToPix();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Assinar um plano</Button>}
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        // Só fecha pelo X (ou após a compra). Clicar fora ou Esc não fecha —
        // não queremos que o usuário abandone o checkout sem querer.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{titulo ?? 'Assinar o TaskDY'}</DialogTitle>
          <DialogDescription>
            {seatsEditaveis ? (
              'Escolha quantas pessoas vão usar o TaskDY. Dá para comprar mais usuários depois, a qualquer momento.'
            ) : (
              // Sem escolha de quantidade, repetir os preços aqui era ruído: eles já
              // aparecem em cada opção de pagamento abaixo, agora pela quantidade
              // certa. O que falta dizer é quantos assentos e por que estão fixos.
              <>
                Plano para <strong>{seats}</strong> usuário{seats > 1 ? 's' : ''} — os mesmos que a
                empresa já tem contratados. Para mudar a quantidade, use{' '}
                <strong>Comprar usuários</strong> ou <strong>Reduzir usuários</strong>, no quadro de
                usuários: a diferença tem cobrança própria.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Quantidade + conta aberta. A empresa entrava aqui obrigada a assinar por
            1 usuário (o do trial) e comprar o resto depois com proração — o time
            inteiro cabe na primeira contratação. */}
        {seatsEditaveis && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="qtd-assentos">Usuários</Label>
                <p className="text-xs text-muted-foreground">
                  Uma pessoa por usuário{minSeats > 1 ? ` · ${minSeats} já em uso` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={assentos <= minSeats}
                  onClick={() => setQtd(String(Math.max(minSeats, assentos - 1)))}
                  aria-label="Remover um usuário"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="qtd-assentos"
                  className="h-9 w-16 text-center"
                  inputMode="numeric"
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value.replace(/\D/g, ''))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={assentos >= prices.maxSeats}
                  onClick={() => setQtd(String(Math.min(prices.maxSeats, (assentos || 0) + 1)))}
                  aria-label="Adicionar um usuário"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {qtdValida ? (
              <div className="space-y-1 border-t pt-3 text-xs">
                <Linha
                  rotulo="Acesso da empresa + 1 usuário"
                  valor={formatCents(prices.baseCents)}
                />
                <Linha
                  rotulo={`${adicionais} usuário(s) adicional(is) × ${formatCents(prices.extraSeatCents)}`}
                  valor={formatCents(adicionais * prices.extraSeatCents)}
                  apagado={adicionais === 0}
                />
                <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
                  <span>Total mensal</span>
                  {/* Enquanto o preview da quantidade nova não chega, o total fica
                      "calculando" em vez de mostrar o da quantidade antiga — as
                      linhas acima já mudaram, e os dois se contradiriam. */}
                  <span>{calculando ? '…' : `${formatCents(mensalCents)}/mês`}</span>
                </div>
                <p className="text-muted-foreground">
                  {calculando
                    ? 'Calculando o anual…'
                    : `No anual sai ${formatCents(anualCents)}/ano — ${prices.annualDiscountPercent}% de desconto sobre 12 meses.`}
                </p>
              </div>
            ) : (
              <p className="border-t pt-3 text-xs text-destructive">
                {assentos < minSeats
                  ? `A empresa já tem ${minSeats} pessoa(s) — contrate ao menos ${minSeats} usuário(s).`
                  : `Escolha entre ${minSeats} e ${prices.maxSeats} usuários.`}
              </p>
            )}
          </div>
        )}

        {proximoCicloEm && (
          <p className="rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            O plano escolhido passa a valer em{' '}
            <strong>{new Date(proximoCicloEm).toLocaleDateString('pt-BR')}</strong>. Até lá o plano
            atual continua valendo normalmente — nada é cobrado duas vezes pelo mesmo período.
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <RadioGroup value={method} onValueChange={(v) => setMethod(v as Method)} className="gap-2">
          {/* Mensal, anual no cartão, anual no Pix. As duas opções anuais ficam
              lado a lado para a comparação do desconto acontecer sem rolagem. */}
          <MethodOption
            value="monthly"
            label="Mensal no cartão"
            hint={`${formatCents(mensalCents)}/mês, recorrente`}
          />
          <MethodOption
            value="annual_card"
            label="Anual no cartão (até 12×)"
            hint={`${formatCents(anualCents)}/ano — mesmo valor à vista ou parcelado`}
            economia={
              economiaAnualCents > 0 ? `${formatCents(economiaAnualCents)}/ano` : undefined
            }
          />
          <MethodOption
            value="annual_pix"
            label="Anual via Pix"
            hint={`${formatCents(anualCents)} à vista`}
            economia={
              economiaAnualCents > 0 ? `${formatCents(economiaAnualCents)}/ano` : undefined
            }
          />
        </RadioGroup>

        {method === 'annual_card' && (
          <div className="space-y-1">
            <Label>Parcelas</Label>
            <Select value={installments} onValueChange={setInstallments}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}×
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {usesCard && (
          <p className="rounded-md border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            O pagamento com cartão acontece numa <strong>página segura do Asaas</strong>. Ao
            confirmar, você é levado para lá; os dados do cartão nunca passam pelo TaskDY.
          </p>
        )}

        {/* O que vai ser cobrado neste clique, no método escolhido. Parcelar não muda
            o total (R36), então aqui a diferença para a conta acima é só a cadência. */}
        {(precoNoAr?.selecionado || calculando) && (
          <div className="flex items-baseline justify-between rounded-md border bg-muted/40 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">
              {method === 'monthly' ? 'Cobrança mensal' : 'Total a pagar'}
            </span>
            {precoNoAr?.selecionado && !calculando ? (
              <span className="text-right">
                <span className="text-lg font-semibold">
                  {formatCents(precoNoAr.selecionado.totalCents)}
                </span>
                {method === 'monthly' && (
                  <span className="text-sm text-muted-foreground">/mês</span>
                )}
                {precoNoAr.selecionado.installments > 1 &&
                  precoNoAr.selecionado.installmentCents && (
                    <span className="block text-xs text-muted-foreground">
                      {precoNoAr.selecionado.installments}× de{' '}
                      {formatCents(precoNoAr.selecionado.installmentCents)}
                    </span>
                  )}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">calculando…</span>
            )}
          </div>
        )}

        <DialogFooter>
          <Button disabled={pending || (seatsEditaveis && !qtdValida)} onClick={submit}>
            {pending
              ? 'Processando...'
              : method === 'annual_pix'
                ? 'Gerar Pix'
                : !perfilCompleto
                  ? 'Completar cadastro'
                  : 'Ir para o pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Uma linha da conta aberta: rótulo à esquerda, valor à direita. */
function Linha({
  rotulo,
  valor,
  apagado = false,
}: {
  rotulo: string;
  valor: string;
  apagado?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${apagado ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}
    >
      <span>{rotulo}</span>
      <span>{valor}</span>
    </div>
  );
}

function MethodOption({
  value,
  label,
  hint,
  economia,
}: {
  value: string;
  label: string;
  hint: string;
  /** Quanto o anual economiza por ano. Presente = a opção ganha o selo verde. */
  economia?: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent has-[:checked]:border-primary ${
        economia ? 'border-emerald-500/40 bg-emerald-500/5' : ''
      }`}
    >
      <RadioGroupItem value={value} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          {economia && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Economize {economia}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </label>
  );
}

