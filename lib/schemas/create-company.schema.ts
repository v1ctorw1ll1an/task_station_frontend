import { z } from 'zod';

export const createCompanySchema = z.object({
  legalName: z.string().min(1, 'Obrigatório'),
  taxId: z.string().min(1, 'Obrigatório'),
  adminName: z.string().optional(),
  adminEmail: z.string().email('Email inválido'),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
