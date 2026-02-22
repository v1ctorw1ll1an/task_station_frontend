import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Obrigatório'),
  description: z.string().optional(),
  adminEmail: z.string().email('Email inválido'),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;
