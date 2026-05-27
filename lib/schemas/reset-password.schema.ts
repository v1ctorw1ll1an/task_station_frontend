import { z } from 'zod';

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
      .min(8, 'Mínimo 8 caracteres')
      .max(72, 'Máximo 72 caracteres'),
    confirmPassword: z.string().max(72, 'Máximo 72 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
