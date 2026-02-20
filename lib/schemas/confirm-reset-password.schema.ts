import { z } from 'zod';

export const confirmResetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ConfirmResetPasswordFormData = z.infer<typeof confirmResetPasswordSchema>;
