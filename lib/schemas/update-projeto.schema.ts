import { z } from 'zod';

export const updateProjetoSchema = z.object({
  name: z.string().min(1, 'Obrigatório').optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
});

export type UpdateProjetoFormData = z.infer<typeof updateProjetoSchema>;
