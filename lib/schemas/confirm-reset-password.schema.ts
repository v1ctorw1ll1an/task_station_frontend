import { z } from 'zod';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/lib/limits';

export const confirmResetPasswordSchema = z
  .object({
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

export type ConfirmResetPasswordFormData = z.infer<typeof confirmResetPasswordSchema>;
