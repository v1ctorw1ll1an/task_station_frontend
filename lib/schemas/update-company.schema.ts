import { z } from 'zod';

export const updateCompanySchema = z.object({
  legalName: z.string().min(1, 'Obrigatório').optional(),
  taxId: z.string().min(1, 'Obrigatório').optional(),
});

export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
