'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BillingProfileInput } from '@/lib/schemas/billing.schema';

/**
 * Peças compartilhadas dos formulários de cobrança.
 *
 * Não existe mais formulário de cartão no produto: número, validade e CVV são
 * digitados na página hospedada do Asaas. O que sobrou aqui é o perfil de cobrança —
 * quem paga, onde e com que documento.
 */
export const emptyPerfil: BillingProfileInput = {
  name: '',
  email: '',
  cpfCnpj: '',
  postalCode: '',
  street: '',
  addressNumber: '',
  addressComplement: '',
  neighborhood: '',
  city: '',
  state: '',
  phone: '',
};

export function CampoTexto({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  inputMode,
  maxLength,
  disabled,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  inputMode?: 'numeric' | 'text';
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        // Nunca `undefined` — mantém o input sempre controlado.
        value={value ?? ''}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Esconde o miolo do documento nos resumos. O valor completo continua a um clique em
 * "Editar" — a ideia é só não deixar o CPF inteiro aberto na tela de quem compra
 * com alguém olhando por cima do ombro.
 */
export function mascararDocumento(valor: string): string {
  const d = valor.replace(/\D/g, '');
  if (d.length === 11) return `CPF •••.•••.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return `CNPJ ••.•••.•••/${d.slice(8, 12)}-${d.slice(12)}`;
  return `Documento •••${d.slice(-2)}`;
}

export function formatarCep(valor: string): string {
  const d = valor.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : valor;
}

export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor;
}

/** Resumo de uma linha do perfil de cobrança — usado antes de mandar para o Asaas. */
export function ResumoDoPerfil({ perfil }: { perfil: BillingProfileInput }) {
  return (
    <div className="space-y-0.5 text-xs">
      <p className="font-medium text-foreground">Cobrança em nome de {perfil.name}</p>
      <p className="text-muted-foreground">
        {mascararDocumento(perfil.cpfCnpj)} · {perfil.street}, {perfil.addressNumber}
        {perfil.addressComplement ? ` — ${perfil.addressComplement}` : ''}
      </p>
      <p className="text-muted-foreground">
        {perfil.neighborhood}, {perfil.city}/{perfil.state} · CEP {formatarCep(perfil.postalCode)}
      </p>
      <p className="text-muted-foreground">
        {formatarTelefone(perfil.phone)} · {perfil.email}
      </p>
    </div>
  );
}
