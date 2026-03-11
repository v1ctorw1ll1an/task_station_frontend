import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Obrigatório'),
  description: z.string().optional(),
  memberIds: z.array(z.string().uuid()).optional().default([]),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;
