import { z } from 'zod';

export const updateProjetoSchema = z.object({
  name: z.string().min(1, 'Obrigatório').max(120, 'Máximo 120 caracteres').optional(),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  icon: z.string().max(64).optional(),
  iconColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hex inválida')
    .optional(),
});

export type UpdateProjetoFormData = z.infer<typeof updateProjetoSchema>;
