import { z } from 'zod';

export const createProjetoSchema = z.object({
  name: z.string().min(1, 'Obrigatório').max(120, 'Máximo 120 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  icon: z.string().max(64).optional(),
  iconColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hex inválida')
    .optional(),
});

export type CreateProjetoFormData = z.infer<typeof createProjetoSchema>;
