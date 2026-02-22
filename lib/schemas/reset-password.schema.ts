import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').optional().or(z.literal('')),
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
