import { z } from 'zod';

export const LABEL_NAME_MAX = 50;

export const labelSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(LABEL_NAME_MAX, `Máximo ${LABEL_NAME_MAX} caracteres`),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hex inválida')
    .optional(),
});

export type LabelFormData = z.infer<typeof labelSchema>;
