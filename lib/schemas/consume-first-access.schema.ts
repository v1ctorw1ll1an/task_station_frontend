import { z } from 'zod';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/lib/limits';

export const consumeFirstAccessSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(120, 'Máximo 120 caracteres'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `A senha deve ter pelo menos ${PASSWORD_MIN} caracteres`)
      .max(PASSWORD_MAX, `Máximo ${PASSWORD_MAX} caracteres`),
    confirmPassword: z
      .string()
      .min(1, 'Confirme a senha')
      .max(PASSWORD_MAX, `Máximo ${PASSWORD_MAX} caracteres`),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ConsumeFirstAccessFormData = z.infer<typeof consumeFirstAccessSchema>;
