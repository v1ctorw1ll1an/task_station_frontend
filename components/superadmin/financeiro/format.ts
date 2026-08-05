export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}

export const SUBSCRIPTION_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  trial: { label: 'Trial', variant: 'secondary' },
  active: { label: 'Ativo', variant: 'default' },
  past_due: { label: 'Em atraso', variant: 'secondary' },
  readonly: { label: 'Somente leitura', variant: 'destructive' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
  courtesy: { label: 'Cortesia', variant: 'outline' },
};

export const METHOD_LABELS: Record<string, string> = {
  monthly_card: 'Mensal (cartão)',
  annual_pix: 'Anual (Pix)',
  annual_card: 'Anual (cartão)',
};

export const CHARGE_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  paid: { label: 'Pago', variant: 'default' },
  failed: { label: 'Falhou', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'outline' },
  canceled: { label: 'Cancelado', variant: 'outline' },
  refunded: { label: 'Estornado', variant: 'outline' },
};

export const CHARGE_TYPE: Record<string, string> = {
  subscription: 'Assinatura',
  renewal: 'Renovação',
  seat: 'Usuários adicionais',
};

export const PAYMENT_KIND: Record<string, string> = {
  credit_card: 'Cartão',
  pix: 'Pix',
};

export const WEBHOOK_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  received: { label: 'Recebido', variant: 'secondary' },
  processed: { label: 'Processado', variant: 'default' },
  ignored: { label: 'Ignorado', variant: 'outline' },
  failed: { label: 'Falhou (na fila)', variant: 'destructive' },
  dead: { label: 'Esgotado', variant: 'destructive' },
};
