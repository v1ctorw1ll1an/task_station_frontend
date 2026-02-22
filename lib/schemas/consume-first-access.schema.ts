import { z } from 'zod';

export const consumeFirstAccessSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    newPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ConsumeFirstAccessFormData = z.infer<typeof consumeFirstAccessSchema>;
