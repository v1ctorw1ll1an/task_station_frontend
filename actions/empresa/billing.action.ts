'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

interface BillingActionResult {
  success?: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Resposta das operações que levam ao Checkout hospedado do Asaas. `checkoutUrl` é
 * para onde a tela redireciona; vem `null` quando o pagamento é Pix (o QR aparece no
 * painel) ou quando não houve nada a cobrar.
 */
export interface CheckoutSessionResult {
  checkoutUrl?: string | null;
  expiresAt?: string | null;
  error?: string;
}

async function post(
  companyId: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<BillingActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const message = Array.isArray(b.message) ? b.message[0] : b.message;
      return { error: message ?? 'Erro ao processar a cobrança' };
    }
    const data = await res.json().catch(() => ({}));
    revalidatePath(`/empresa/${companyId}/cobranca`);
    return { success: true, data };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

/** Mesma forma do `post`, para os endpoints que editam sem cobrar. */
async function patch(
  companyId: string,
  path: string,
  body: Record<string, unknown>,
): Promise<BillingActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}/${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const message = Array.isArray(b.message) ? b.message[0] : b.message;
      return { error: message ?? 'Erro ao salvar' };
    }
    revalidatePath(`/empresa/${companyId}/cobranca`);
    return { success: true, data: await res.json().catch(() => ({})) };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

/** Extrai o link do checkout da resposta do backend. */
function comoCheckout(r: BillingActionResult): CheckoutSessionResult {
  if (r.error) return { error: r.error };
  const d = r.data as { checkoutUrl?: string | null; expiresAt?: string | null } | undefined;
  return { checkoutUrl: d?.checkoutUrl ?? null, expiresAt: d?.expiresAt ?? null };
}

/**
 * `seats` é o total de assentos contratados (inclui o assento da base). Omitido,
 * o backend mantém o que a empresa já tem — o assento único do trial, no caso
 * comum. Só vale sem plano vigente; com plano, assento se compra à parte.
 */
export async function subscribeMonthlyAction(
  companyId: string,
  seats?: number,
): Promise<CheckoutSessionResult> {
  return comoCheckout(await post(companyId, 'assinar/mensal', seats ? { seats } : {}));
}

export async function subscribeAnnualPixAction(companyId: string, seats?: number) {
  return post(companyId, 'assinar/anual-pix', seats ? { seats } : {});
}

/**
 * `installments` é o **teto** de parcelas oferecido na página do Asaas — quem escolhe
 * em quantas vezes vai pagar é o cliente, lá.
 */
export async function subscribeAnnualCardAction(
  companyId: string,
  installments: number,
  seats?: number,
): Promise<CheckoutSessionResult> {
  return comoCheckout(
    await post(companyId, 'assinar/anual-cartao', { installments, ...(seats ? { seats } : {}) }),
  );
}

/**
 * Compra usuários adicionais. `paymentKind` decide o caminho: `credit_card` devolve o
 * link do checkout do Asaas; `pix` gera o QR, que aparece no painel após o refresh.
 */
export async function buySeatsAction(
  companyId: string,
  quantity: number,
  paymentKind: 'pix' | 'credit_card' = 'credit_card',
): Promise<CheckoutSessionResult> {
  return comoCheckout(await post(companyId, 'assentos/comprar', { quantity, paymentKind }));
}

/** Cancela a cobrança de assentos em aberto para escolher outra forma de pagamento. */
export async function cancelPendingSeatChargeAction(companyId: string) {
  return post(companyId, 'assentos/cancelar-pendente');
}

/**
 * Reduz assentos — só no plano mensal. `userIds` são as pessoas que perdem o acesso:
 * elas continuam trabalhando até o fim do ciclo já pago e saem na renovação. Assentos
 * vagos são devolvidos sem selecionar ninguém.
 */
export async function reduceSeatsAction(
  companyId: string,
  quantity: number,
  userIds: string[] = [],
) {
  return post(companyId, 'assentos/reduzir', { quantity, userIds });
}

export interface SeatPreview {
  acao: 'comprar' | 'reduzir';
  quantity: number;
  method: string | null;
  cadencia: 'mensal' | 'anual';
  seatsAtuais: number;
  seatsDepois: number;
  occupiedSeats: number;
  precisaLiberar: number;
  valorHojeCents: number;
  valorDepoisCents: number;
  vigenciaEm: string | null;
  /** Cobrança de assentos ainda aberta — bloqueia uma nova até ser paga ou cancelada. */
  cobrancaAberta: {
    id: string;
    amountCents: number;
    paymentKind: 'pix' | 'credit_card';
    seatsDelta: number | null;
    invoiceUrl: string | null;
    checkoutUrl: string | null;
    pixExpiresAt: string | null;
    createdAt: string;
  } | null;
  /** A operação existe neste plano? Reduzir só existe no mensal. */
  disponivel: boolean;
  indisponivelPorque: string | null;
  /** Quanto sai do bolso agora — valor cheio, sem proração. */
  cobrancaAgoraCents: number;
  pagamento?: 'pix' | 'credit_card';
  baseDoCalculo: string | null;
  /** O que a próxima cobrança da recorrência vai custar (só no mensal). */
  proximaFatura: { vencimentoEm: string | null; mensalidadeCents: number } | null;
  /** Só no anual: a assinatura de assentos renova nesta data, não na do plano. */
  renovacaoPropriaEm?: string | null;
  assentoDisponivelEm: 'no_pagamento' | 'na_renovacao';
}

