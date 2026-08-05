'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, QrCode } from 'lucide-react';
import { fetchSeatPreviewAction, type SeatPreview } from '@/actions/empresa/billing.action';
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
import { formatCents, formatDate, formatDateTime } from '@/components/superadmin/financeiro/format';

export interface SeatPurchase {
  quantity: number;
  paymentKind: 'pix' | 'credit_card';
}

/**
 * Compra de usuários adicionais. A tela responde duas perguntas antes do clique —
 * **quanto** e **quando o usuário entra** — e a resposta mudou:
 *
 * - o preço é **cheio**, sempre: comprar dia 1 ou dia 28 custa o mesmo;
 * - o usuário entra **quando o pagamento for confirmado**, nos dois planos;
 * - no **anual**, cada compra vira uma assinatura própria, que renova na data da
 *   compra — não na do plano. É a parte contraintuitiva, então a tela diz a data.
 *
 * Todos os números vêm do preview do backend — as mesmas funções que cobram.
 */
export function SeatPurchaseDialog({
  companyId,
  open,
  onOpenChange,
  pending,
  perfilCompleto,
  onPedirCadastro,
  onConfirm,
  onCancelPending,
}: {
  companyId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pending: boolean;
  /** Sem dados de cobrança completos o Asaas recusa o cliente na própria página. */
  perfilCompleto: boolean;
  onPedirCadastro?: () => void;
  onConfirm: (compra: SeatPurchase) => void;
  onCancelPending: () => void;
}) {
  const [qty, setQty] = useState('1');
  const [pagamento, setPagamento] = useState<'pix' | 'credit_card'>('credit_card');
  const [preview, setPreview] = useState<SeatPreview | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const quantidade = Number(qty) || 0;
  const anual = preview?.cadencia === 'anual';
  const bloqueado = !!preview?.cobrancaAberta;

  useEffect(() => {
    let ativo = true;
    if (quantidade < 1) return;
    const t = setTimeout(() => {
      void fetchSeatPreviewAction(companyId, quantidade, 'comprar', pagamento).then((p) => {
        if (ativo) setPreview(p);
      });
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [companyId, quantidade, pagamento]);

  function confirm() {
    // Pix não sai daqui; o cartão sim, e a página do Asaas mostra o nosso cadastro.
    if (pagamento === 'credit_card' && !perfilCompleto) {
      setErro('Complete os dados de cobrança antes de continuar para o pagamento');
      onPedirCadastro?.();
      return;
    }
    setErro(null);
    onConfirm({ quantity: quantidade, paymentKind: pagamento });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={pending}>
          <CreditCard className="mr-1 h-4 w-4" />
          Comprar usuários
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Comprar usuários</DialogTitle>
          <DialogDescription>
            {preview
              ? preview.cadencia === 'mensal'
                ? 'Cada usuário custa o valor cheio do mês. A mensalidade só sobe na cobrança seguinte.'
                : 'Cada usuário custa um ano cheio, numa assinatura própria que renova na data da compra.'
              : 'Calculando…'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {preview?.cobrancaAberta && (
            <CobrancaAbertaAviso
              cobranca={preview.cobrancaAberta}
              pending={pending}
              onCancel={onCancelPending}
            />
          )}

          <div className="space-y-1">
            <Label htmlFor="qty">Quantos usuários</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          {!bloqueado && (
            <RadioGroup
              value={pagamento}
              onValueChange={(v) => setPagamento(v as 'pix' | 'credit_card')}
              className="gap-2"
            >
              <FormaDePagamento
                value="pix"
                label="Pix"
                hint="O QR aparece aqui mesmo; o usuário entra assim que for confirmado"
              />
              <FormaDePagamento
                value="credit_card"
                label="Cartão de crédito"
                hint="Você é levado para uma página segura do Asaas"
              />
            </RadioGroup>
          )}

          {preview && quantidade >= 1 && <ExtratoDaCompra preview={preview} anual={anual} />}
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button disabled={pending || quantidade < 1 || bloqueado} onClick={confirm}>
            {bloqueado
              ? 'Resolva a cobrança em aberto'
              : pagamento === 'pix'
                ? 'Gerar Pix'
                : 'Ir para o pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * O extrato: o que sai do bolso agora, o que muda depois e quando o usuário passa a
 * valer. É a diferença entre confirmar sabendo e confirmar no escuro.
 */
function ExtratoDaCompra({ preview, anual }: { preview: SeatPreview; anual: boolean }) {
  const fatura = preview.proximaFatura;

  return (
    <div className="space-y-3 rounded-md border bg-muted/40 p-3 text-sm">
      <Linha
        rotulo="Usuários"
        valor={`${preview.seatsAtuais} → ${preview.seatsDepois}`}
        nota={`${preview.occupiedSeats} de ${preview.seatsDepois} ocupados`}
      />

      <div className="flex items-baseline justify-between gap-2 border-t pt-2">
        <span className="font-medium">Você paga agora</span>
        <span className="text-lg font-semibold">{formatCents(preview.cobrancaAgoraCents)}</span>
      </div>

      {preview.baseDoCalculo && (
        <p className="text-xs text-muted-foreground">{preview.baseDoCalculo}</p>
      )}

      {!anual && fatura && (
        <div className="space-y-1.5 rounded-md bg-background/60 p-2">
          <p className="text-xs font-medium text-muted-foreground">
            A partir da cobrança de {formatDate(fatura.vencimentoEm)}
          </p>
          <Linha
            rotulo={`Mensalidade (${preview.seatsDepois} usuário(s))`}
            valor={formatCents(fatura.mensalidadeCents)}
            miudo
          />
          <p className="text-xs text-muted-foreground">
            A cobrança do mês atual não muda — este usuário já foi pago à parte.
          </p>
        </div>
      )}

      {anual && preview.renovacaoPropriaEm && (
        <div className="space-y-1.5 rounded-md bg-background/60 p-2">
          <p className="text-xs font-medium text-muted-foreground">Assinatura própria</p>
          <p className="text-xs text-muted-foreground">
            Estes usuários renovam sozinhos em {formatDate(preview.renovacaoPropriaEm)} — data
            diferente da renovação do plano ({formatDate(preview.vigenciaEm)}). Para encerrá-los
            antes, fale com o suporte.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {preview.pagamento === 'pix'
          ? 'Você poderá convidar as pessoas assim que o Pix for confirmado.'
          : 'Você poderá convidar as pessoas assim que o cartão for aprovado.'}
      </p>
    </div>
  );
}

/**
 * Uma cobrança de assentos aberta impede outra (nunca duas pagáveis ao mesmo tempo).
 * Para trocar a forma de pagamento, o admin cancela esta — e o cancelamento só vale
 * se o provedor confirmar que ela não foi paga.
 */
function CobrancaAbertaAviso({
  cobranca,
  pending,
  onCancel,
}: {
  cobranca: NonNullable<SeatPreview['cobrancaAberta']>;
  pending: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Já existe uma cobrança de usuários em aberto
      </p>
      <p className="text-xs text-muted-foreground">
        {cobranca.seatsDelta ?? 1} usuário(s) por {formatCents(cobranca.amountCents)} via{' '}
        {cobranca.paymentKind === 'pix' ? 'Pix' : 'cartão'}
        {cobranca.pixExpiresAt ? ` · expira ${formatDateTime(cobranca.pixExpiresAt)}` : ''}. Pague-a
        ou cancele para escolher outra forma de pagamento.
      </p>
      <div className="flex flex-wrap gap-2">
        {cobranca.paymentKind === 'pix' && (
          <Button variant="outline" size="sm" asChild>
            <a href="#pix-pendente">
              <QrCode className="mr-1 h-4 w-4" />
              Ver o Pix
            </a>
          </Button>
        )}
        {/* Checkout ainda válido: continuar de onde parou, sem abrir uma segunda
            cobrança do mesmo pedido. */}
        {cobranca.checkoutUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={cobranca.checkoutUrl}>Continuar pagamento</a>
          </Button>
        )}
        {!cobranca.checkoutUrl && cobranca.invoiceUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={cobranca.invoiceUrl} target="_blank" rel="noopener noreferrer">
              Abrir fatura
            </a>
          </Button>
        )}
        <Button variant="ghost" size="sm" disabled={pending} onClick={onCancel}>
          Cancelar cobrança
        </Button>
      </div>
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  nota,
  miudo,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  miudo?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-2 ${miudo ? 'text-xs' : ''}`}>
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium">
        {valor}
        {nota && <span className="block text-xs font-normal text-muted-foreground">{nota}</span>}
      </span>
    </div>
  );
}

function FormaDePagamento({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent has-[:checked]:border-primary">
      <RadioGroupItem value={value} className="mt-0.5" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </label>
  );
}
