import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Obrigatório').max(120, 'Máximo 120 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  memberIds: z.array(z.string().uuid()).max(200).optional().default([]),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;
