import { z } from 'zod';
import { somenteDigitos, validarCpfCnpj } from '@/lib/tax-id';

/**
 * Perfil de cobrança da empresa. **Não há schema de cartão aqui** — o cartão é
 * digitado na página hospedada do Asaas e nunca passa pelo nosso código.
 *
 * Os campos chegam **mascarados** (é o que o usuário lê no input) e saem daqui só
 * com dígitos: o `transform` roda depois da validação, então quem consome
 * `parsed.data` já manda ao backend o formato que o provedor espera.
 *
 * Atenção: use sempre `parsed.data` no envio, nunca o estado cru do formulário —
 * senão a máscara vaza para a API.
 */
const digitos = (v: string) => somenteDigitos(v);

export const billingProfileSchema = z.object({
  name: z.string().min(2, 'Informe o nome do titular').max(100),
  email: z.string().email('Email inválido').max(254),
  cpfCnpj: z
    .string()
    .refine(validarCpfCnpj, 'CPF ou CNPJ inválido — confira os números digitados')
    .transform(digitos),
  postalCode: z
    .string()
    .refine((v) => somenteDigitos(v).length === 8, 'CEP deve ter 8 dígitos')
    .transform(digitos),
  street: z.string().min(2, 'Informe o logradouro').max(150),
  addressNumber: z.string().min(1, 'Informe o número').max(10),
  addressComplement: z.string().max(100, 'Máximo 100 caracteres').optional(),
  neighborhood: z.string().min(2, 'Informe o bairro').max(100),
  city: z.string().min(2, 'Informe a cidade').max(100),
  state: z
    .string()
    .refine((v) => /^[A-Za-z]{2}$/.test(v.trim()), 'UF deve ter 2 letras')
    .transform((v) => v.trim().toUpperCase()),
  phone: z
    .string()
    .refine(
      (v) => [10, 11].includes(somenteDigitos(v).length),
      'Telefone inválido — informe DDD + número',
    )
    .transform(digitos),
});

/** Entrada (mascarada) — é o que o estado do formulário guarda. */
export type BillingProfileInput = z.input<typeof billingProfileSchema>;
/** Saída (só dígitos) — é o que vai para a API. */
export type BillingProfileOutput = z.output<typeof billingProfileSchema>;
