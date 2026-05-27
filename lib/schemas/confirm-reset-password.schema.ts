import { z } from 'zod';

export const confirmResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .max(72, 'Máximo 72 caracteres'),
    confirmPassword: z.string().max(72, 'Máximo 72 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ConfirmResetPasswordFormData = z.infer<typeof confirmResetPasswordSchema>;
