import { z } from 'zod';

export const COLUMN_NAME_MAX = 100;

export const columnSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(COLUMN_NAME_MAX, `Máximo ${COLUMN_NAME_MAX} caracteres`),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hex inválida')
    .optional(),
});

export type ColumnFormData = z.infer<typeof columnSchema>;
