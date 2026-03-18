import { z } from 'zod';

export const createProjetoSchema = z.object({
  name: z.string().min(1, 'Obrigatório'),
  description: z.string().optional(),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
});

export type CreateProjetoFormData = z.infer<typeof createProjetoSchema>;
