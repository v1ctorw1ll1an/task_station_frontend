import { z } from 'zod';

export const createCompanySchema = z.object({
  legalName: z.string().min(1, 'Obrigatório').max(120, 'Máximo 120 caracteres'),
  taxId: z
    .string()
    .min(11, 'CNPJ deve ter ao menos 11 caracteres')
    .max(18, 'Máximo 18 caracteres'),
  adminName: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(120, 'Máximo 120 caracteres')
    .optional()
    .or(z.literal('')),
  adminEmail: z.string().email('Email inválido').max(254, 'Email muito longo'),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
