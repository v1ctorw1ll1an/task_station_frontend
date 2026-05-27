import { z } from 'zod';

export const consumeFirstAccessSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(120, 'Máximo 120 caracteres'),
    newPassword: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .max(72, 'Máximo 72 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a senha').max(72, 'Máximo 72 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ConsumeFirstAccessFormData = z.infer<typeof consumeFirstAccessSchema>;
