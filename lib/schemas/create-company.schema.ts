import { z } from 'zod';
import { somenteDigitos, validarCpfCnpj } from '@/lib/tax-id';

export const createCompanySchema = z.object({
  legalName: z.string().min(1, 'Obrigatório').max(120, 'Máximo 120 caracteres'),
  taxId: z
    .string()
    .refine(validarCpfCnpj, 'CPF ou CNPJ inválido — confira os números digitados')
    .transform(somenteDigitos),
  adminName: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(120, 'Máximo 120 caracteres')
    .optional()
    .or(z.literal('')),
  adminEmail: z.string().email('Email inválido').max(254, 'Email muito longo'),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
