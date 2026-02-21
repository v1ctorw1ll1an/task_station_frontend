import { z } from 'zod';

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Obrigatório').optional(),
  description: z.string().optional(),
});

export type UpdateWorkspaceFormData = z.infer<typeof updateWorkspaceSchema>;
