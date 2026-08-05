import { z } from 'zod';
import { somenteDigitos, validarCpfCnpj } from '@/lib/tax-id';
import { PHONE_MAX_DIGITS, PHONE_MIN_DIGITS } from '@/lib/limits';

/**
 * Auto-cadastro (self-service). Sem senha — quem se cadastra recebe um magic
 * link de primeiro acesso por e-mail para ativar a conta. Espelha os limites do
 * RegisterDto do backend.
 *
 * `taxId` e `phone` chegam mascarados e saem só com dígitos. Validar aqui evita
 * que o documento errado só apareça lá na frente, quando o provedor de
 * pagamento recusar a cobrança.
 */
export const registerSchema = z.object({
  legalName: z.string().min(1, 'Obrigatório').max(120, 'Máximo 120 caracteres'),
  taxId: z
    .string()
    .refine(validarCpfCnpj, 'CPF ou CNPJ inválido — confira os números digitados')
    .transform(somenteDigitos),
  ownerName: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(120, 'Máximo 120 caracteres'),
  email: z.string().email('Email inválido').max(254, 'Email muito longo'),
  phone: z
    .string()
    .refine((v) => {
      const d = somenteDigitos(v).length;
      return d >= PHONE_MIN_DIGITS && d <= PHONE_MAX_DIGITS;
    }, 'Telefone inválido — informe DDD + número')
    .transform(somenteDigitos),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
