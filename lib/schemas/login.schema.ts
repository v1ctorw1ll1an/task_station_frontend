import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Email inválido').max(254, 'Email muito longo'),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(72, 'Máximo 72 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
