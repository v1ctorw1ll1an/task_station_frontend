import { z } from 'zod';

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Obrigatório').max(120, 'Máximo 120 caracteres').optional(),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
});

export type UpdateWorkspaceFormData = z.infer<typeof updateWorkspaceSchema>;
