import { z } from 'zod';

export const updateCompanySchema = z.object({
  legalName: z.string().min(1, 'Obrigatório').max(120, 'Máximo 120 caracteres').optional(),
  taxId: z
    .string()
    .min(11, 'CNPJ deve ter ao menos 11 caracteres')
    .max(18, 'Máximo 18 caracteres')
    .optional(),
});

export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