export interface CheckoutPreview {
  method: 'monthly' | 'annual_pix' | 'annual_card';
  seats: number;
  totalCents: number;
  installments: number;
  /** Só no anual-cartão parcelado: valor de cada parcela e o ajuste na última. */
  installmentCents?: number;
  lastInstallmentCents?: number;
}

/**
 * Preço de uma quantidade de assentos, calculado pelo backend. A tela nunca
 * reimplementa a fórmula: quem responde aqui é o mesmo módulo que cobra, então
 * o número exibido é o número cobrado.
 */
export async function fetchCheckoutPreviewAction(
  companyId: string,
  seats: number,
  method: 'monthly' | 'annual_pix' | 'annual_card',
  installments?: number,
): Promise<CheckoutPreview | null> {
  const session = await getSession();
  if (!session || seats < 1) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const params = new URLSearchParams({ seats: String(seats), method });
  if (installments && installments > 1) params.set('installments', String(installments));
  try {
    const res = await fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}/preview?${params}`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as CheckoutPreview;
  } catch {
    return null;
  }
}

/** Simula o efeito da mudança de assentos antes de confirmar. */
export async function fetchSeatPreviewAction(
  companyId: string,
  quantity: number,
  acao: 'comprar' | 'reduzir',
  pagamento?: 'pix' | 'credit_card',
): Promise<SeatPreview | null> {
  const session = await getSession();
  if (!session || quantity < 1) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const params = new URLSearchParams({ quantity: String(quantity), acao });
  if (pagamento) params.set('pagamento', pagamento);
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/billing/empresa/${companyId}/assentos/preview?${params}`,
      { headers: { Authorization: `Bearer ${session.token}` }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    return (await res.json()) as SeatPreview;
  } catch {
    return null;
  }
}

export interface SeatHolder {
  userId: string;
  role: string;
  scheduledRemovalAt: string | null;
  user: { name: string; email: string };
}

/** Quem ocupa assento hoje (para o admin escolher quem sai na redução). */
export async function fetchSeatHoldersAction(companyId: string): Promise<SeatHolder[]> {
  const session = await getSession();
  if (!session) return [];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}/assentos/membros`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return (await res.json()) as SeatHolder[];
  } catch {
    return [];
  }
}

export async function cancelSubscriptionAction(companyId: string) {
  return post(companyId, 'cancelar');
}

/**
 * Desfaz o cancelamento agendado. No mensal a recorrência precisa ser recriada com um
 * cartão — e o cartão só existe na página do Asaas, então volta um `checkoutUrl`.
 */
export async function reactivateSubscriptionAction(
  companyId: string,
): Promise<CheckoutSessionResult> {
  return comoCheckout(await post(companyId, 'reativar'));
}

/**
 * Troca o cartão da assinatura mensal: abre um checkout novo, onde o cliente digita o
 * cartão. **Não** quita a fatura em atraso — para isso existe `fetchFaturaAtrasoAction`.
 */
export async function trocarCartaoAction(companyId: string): Promise<CheckoutSessionResult> {
  return comoCheckout(await post(companyId, 'cartao/trocar'));
}

/** Link da fatura em atraso na página do Asaas (o "Pagar fatura em atraso"). */
export async function fetchFaturaAtrasoAction(
  companyId: string,
): Promise<{ invoiceUrl?: string | null; error?: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}/fatura-atraso`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Não foi possível obter a fatura' };
    const d = (await res.json()) as { invoiceUrl?: string | null };
    return { invoiceUrl: d.invoiceUrl ?? null };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export interface EnderecoCep {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Preenche o endereço a partir do CEP. Nunca falha de forma bloqueante: CEP fora do ar
 * ou inexistente devolve `null` e o cliente digita à mão.
 */
export async function fetchCepAction(
  companyId: string,
  cep: string,
): Promise<EnderecoCep | null> {
  const session = await getSession();
  const digitos = cep.replace(/\D/g, '');
  if (!session || digitos.length !== 8) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}/cep/${digitos}`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { encontrado: boolean; endereco: EnderecoCep | null };
    return d.encontrado ? d.endereco : null;
  } catch {
    return null;
  }
}

/**
 * "Já paguei" — força a conferência no Asaas agora, sem esperar o webhook.
 * `pago: false` significa "ainda não identificado", não "falhou".
 */
export async function conferirPagamentoAction(
  companyId: string,
): Promise<{ pago?: boolean; error?: string }> {
  const r = await post(companyId, 'conferir-pagamento');
  if (r.error) return { error: r.error };
  return { pago: (r.data as { pago?: boolean } | undefined)?.pago === true };
}

/**
 * Atualiza os dados de cobrança. Não cobra nada nem mexe no plano — mas é
 * pré-requisito do pagamento: é este cadastro que a página do Asaas exibe.
 */
export async function updateBillingAddressAction(
  companyId: string,
  endereco: Record<string, unknown>,
) {
  return patch(companyId, 'endereco-cobranca', endereco);
}

/** Consulta o status de cobrança (para polling do Pix no client). */
export async function getBillingStatusAction(companyId: string): Promise<BillingActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Erro ao consultar status' };
    return { success: true, data: await res.json() };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
