import { z } from 'zod';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/lib/limits';

export const resetPasswordSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Mínimo 2 caracteres')
      .max(120, 'Máximo 120 caracteres')
      .optional()
      .or(z.literal('')),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Mínimo ${PASSWORD_MIN} caracteres`)
      .max(PASSWORD_MAX, `Máximo ${PASSWORD_MAX} caracteres`),
    confirmPassword: z.string().max(PASSWORD_MAX, `Máximo ${PASSWORD_MAX} caracteres`),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
